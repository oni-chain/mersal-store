"use client";
import React from 'react';
import { useCartStore } from '@/store/cart';
import { useLanguage } from '@/context/LanguageContext';
import { X, AlertCircle, Phone, MessageCircle } from 'lucide-react';
import Image from 'next/image';

export default function OutOfStockModal() {
    const { showOutOfStockModal, lastAddedProduct, closeModal } = useCartStore();
    const { t } = useLanguage();

    if (!showOutOfStockModal || !lastAddedProduct) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={closeModal}
            />

            {/* Modal */}
            <div className={`relative glass-morphism rounded-[2.5rem] p-1 w-full max-w-md shadow-[0_0_80px_rgba(239,68,68,0.15)] animate-in zoom-in-95 duration-300`}>
                <div className="bg-gradient-to-br from-gray-900/90 to-black/95 rounded-[2.4rem] p-8 overflow-hidden relative">
                    {/* Decorative Gradient Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />

                    {/* Close Button */}
                    <button
                        onClick={closeModal}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-all hover:rotate-90 duration-300 z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content Container */}
                    <div className="relative z-10">
                        {/* Icon */}
                        <div className="flex justify-center mb-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                                <div className="w-20 h-20 bg-red-500/10 border-red-500/30 rounded-3xl flex items-center justify-center border rotate-12 transition-transform hover:rotate-0 duration-500 shadow-lg">
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-cairo">
                                {t('products.outOfStock')}
                            </h2>
                            <p className="text-gray-400 text-sm mt-2 font-bold leading-relaxed">
                                {t('products.outOfStockMsg')}
                            </p>
                        </div>

                        {/* Product Info Card (Simplified) */}
                        <div className="group bg-white/5 border border-white/5 rounded-3xl p-4 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                                    <Image
                                        src={lastAddedProduct.image}
                                        alt={lastAddedProduct.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-lg truncate">{lastAddedProduct.name}</h3>
                                    <span className="text-red-500 text-xs font-black uppercase tracking-widest italic">{t('products.outOfStock')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Options */}
                        <div className="grid grid-cols-2 gap-4">
                            <a
                                href="tel:07708511364"
                                className="group bg-primary text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-cyan-400 shadow-lg shadow-primary/20"
                            >
                                <Phone className="w-5 h-5" />
                                <span className="uppercase tracking-widest text-xs font-cairo">
                                    {t('products.call')}
                                </span>
                            </a>

                            <a
                                href="https://wa.me/9647708511364"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="uppercase tracking-widest text-xs font-cairo">
                                    {t('products.whatsapp')}
                                </span>
                            </a>
                        </div>

                        <button
                            onClick={closeModal}
                            className="w-full mt-4 bg-white/5 border border-white/10 text-gray-500 font-bold py-4 px-6 rounded-2xl hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest text-xs"
                        >
                            {t('cart.modal.continueShopping')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
