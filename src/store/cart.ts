import { create } from 'zustand';

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

    addToCart: (product, quantity = 1) => {
        const minQty = product.minOrderQty || 1;
        const stock = product.stock ?? 999;

        // Validate MOQ
        if (quantity < minQty) {
            return {
                success: false,
                error: `Minimum order quantity is ${minQty} units`
            };
        }

        const state = get();
        const existingItem = state.items.find(item => item.id === product.id);
        const currentQty = existingItem?.quantity || 0;

        // Validate Stock
        if (currentQty + quantity > stock) {
            return {
                success: false,
                error: `Not enough stock available. Remaining: ${Math.max(0, stock - currentQty)}`
            };
        }

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

    toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

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
        const { items } = get();
        return items.reduce((total, item) => {
            const unitPrice = getPriceAtQuantity(item, item.quantity) / 1450;
            return total + unitPrice * item.quantity;
        }, 0);
    },

    getCartTotalIQD: () => {
        const { items } = get();
        return items.reduce((total, item) => {
            const unitPrice = getPriceAtQuantity(item, item.quantity);
            return total + unitPrice * item.quantity;
        }, 0);
    }
}));
