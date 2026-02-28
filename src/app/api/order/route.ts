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
        const { customerName, phone, secondaryPhone, province, items, total, subtotal, shippingFee, totalUSD, address, orderNotes } = body;

        // Server-side Iraqi Phone Validation
        const iraqiPhoneRegex = /^(07|009647|\+9647|7)\d{9}$/;
        if (!phone || !iraqiPhoneRegex.test(phone.toString().replace(/\s/g, ''))) {
            return NextResponse.json({ success: false, error: 'Invalid Iraqi phone number' }, { status: 400 });
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'AliMainMail@proton.me';

        console.log(`[Email API] Processing order for ${customerName}`);

        // Save Order to Supabase (Mandatory Critical Path)
        let orderId = '';
        const { data: newOrder, error: dbError } = await supabase
            .from('orders')
            .insert([{
                customer_name: customerName,
                phone: phone,
                secondary_phone: secondaryPhone,
                province: province,
                address: address,
                order_notes: orderNotes,
                items: items,
                total: total, // IQD Total
                subtotal: subtotal,
                shipping_fee: shippingFee,
                status: 'pending'
            }])
            .select('id')
            .single();

        if (dbError || !newOrder?.id) {
            console.error("CRITICAL: Error saving to Supabase:", dbError);
            return NextResponse.json({
                success: false,
                error: `Database error: ${dbError?.message || 'Unknown error'}`
            }, { status: 500 });
        }

        orderId = newOrder.id;
        console.log(`[Order API] Order saved successfully: ${orderId}`);

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
                            ${secondaryPhone ? `<p><strong>Secondary Phone:</strong> ${secondaryPhone}</p>` : ''}
                            <p><strong>Province:</strong> ${province}</p>
                            <p><strong>Address:</strong> ${address}</p>
                            ${orderNotes ? `<p><strong>Order Notes:</strong> ${orderNotes}</p>` : ''}
                            <p><strong>Order ID:</strong> ${orderId}</p>
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

                if (!token || !chatId) return;

                const itemsList = items.map((item: any) =>
                    `• ${item.name} (x${item.quantity}) - <b>${item.unitPriceIQD.toLocaleString()} IQD</b>`
                ).join('\n');

                const timestamp = new Date().toLocaleString('en-IQ', { timeZone: 'Asia/Baghdad' });

                const message = `📦 <b>New Order Received - Mersal - مرسال</b>
\n👤 <b>Customer Name:</b> ${customerName}
📞 <b>Primary Phone:</b> ${phone}
${secondaryPhone ? `📞 <b>Secondary Phone:</b> ${secondaryPhone}` : ''}
📍 <b>Province:</b> ${province}
📍 <b>Address:</b> ${address}
${orderNotes ? `📝 <b>Notes:</b> ${orderNotes}` : ''}
\n--------------------------
🛒 <b>Products:</b>
${itemsList}
--------------------------
\n💰 <b>Total Price:</b> $${totalUSD.toFixed(2)} / <b>${total.toLocaleString()} IQD</b>
🕒 <b>Order Time:</b> ${timestamp}`;

                const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "✅ Confirm Order", callback_data: `confirm_${orderId}` },
                                    { text: "❌ Cancel", callback_data: `cancel_${orderId}` }
                                ]
                            ]
                        }
                    }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    console.error('[Order API] Telegram API Error:', JSON.stringify(result));
                }
            } catch (error) {
                console.error('[Order API] Telegram error:', error);
            }
        };

        // Execute notifications
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
