"use client";
import React from 'react';
import { useCartStore, getPriceAtQuantity } from '@/store/cart';
import { useLanguage } from '@/context/LanguageContext';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function AddToCartModal() {
    const { showAddToCartModal, lastAddedProduct, closeModal, toggleCart, items, globalTieredPricing, fetchSettings } = useCartStore();
    const { t } = useLanguage();

    React.useEffect(() => {
        if (showAddToCartModal) {
            fetchSettings();
        }
    }, [showAddToCartModal, fetchSettings]);

    if (!showAddToCartModal || !lastAddedProduct) return null;

    // Find the item in cart to get the correct quantity for price calculation
    const cartItem = items.find(i => i.id === lastAddedProduct.id);
    const quantity = cartItem?.quantity || 1;
    const unitPriceIQD = getPriceAtQuantity(lastAddedProduct, quantity);
    const unitPriceUSD = unitPriceIQD / 1450;

    // Check if a bulk discount is active
    const activeTier = lastAddedProduct.priceTiers?.find(tier => quantity >= tier.min_qty);

    const handleCheckoutNow = () => {
        closeModal();
        toggleCart();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with extreme blur and dark tint */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-700"
                onClick={closeModal}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Outer Glow wrapper */}
                <div className={`absolute -inset-1 ${activeTier ? 'bg-emerald-500/20' : 'bg-primary/20'} rounded-[2.5rem] blur-2xl opacity-50`} />
                
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    <div className={`absolute -top-12 -right-12 w-40 h-40 ${activeTier ? 'bg-emerald-500/10' : 'bg-primary/10'} rounded-full blur-[60px]`} />

                    <div className="p-6 md:p-8 overflow-y-auto relative z-10 custom-scrollbar">
                        {/* Close Button - More subtle */}
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 p-2 text-gray-500 hover:text-white transition-colors duration-300 rounded-full hover:bg-white/5"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Top Icon & Status */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative mb-4">
                                <div className={`absolute inset-0 ${activeTier ? 'bg-emerald-500/30' : 'bg-primary/30'} rounded-full blur-2xl animate-pulse scale-150`} />
                                <div className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center bg-black border ${activeTier ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-primary/50 shadow-[0_0_20px_rgba(0,212,255,0.2)]'} rotate-[10deg]`}>
                                    <ShoppingCart className={`w-10 h-10 ${activeTier ? 'text-emerald-400' : 'text-primary'}`} />
                                    {/* Small success checkmark badge */}
                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white text-center font-cairo tracking-tight">
                                {t('cart.modal.added')}
                            </h2>
                            <p className="text-gray-500 text-[10px] md:text-xs mt-1 font-bold uppercase tracking-[0.3em] opacity-80">
                                {t('cart.modal.synchronized')}
                            </p>
                        </div>

                        {/* Product Detail Card - Apple-like style */}
                        <div className="relative group mb-8">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-4 flex items-center gap-5 transition-transform duration-500 group-hover:scale-[1.02]">
                                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-black/50 border border-white/5 shadow-inner">
                                    <Image
                                        src={lastAddedProduct.image}
                                        alt={lastAddedProduct.name}
                                        fill
                                        className="object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-lg md:text-xl truncate leading-tight mb-1">{lastAddedProduct.name}</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className={`${activeTier ? 'text-emerald-400' : 'text-primary'} text-xl md:text-2xl font-black`}>
                                            {unitPriceIQD.toLocaleString()} <span className="text-[10px] md:text-xs">IQD</span>
                                        </p>
                                        <p className="text-gray-500 text-xs font-bold opacity-60">${unitPriceUSD.toFixed(1)}</p>
                                    </div>
                                    {activeTier && (
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                                                {t('products.wholesale')} {t('products.savings')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Special Offer Box - High Impact */}
                        {(() => {
                            const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
                            const isAnyWholesaleActive = items.some(item =>
                                item.priceTiers?.some(tier => totalQty >= tier.min_qty)
                            );

                            if (globalTieredPricing && items.length > 0 && !isAnyWholesaleActive) {
                                return (
                                    <div className="relative mb-8 group cursor-default">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-500 px-1" />
                                        <div className="relative bg-black/60 border border-white/20 rounded-[2rem] p-6 overflow-hidden">
                                            {/* Subtle animated light sweep */}
                                            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] animate-[shimmer_3s_infinite]" />
                                            
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
                                                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center rotate-[15deg] shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                                                        <ShoppingCart className="w-6 h-6 text-black" />
                                                    </div>
                                                </div>
                                                <div className="text-center space-y-1">
                                                    <p className="text-base md:text-lg font-black text-white leading-snug font-cairo">
                                                        {t('cart.basketDiscountInvite')}
                                                    </p>
                                                    <div className="flex justify-center pt-1">
                                                        <div className="w-10 h-0.5 bg-primary/50 rounded-full" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Bottom Actions */}
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleCheckoutNow}
                                className={`relative group w-full ${activeTier ? 'bg-emerald-500' : 'bg-primary'} h-16 rounded-2xl overflow-hidden transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <div className="relative z-10 flex items-center justify-center gap-2 font-black tracking-[0.1em] text-black">
                                    <span className="text-sm md:text-base uppercase font-cairo">{t('cart.modal.checkoutNow')}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                </div>
                            </button>

                            <button
                                onClick={closeModal}
                                className="w-full h-16 rounded-2xl border border-white/10 bg-white/5 text-gray-400 font-bold tracking-widest hover:bg-white/10 hover:text-white transition-all uppercase text-xs md:text-sm flex items-center justify-center hover:border-white/20"
                            >
                                {t('cart.modal.continueShopping')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
