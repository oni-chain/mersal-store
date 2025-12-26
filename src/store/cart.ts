import { create } from 'zustand';

export interface Product {
    id: string;
    name: string;
    price: number;
    priceIQD?: number;
    image: string;
    description?: string;
    minOrderQty?: number;
}

interface CartItem extends Product {
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    showAddToCartModal: boolean;
    lastAddedProduct: Product | null;
    addToCart: (product: Product, quantity?: number) => { success: boolean; error?: string };
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    closeModal: () => void;
    getCartTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    isOpen: false,
    showAddToCartModal: false,
    lastAddedProduct: null,

    addToCart: (product, quantity = 1) => {
        const minQty = product.minOrderQty || 1;

        // Validate MOQ
        if (quantity < minQty) {
            return {
                success: false,
                error: `Minimum order quantity is ${minQty} units`
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

    updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(item =>
            item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
        ).filter(item => item.quantity > 0)
    })),

    clearCart: () => set({ items: [] }),

    toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

    closeModal: () => set({ showAddToCartModal: false, lastAddedProduct: null }),

    getCartTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
    }
}));
