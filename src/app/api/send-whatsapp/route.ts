import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerName, phone, items, total, address } = body;

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
                    total: total,
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
                    `${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
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
                            <h3 style="color: #00d4ff; text-align: right; margin-bottom: 0;">Total: $${total.toFixed(2)}</h3>
                        </div>

                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            This order has been saved to your Admin Dashboard. Log in to manage it.
                        </p>
                    </div>
                `;

                const { data, error } = await resend.emails.send({
                    from: 'Mersal Orders <onboarding@resend.dev>',
                    to: [adminEmail],
                    subject: `🎮 New Order from ${customerName} - $${total.toFixed(2)}`,
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

        // Fire and forget email
        sendEmail();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Email API] Error:', error);
        return NextResponse.json({ success: true, warning: 'Internal logic error' });
    }
}
