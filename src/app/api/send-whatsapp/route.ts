import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerName, phone, items, total, address } = body;

        // Use process.env
        const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
        const token = process.env.ULTRAMSG_TOKEN;
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;

        console.log(`[WhatsApp API] Attempting to send order. Instance: ${instanceId ? 'SET' : 'MISSING'}, Token: ${token ? 'SET' : 'MISSING'}, AdminPhone: ${adminPhone || 'MISSING'}`);

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
        } catch (dbError) {
            console.error("CRITICAL: Error saving to Supabase:", dbError);
        }

        // WhatsApp Notification (Non-blocking / Fail-safe)
        const sendWhatsApp = async (to: string, text: string) => {
            if (!to) return;
            const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
            const payload = { token, to, body: text };

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const resData = await res.json();
                console.log(`[WhatsApp API] Response from ${to}:`, res.status, resData);

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`WhatsApp API Error (${to}):`, res.status, errorText);
                }
            } catch (error) {
                console.error(`WhatsApp Network Error (${to}):`, error);
            }
        };

        const itemsList = items.map((item: any) => `- ${item.name} (x${item.quantity}) - $${item.price * item.quantity}`).join('\n');

        const adminMsg = `
🚨 *New Order Received* 🚨

👤 *Customer:* ${customerName}
📞 *Phone:* ${phone}
📍 *Address:* ${address}

🛒 *Order Details:*
${itemsList}

💰 *Total:* $${total}
        `.trim();

        const customerMsg = `
👋 Hi ${customerName},

Thank you for your order at *Mersal*! 🎮

We have received your order for:
${itemsList}

💰 *Total: $${total}*

We will process it shortly.
        `.trim();

        // Fire and forget WhatsApp messages
        if (adminPhone) sendWhatsApp(adminPhone, adminMsg);
        if (phone) sendWhatsApp(phone, customerMsg);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: true, warning: 'Internal logic error' });
    }
}
