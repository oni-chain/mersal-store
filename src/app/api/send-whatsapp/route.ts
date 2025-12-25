import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerName, phone, items, total, address } = body;

        const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
        const token = process.env.ULTRAMSG_TOKEN;
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;

        if (!instanceId || !token || !adminPhone) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Format message for Admin
        const itemsList = items.map((item: any) => `- ${item.name} (x${item.quantity}) - $${item.price * item.quantity}`).join('\n');
        const message = `
🚨 *New Order Received* 🚨

👤 *Customer:* ${customerName}
📞 *Phone:* ${phone}
📍 *Address:* ${address}

🛒 *Order Details:*
${itemsList}

💰 *Total:* $${total}
    `.trim();

        // Save Order to Firestore
        try {
            const { db } = await import('@/lib/firebase'); // Lazy load to avoid build issues on edge if not using edge runtime
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
            console.error("Error saving to Firestore:", dbError);
            // Continue to send WhatsApp even if DB fails, or handle accordingly
        }

        // Send to Admin
        const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
        const payload = {
            token: token,
            to: adminPhone,
            body: message
        };

        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Send to Customer
        if (phone) {
            const customerMessage = `
👋 Hi ${customerName},

Thank you for your order at *Samurai Gaming*! 🎮

We have received your order for:
${itemsList}

💰 *Total: $${total}*

We will process it shortly and update you on the shipping status.

_Game on!_ 🕹️
        `.trim();

            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    to: phone,
                    body: customerMessage
                })
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
