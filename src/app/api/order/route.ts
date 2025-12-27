import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

// Initialize Resend lazily or check for API key
const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    return new Resend(apiKey);
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerName, phone, items, total, totalUSD, address } = body;

        // Server-side Iraqi Phone Validation
        const iraqiPhoneRegex = /^(07|009647|\+9647|7)\d{9}$/;
        if (!phone || !iraqiPhoneRegex.test(phone.toString().replace(/\s/g, ''))) {
            return NextResponse.json({ success: false, error: 'Invalid Iraqi phone number' }, { status: 400 });
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'AliMainMail@proton.me';

        console.log(`[Email API] Processing order for ${customerName}`);

        // Save Order to Supabase (Critical Path)
        try {
            const { error: dbError } = await supabase
                .from('orders')
                .insert([{
                    customer_name: customerName,
                    phone: phone,
                    address: address,
                    items: items,
                    total: total, // IQD Total
                    total_usd: totalUSD, // Add if column exists, or store in JSON
                    status: 'pending'
                }]);

            if (dbError) throw dbError;
            console.log('[Email API] Order saved to Supabase successfully');
        } catch (dbError) {
            console.error("CRITICAL: Error saving to Supabase:", dbError);
        }

        // Email Notification (Non-blocking / Fail-safe)
        const sendEmail = async () => {
            try {
                const itemsList = items.map((item: any) =>
                    `${item.name} (x${item.quantity}) - ${item.unitPriceIQD.toLocaleString()} IQD ($${item.unitPriceUSD.toFixed(2)})`
                ).join('\n');

                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">
                            🚨 New Order Received - Mersal
                        </h2>
                        
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Customer Information</h3>
                            <p><strong>Name:</strong> ${customerName}</p>
                            <p><strong>Phone:</strong> ${phone}</p>
                            <p><strong>Address:</strong> ${address}</p>
                        </div>

                        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                            <h3 style="margin-top: 0;">Order Details</h3>
                            <pre style="background: #f9f9f9; padding: 15px; border-radius: 4px; overflow-x: auto;">${itemsList}</pre>
                            <div style="text-align: right; margin-top: 20px;">
                                <h2 style="color: #00d4ff; margin: 0;">Total IQD: ${total.toLocaleString()} د.ع</h2>
                                <h3 style="color: #666; margin: 5px 0 0 0;">Total USD: $${totalUSD.toFixed(2)}</h3>
                            </div>
                        </div>

                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            This order has been saved to your Admin Dashboard. Log in to manage it.
                        </p>
                    </div>
                `;

                const resend = getResendClient();
                if (!resend) {
                    console.warn('[Email API] Resend API key missing, skipping email notification');
                    return;
                }

                const { data, error } = await resend.emails.send({
                    from: 'Mersal Orders <onboarding@resend.dev>',
                    to: [adminEmail],
                    subject: `🎮 New Order: ${customerName} - ${total.toLocaleString()} IQD`,
                    html: emailHtml,
                });

                if (error) {
                    console.error('[Email API] Resend error:', error);
                } else {
                    console.log('[Email API] Email sent successfully:', data);
                }
            } catch (error) {
                console.error('[Email API] Email sending failed:', error);
            }
        };

        // Telegram Notification (Awaited for reliability on Vercel)
        const sendTelegramNotification = async () => {
            try {
                const token = process.env.TELEGRAM_BOT_TOKEN;
                const chatId = process.env.TELEGRAM_CHAT_ID;

                console.log(`[Telegram Debug] Attempting to send to Chat ID: ${chatId}`);

                if (!token || !chatId) {
                    console.error('[Order API] Telegram credentials missing. BOT_TOKEN or CHAT_ID is null.');
                    return;
                }

                // Check for Bot ID vs Personal ID mismatch
                if (token.startsWith(chatId)) {
                    console.warn('[Order API] WARNING: The Chat ID matches the Bot ID. Bots cannot message themselves. Please use your personal Chat ID.');
                }

                const itemsList = items.map((item: any) =>
                    `• ${item.name} (x${item.quantity}) - <b>${item.unitPriceIQD.toLocaleString()} IQD</b>`
                ).join('\n');

                const timestamp = new Date().toLocaleString('en-IQ', { timeZone: 'Asia/Baghdad' });

                const message = `📦 <b>New Order Received - Mersal - مرسال</b>

👤 <b>Customer Name:</b> ${customerName}
📞 <b>Phone:</b> ${phone}
📍 <b>Address:</b> ${address}

--------------------------
🛒 <b>Products:</b>
${itemsList}
--------------------------

💰 <b>Total Price:</b> $${totalUSD.toFixed(2)} / <b>${total.toLocaleString()} IQD</b>
🕒 <b>Order Time:</b> ${timestamp}`;

                const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'HTML',
                    }),
                });

                const result = await response.json();
                if (!response.ok) {
                    console.error('[Order API] Telegram API Error:', JSON.stringify(result));
                } else {
                    console.log('[Order API] Telegram notification sent successfully');
                }
            } catch (error) {
                console.error('[Order API] Telegram network/logic error:', error);
            }
        };

        // Execute notifications (await ensures Vercel doesn't kill the process early)
        await Promise.all([
            sendEmail(),
            sendTelegramNotification()
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Email API] Error:', error);
        return NextResponse.json({ success: true, warning: 'Internal logic error' });
    }
}
