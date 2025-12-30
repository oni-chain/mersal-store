import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Product {
    id: string;
    name: string;
    price: number;
    priceIQD?: number;
    image: string;
    description?: string;
    minOrderQty?: number;
    stock?: number;
    soldCount?: number;
    priceTiers?: { min_qty: number; price_iqd: number }[];
}

interface CartItem extends Product {
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    showAddToCartModal: boolean;
    showOutOfStockModal: boolean;
    lastAddedProduct: Product | null;
    globalTieredPricing: boolean;
    fetchSettings: () => Promise<void>;
    addToCart: (product: Product, quantity?: number) => { success: boolean; error?: string };
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openOutOfStockModal: (product: Product) => void;
    closeModal: () => void;
    getCartTotal: () => number;
    getCartTotalIQD: () => number;
}

export const getPriceAtQuantity = (product: Product, quantity: number) => {
    if (!product.priceTiers || product.priceTiers.length === 0) {
        return product.priceIQD || (product.price * 1450);
    }

    // Sort tiers by qty descending to find the highest applicable tier
    const sortedTiers = [...product.priceTiers].sort((a, b) => b.min_qty - a.min_qty);
    const applicableTier = sortedTiers.find(tier => quantity >= tier.min_qty);

    return applicableTier ? applicableTier.price_iqd : (product.priceIQD || (product.price * 1450));
};

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    isOpen: false,
    showAddToCartModal: false,
    showOutOfStockModal: false,
    lastAddedProduct: null,
    globalTieredPricing: false,

    fetchSettings: async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'global_tiered_pricing')
                .single();
            if (data) {
                set({ globalTieredPricing: data.value.enabled });
            }
        } catch (error) {
            console.error("CartStore: Error fetching settings:", error);
        }
    },

    addToCart: (product, quantity = 1) => {
        // ... (unchanged)
        const minQty = product.minOrderQty || 1;
        const stock = product.stock ?? 999;

        if (quantity < minQty) {
            return {
                success: false,
                error: `Minimum order quantity is ${minQty} units`
            };
        }

        const state = get();
        const existingItem = state.items.find(item => item.id === product.id);
        const currentQty = existingItem?.quantity || 0;

        if (currentQty + quantity > stock) {
            return {
                success: false,
                error: `Not enough stock available. Remaining: ${Math.max(0, stock - currentQty)}`
            };
        }

        // Ensure settings are fetched to correctly show discount modals/invites
        get().fetchSettings();

        set((state) => {
            const existingItem = state.items.find(item => item.id === product.id);
            if (existingItem) {
                return {
                    items: state.items.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    ),
                    showAddToCartModal: true,
                    lastAddedProduct: product
                };
            }
            return {
                items: [...state.items, { ...product, quantity }],
                showAddToCartModal: true,
                lastAddedProduct: product
            };
        });

        return { success: true };
    },

    removeFromCart: (productId) => set((state) => ({
        items: state.items.filter(item => item.id !== productId)
    })),

    updateQuantity: (productId, quantity) => set((state) => {
        const item = state.items.find(i => i.id === productId);
        if (!item) return state;

        const stock = item.stock ?? 999;
        const finalQty = Math.min(stock, Math.max(0, quantity));

        return {
            items: state.items.map(i =>
                i.id === productId ? { ...i, quantity: finalQty } : i
            ).filter(i => i.quantity > 0)
        };
    }),

    clearCart: () => set({ items: [] }),

    toggleCart: () => {
        const { isOpen } = get();
        if (!isOpen) {
            get().fetchSettings();
        }
        set({ isOpen: !isOpen });
    },

    openOutOfStockModal: (product) => set({
        showOutOfStockModal: true,
        lastAddedProduct: product
    }),

    closeModal: () => set({
        showAddToCartModal: false,
        showOutOfStockModal: false,
        lastAddedProduct: null
    }),

    getCartTotal: () => {
        const { items, globalTieredPricing } = get();
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        return items.reduce((total, item) => {
            const pricingQty = globalTieredPricing ? totalQuantity : item.quantity;
            const unitPrice = getPriceAtQuantity(item, pricingQty) / 1450;
            return total + unitPrice * item.quantity;
        }, 0);
    },

    getCartTotalIQD: () => {
        const { items, globalTieredPricing } = get();
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        return items.reduce((total, item) => {
            const pricingQty = globalTieredPricing ? totalQuantity : item.quantity;
            const unitPrice = getPriceAtQuantity(item, pricingQty);
            return total + unitPrice * item.quantity;
        }, 0);
    }
}));
