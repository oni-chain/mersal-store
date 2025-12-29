import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/order-logic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { callback_query } = body;

        if (!callback_query) {
            return NextResponse.json({ ok: true });
        }

        const data = callback_query.data; // e.g., "confirm_UUID" or "cancel_UUID"
        const chatId = callback_query.message.chat.id.toString();
        const messageId = callback_query.message.message_id;
        const adminChatId = process.env.TELEGRAM_CHAT_ID;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        // 1. Basic Security: Check if request is from the admin chat
        if (chatId !== adminChatId) {
            console.warn(`Unauthorized Telegram interaction from chat ${chatId}`);
            return NextResponse.json({ ok: true });
        }

        // 2. Parse action and ID
        const [action, orderId] = data.split('_');
        const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';

        console.log(`[Telegram Webhook] ${action} order: ${orderId}`);

        // 3. Update Order in Database and update Stock/Sold Count
        try {
            await updateOrderStatus(orderId, newStatus);
        } catch (err: any) {
            console.error(`[Telegram Webhook] Database update failed: ${err.message}`);
            // Answer with error message
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callback_query_id: callback_query.id,
                    text: `❌ Error: ${err.message}`,
                    show_alert: true
                })
            });
            return NextResponse.json({ ok: true });
        }

        // 4. Answer Callback Query (removes loading state)
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callback_query.id,
                text: action === 'confirm' ? "✅ Order Confirmed & Stock Updated!" : "❌ Order Cancelled & Stock Restored!",
            })
        });

        // 5. Edit original message to show final status and remove buttons
        const originalText = callback_query.message.text;
        const statusEmoji = action === 'confirm' ? '✅ CONFIRMED' : '❌ CANCELLED';
        const updatedText = `${originalText}\n\n--------------------------\n⚡️ <b>Status updated via Telegram: ${statusEmoji}</b>`;

        await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: updatedText,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] } // Clear buttons
            })
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[Telegram Webhook] Error:', error);
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }
}
