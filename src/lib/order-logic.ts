import { supabase } from './supabase';

export async function updateOrderStatus(orderId: string, newStatus: string) {
    // 1. Fetch current order state
    const { data: order, error: fetchOrderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (fetchOrderError || !order) {
        throw new Error(`Order not found: ${orderId}`);
    }

    const oldStatus = order.status;
    if (oldStatus === newStatus) return { success: true, message: 'Status already up to date' };

    // 2. Handle Stock & Sold Count updates
    if (order.items && Array.isArray(order.items)) {
        // Situation A: Confirming a pending/cancelled order -> Reduce Stock, Increase Sold Count
        if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
            for (const item of order.items) {
                const { data: product, error: productError } = await supabase
                    .from('products')
                    .select('stock, sold_count')
                    .eq('id', item.id)
                    .single();

                if (productError || !product) continue;

                const newStock = Math.max(0, (product.stock || 0) - (item.quantity || 0));
                const newSoldCount = (product.sold_count || 0) + (item.quantity || 0);

                await supabase
                    .from('products')
                    .update({ stock: newStock, sold_count: newSoldCount })
                    .eq('id', item.id);
            }
        }
        // Situation B: Cancelling a confirmed order -> Restore Stock, Decrease Sold Count
        else if (oldStatus === 'confirmed' && newStatus !== 'confirmed') {
            for (const item of order.items) {
                const { data: product, error: productError } = await supabase
                    .from('products')
                    .select('stock, sold_count')
                    .eq('id', item.id)
                    .single();

                if (productError || !product) continue;

                const newStock = (product.stock || 0) + (item.quantity || 0);
                const newSoldCount = Math.max(0, (product.sold_count || 0) - (item.quantity || 0));

                await supabase
                    .from('products')
                    .update({ stock: newStock, sold_count: newSoldCount })
                    .eq('id', item.id);
            }
        }
    }

    // 3. Update Order Status
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (updateError) throw updateError;

    return { success: true };
}
