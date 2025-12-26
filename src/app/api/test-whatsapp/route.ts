import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const instanceId = 'instance157099';
        const token = 'vrrnaykbbdmfzbr0';
        const adminPhone = '+9647708511364';

        const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;

        const params = new URLSearchParams();
        params.append('token', token);
        params.append('to', adminPhone);
        params.append('body', 'Test message from Mersal - WhatsApp API is working! 🎮');

        console.log('[TEST] Sending to:', url);
        console.log('[TEST] Params:', params.toString());

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const responseText = await response.text();
        console.log('[TEST] Response Status:', response.status);
        console.log('[TEST] Response Body:', responseText);

        return NextResponse.json({
            success: response.ok,
            status: response.status,
            response: responseText,
            sentTo: adminPhone
        });
    } catch (error: any) {
        console.error('[TEST] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
