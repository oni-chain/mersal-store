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

        // Telegram Notification (Non-blocking / Fail-safe)
        const sendTelegramNotification = async () => {
            try {
                const token = process.env.TELEGRAM_BOT_TOKEN;
                const chatId = process.env.TELEGRAM_CHAT_ID;

                if (!token || !chatId) {
                    console.warn('[Order API] Telegram credentials missing, skipping notification');
                    return;
                }

                const itemsList = items.map((item: any) =>
                    `• ${item.name} (x${item.quantity}) - ${item.unitPriceIQD.toLocaleString()} IQD`
                ).join('\n');

                const timestamp = new Date().toLocaleString('en-IQ', { timeZone: 'Asia/Baghdad' });

                const message = `📦 *New Order Received!*

👤 *Customer Name:* ${customerName}
📞 *Phone:* ${phone}
📍 *Address:* ${address}

--------------------------
🛒 *Products:*
${itemsList}
--------------------------

💰 *Total Price:* $${totalUSD.toFixed(2)} / ${total.toLocaleString()} IQD
🕒 *Order Time:* ${timestamp}`;

                const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'Markdown',
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    console.error('[Order API] Telegram notification failed:', error);
                } else {
                    console.log('[Order API] Telegram notification sent successfully');
                }
            } catch (error) {
                console.error('[Order API] Telegram notification failed:', error);
            }
        };

        // Fire and forget notifications
        sendEmail();
        sendTelegramNotification();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Email API] Error:', error);
        return NextResponse.json({ success: true, warning: 'Internal logic error' });
    }
}
