"use client";
import React, { useState } from 'react';
import { useCartStore, getPriceAtQuantity } from '@/store/cart';
import { X, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Cart() {
    const { items, isOpen, toggleCart, removeFromCart, updateQuantity, getCartTotal, getCartTotalIQD, clearCart } = useCartStore();
    const { t } = useLanguage();
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'success'>('cart');
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
    const [loading, setLoading] = useState(false);

    const totalIQD = getCartTotalIQD();
    const totalUSD = getCartTotal();

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        try {
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                    items: items.map(item => ({
                        ...item,
                        unitPriceIQD: getPriceAtQuantity(item, item.quantity),
                        unitPriceUSD: getPriceAtQuantity(item, item.quantity) / 1450
                    })),
                    total: totalIQD,
                    totalUSD: totalUSD
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                setCheckoutStep('success');
                clearCart();
            } else {
                const errorData = await response.json();
                console.error("Order failed", errorData);
                alert(`${t('cart.alerts.placeOrderFail')}: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                alert(t('cart.alerts.timeout'));
            } else {
                console.error('Checkout error:', error);
                alert(t('cart.alerts.unexpected'));
            }
        } finally {
            setLoading(false);
            clearTimeout(timeoutId);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={toggleCart} />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-[#111] h-full shadow-2xl overflow-y-auto border-l border-white/10 flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                        {checkoutStep === 'cart' ? t('cart.loadout') : checkoutStep === 'details' ? t('cart.shippingDetails') : t('cart.orderConfirmedHeader')}
                    </h2>
                    <button onClick={toggleCart} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 p-6">
                    {checkoutStep === 'cart' && (
                        <>
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                                    <p className="text-lg">{t('cart.empty')}</p>
                                    <button onClick={toggleCart} className="text-secondary hover:text-cyan-400 font-bold">{t('cart.startShopping')}</button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                                            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg bg-black" />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white mb-1">{item.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-primary font-bold">{getPriceAtQuantity(item, item.quantity).toLocaleString()} IQD</p>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">${(getPriceAtQuantity(item, item.quantity) / 1450).toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-neutral-800"
                                                    >-</button>
                                                    <span className="text-white w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-neutral-800"
                                                    >+</button>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 self-start">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {checkoutStep === 'details' && (
                        <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t('cart.name')}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-secondary transition-colors"
                                    placeholder={t('cart.namePlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t('cart.phone')}</label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-green-600 transition-colors"
                                    placeholder={t('cart.phonePlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t('cart.address')}</label>
                                <textarea
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white h-32 resize-none focus:outline-none focus:border-green-600 transition-colors"
                                    placeholder={t('cart.addressPlaceholder')}
                                />
                            </div>
                        </form>
                    )}

                    {checkoutStep === 'success' && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">{t('cart.successTitle')}</h3>
                                <p className="text-gray-400">{t('cart.successMessage')}</p>
                            </div>
                            <button
                                onClick={toggleCart}
                                className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                {t('cart.continue')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {checkoutStep !== 'success' && items.length > 0 && (
                    <div className="p-6 border-t border-white/5 bg-[#0a0a0a]">
                        {checkoutStep === 'cart' ? (
                            <>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                        <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t('cart.total')}</span>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-primary">{totalIQD.toLocaleString()} IQD</p>
                                            <p className="text-xs text-gray-500 font-bold">≈ ${totalUSD.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCheckoutStep('details')}
                                    className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {t('cart.checkout')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </>
                        ) : (
                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={loading}
                                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(22,163,74,0.2)]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('cart.confirm')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
