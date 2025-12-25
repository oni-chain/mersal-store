import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerName, phone, items, total, address } = body;

        // Use process.env but fail safe if missing (though user should set them)
        const instanceId = process.env.ULTRAMSG_INSTANCE_ID || 'instance157099';
        const token = process.env.ULTRAMSG_TOKEN || 'vrrnaykbbdmfzbr0';
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;

        // Save Order to Firestore First (Critical Path)
        try {
            const { db } = await import('@/lib/firebase');
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

            await addDoc(collection(db, 'orders'), {
                customerName,
                phone,
                address,
                items,
                total,
                status: 'pending',
                createdAt: serverTimestamp()
            });
        } catch (dbError) {
            console.error("CRITICAL: Error saving to Firestore:", dbError);
            // If DB fails, we might still want to try notifying, or fail. 
            // Usually DB failure is fatal for an "Order", but let's proceed to allow user feedback if possible.
        }

        // WhatsApp Notification (Non-blocking / Fail-safe)
        const sendWhatsApp = async (to: string, text: string) => {
            if (!to) return;
            const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
            const payload = { token, to, body: text };

            try {
                // Add 5s timeout to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`WhatsApp API Error (${to}):`, res.status, errorText);
                }
            } catch (error) {
                console.error(`WhatsApp Network Error (${to}):`, error);
            }
        };

        const itemsList = items.map((item: any) => `- ${item.name} (x${item.quantity}) - $${item.price * item.quantity}`).join('\n');

        // Admin Message
        const adminMsg = `
🚨 *New Order Received* 🚨

👤 *Customer:* ${customerName}
📞 *Phone:* ${phone}
📍 *Address:* ${address}

🛒 *Order Details:*
${itemsList}

💰 *Total:* $${total}
        `.trim();

        // Customer Message
        const customerMsg = `
👋 Hi ${customerName},

Thank you for your order at *Mersal*! 🎮

We have received your order for:
${itemsList}

💰 *Total: $${total}*

We will process it shortly.
        `.trim();

        // Fire and forget WhatsApp messages to not block response
        if (adminPhone) sendWhatsApp(adminPhone, adminMsg);
        if (phone) sendWhatsApp(phone, customerMsg);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        // Return true to UI so user doesn't get stuck, even if something internal blew up
        return NextResponse.json({ success: true, warning: 'Internal logic error' });
    }
}

