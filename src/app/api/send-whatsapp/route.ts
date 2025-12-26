import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerName, phone, items, total, address } = body;

        // Use process.env or hardcoded fallbacks from user
        const instanceId = process.env.ULTRAMSG_INSTANCE_ID || 'instance157099';
        const token = process.env.ULTRAMSG_TOKEN || 'vrrnaykbbdmfzbr0';
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '+9647708511364';

        console.log(`[WhatsApp API] Attempting to send order. Instance: ${instanceId}, Admin: ${adminPhone}`);

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
            const params = new URLSearchParams();
            params.append('token', token);
            params.append('to', to);
            params.append('body', text);

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString(),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const resText = await res.text();
                console.log(`[WhatsApp API] Response from ${to}:`, res.status, resText);

                if (!res.ok) {
                    console.error(`WhatsApp API Error (${to}):`, res.status, resText);
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
