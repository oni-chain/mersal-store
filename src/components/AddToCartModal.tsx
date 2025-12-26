"use client";
import React from 'react';
import { useCartStore } from '@/store/cart';
import { useLanguage } from '@/context/LanguageContext';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function AddToCartModal() {
    const { showAddToCartModal, lastAddedProduct, closeModal, toggleCart } = useCartStore();
    const { t } = useLanguage();

    if (!showAddToCartModal || !lastAddedProduct) return null;

    const handleCheckoutNow = () => {
        closeModal();
        toggleCart();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
                onClick={closeModal}
            />

            {/* Modal */}
            <div className="relative glass-morphism rounded-[2.5rem] p-1 w-full max-w-md shadow-[0_0_80px_rgba(0,212,255,0.15)] animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-gray-900/90 to-black/95 rounded-[2.4rem] p-8 overflow-hidden relative">
                    {/* Decorative Gradient Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-[80px]" />

                    {/* Close Button */}
                    <button
                        onClick={closeModal}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-all hover:rotate-90 duration-300"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content Container */}
                    <div className="relative z-10">
                        {/* Success Icon */}
                        <div className="flex justify-center mb-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/30 rotate-12 transition-transform hover:rotate-0 duration-500 box-shadow-primary">
                                    <ShoppingCart className="w-10 h-10 text-primary" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-cairo">
                                {t('cart.modal.added')}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1 uppercase tracking-[0.2em] font-bold">{t('cart.modal.synchronized')}</p>
                        </div>

                        {/* Product Info Card */}
                        <div className="group bg-white/5 border border-white/5 rounded-3xl p-5 mb-8 hover:border-primary/20 transition-all duration-300">
                            <div className="flex items-center gap-5">
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                                    <Image
                                        src={lastAddedProduct.image}
                                        alt={lastAddedProduct.name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-xl truncate mb-1">{lastAddedProduct.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary font-black text-2xl">{(lastAddedProduct.priceIQD || (lastAddedProduct.price * 1450)).toLocaleString()} <span className="text-xs">IQD</span></span>
                                        <div className="h-1 w-1 bg-gray-700 rounded-full" />
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">${lastAddedProduct.price}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid gap-4">
                            <button
                                onClick={handleCheckoutNow}
                                className="group relative w-full bg-primary text-black font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-3 overflow-hidden transition-all active:scale-95"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                                <span className="relative z-10 flex items-center gap-2 uppercase tracking-widest text-sm">
                                    {t('cart.modal.checkoutNow')}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>

                            <button
                                onClick={closeModal}
                                className="w-full bg-white/5 border border-white/10 text-gray-300 font-bold py-5 px-8 rounded-2xl hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                            >
                                {t('cart.modal.continueShopping')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
