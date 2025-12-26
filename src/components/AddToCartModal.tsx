"use client";
import React from 'react';
import { useCartStore } from '@/store/cart';
import { useLanguage } from '@/context/LanguageContext';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function AddToCartModal() {
    const { showAddToCartModal, lastAddedProduct, closeModal, toggleCart } = useCartStore();
    const { dictionary } = useLanguage();

    if (!showAddToCartModal || !lastAddedProduct) return null;

    const handleCheckoutNow = () => {
        closeModal();
        toggleCart();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={closeModal}
            />

            {/* Modal */}
            <div className="relative bg-gradient-to-br from-gray-900 to-black border border-primary/20 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,212,255,0.2)] animate-in zoom-in duration-300">
                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30 animate-in zoom-in duration-500">
                        <ShoppingCart className="w-8 h-8 text-primary" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-center mb-6 text-white uppercase tracking-wider">
                    {dictionary.cart.modal.added}
                </h2>

                {/* Product Info */}
                <div className="flex items-center gap-4 bg-black/40 rounded-2xl p-4 mb-8 border border-white/5">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                        <Image
                            src={lastAddedProduct.image}
                            alt={lastAddedProduct.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{lastAddedProduct.name}</h3>
                        <p className="text-primary font-bold text-lg">${lastAddedProduct.price}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleCheckoutNow}
                        className="w-full bg-primary text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(0,212,255,0.3)] active:scale-95 uppercase tracking-widest"
                    >
                        {dictionary.cart.modal.checkoutNow}
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <button
                        onClick={closeModal}
                        className="w-full bg-transparent border-2 border-white/10 text-white font-bold py-4 px-6 rounded-2xl hover:border-primary/50 hover:bg-white/5 transition-all uppercase tracking-wider"
                    >
                        {dictionary.cart.modal.continueShopping}
                    </button>
                </div>
            </div>
        </div>
    );
}
