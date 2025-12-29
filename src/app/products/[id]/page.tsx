"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { useCartStore, Product, getPriceAtQuantity } from '@/store/cart';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

const fetchProduct = async (id: string): Promise<Product> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    if (!data) throw new Error('Product not found');

    return {
        id: data.id,
        name: data.name,
        price: data.price,
        priceIQD: data.price_iqd,
        image: data.image_url,
        description: data.description,
        minOrderQty: data.min_order_qty,
        stock: data.stock,
        soldCount: data.sold_count,
        priceTiers: data.price_tiers
    };
};

export default function ProductPage() {
    const { id } = useParams();
    const { data: product, error, isLoading } = useSWR<Product>(id ? `product-${id}` : null, () => fetchProduct(id as string), {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    const addToCart = useCartStore((state) => state.addToCart);
    const { t, language } = useLanguage();
    const [quantity, setQuantity] = React.useState(1);
    const [isPulsing, setIsPulsing] = React.useState(false);

    React.useEffect(() => {
        if (product?.minOrderQty) {
            setQuantity(product.minOrderQty);
        }
    }, [product]);

    const unitPriceIQD = product ? getPriceAtQuantity(product, quantity) : 0;
    const totalPriceIQD = unitPriceIQD * quantity;
    const unitPriceUSD = unitPriceIQD / 1450;

    // Trigger pulse when unit price changes (tier hit)
    React.useEffect(() => {
        if (unitPriceIQD > 0) {
            setIsPulsing(true);
            const timer = setTimeout(() => setIsPulsing(false), 500);
            return () => clearTimeout(timer);
        }
    }, [unitPriceIQD]);

    const activeTier = product?.priceTiers?.find(tier => quantity >= tier.min_qty);
    const nextTier = product?.priceTiers?.sort((a, b) => a.min_qty - b.min_qty).find(tier => tier.min_qty > quantity);

    if (error) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center font-cairo">
            <div className="text-center space-y-4">
                <p className="text-xl">Product not found in Supabase.</p>
                <Link href="/" className="text-primary hover:underline">Back to Shop</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-32">
                <Link href="/" className="inline-flex items-center text-gray-400 hover:text-primary mb-8 transition-colors">
                    <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180 ml-2' : 'mr-2'}`} />
                    {t('cart.continue')}
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="relative aspect-square bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                        {isLoading ? (
                            <div className="w-full h-full animate-pulse bg-white/5 flex items-center justify-center">
                                <Loader2 className="w-12 h-12 animate-spin text-primary/20" />
                            </div>
                        ) : (
                            <Image
                                src={product?.image || '/hero_background.png'}
                                alt={product?.name || 'Product'}
                                fill
                                priority
                                className="object-cover"
                            />
                        )}
                        {activeTier && (
                            <div className="absolute top-6 left-6 z-10 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce text-sm">
                                {t('products.bulkDiscount')} {Math.round((1 - (unitPriceIQD / (product?.priceIQD || (product!.price * 1450)))) * 100)}% {t('products.savings')}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center space-y-8">
                        {isLoading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-10 bg-white/5 rounded w-3/4" />
                                <div className="h-6 bg-white/5 rounded w-1/4" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-white/5 rounded w-full" />
                                    <div className="h-4 bg-white/5 rounded w-full" />
                                    <div className="h-4 bg-white/5 rounded w-2/3" />
                                </div>
                                <div className="h-14 bg-white/5 rounded-xl w-full mt-8" />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    <h1 className="text-4xl md:text-5xl font-black font-cairo tracking-tight text-white">{product?.name}</h1>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
                                            <div className={`px-5 py-5 lg:px-8 lg:py-6 rounded-2xl border transition-all duration-300 flex-1 ${activeTier ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(0,212,255,0.1)]'}`}>
                                                <p className={`text-[10px] lg:text-xs font-black uppercase mb-1 tracking-widest ${activeTier ? 'text-emerald-500' : 'text-primary'}`}>
                                                    {activeTier ? t('products.wholesale') : t('products.priceIQD')}
                                                </p>
                                                <p className={`text-3xl sm:text-4xl lg:text-5xl font-black transition-all duration-300 ${isPulsing ? 'scale-105' : 'scale-100'} ${activeTier ? 'text-emerald-500' : 'text-white'} leading-none`}>
                                                    {unitPriceIQD.toLocaleString()} <span className="text-xs sm:text-sm font-bold opacity-70">IQD</span>
                                                </p>
                                            </div>
                                            <div className="px-5 py-4 bg-white/5 rounded-2xl border border-white/10 lg:w-auto">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1 leading-none">{t('products.priceUSD')}</p>
                                                <p className="text-lg lg:text-2xl font-black text-gray-400 leading-none">${unitPriceUSD.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {/* Stock & Sales Status */}
                                        <div className="flex flex-col gap-3">
                                            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-300 ${product?.stock && product.stock > 0 ? (product.stock <= 5 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30') : 'bg-red-500/10 border-red-500/30'}`}>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('cart.shippingDetails')}</span>
                                                    <span className={`text-sm font-bold ${product?.stock && product.stock > 0 ? (product.stock <= 5 ? 'text-amber-500' : 'text-emerald-500') : 'text-red-500'}`}>
                                                        {product?.stock && product.stock > 0 ? (product.stock <= 5 ? `${t('products.limitedStock')} (${product.stock} ${t('products.unitsAvailable')})` : `${t('products.inStock')} (${product.stock} ${t('products.unitsAvailable')})`) : t('products.outOfStock')}
                                                    </span>
                                                </div>
                                                <div className={`w-3 h-3 rounded-full ${product?.stock && product.stock > 0 ? (product.stock <= 5 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500') : 'bg-red-500'}`} />
                                            </div>

                                            {product?.soldCount && product.soldCount > 0 ? (
                                                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                                                    <div className="flex -space-x-2">
                                                        {[...Array(3)].map((_, i) => (
                                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center overflow-hidden">
                                                                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary italic">M</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400 italic">
                                                        {t('products.unitsSold').replace('{qty}', product.soldCount.toString())}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Bulk Savings Section */}
                                        {product?.priceTiers && product.priceTiers.length > 0 && (
                                            <div className="bg-gray-900/50 rounded-3xl border border-white/5 overflow-hidden">
                                                <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                                                    <span className="text-xs font-black uppercase text-primary tracking-widest">{t('products.bulkSavings')}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">{t('products.buyMoreSaveMore')}</span>
                                                </div>
                                                <div className="p-4 grid grid-cols-1 gap-2">
                                                    {product.priceTiers.map((tier, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`flex items-center justify-between px-6 py-4 rounded-xl border transition-all ${quantity >= tier.min_qty ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 scale-[1.02] shadow-lg' : 'bg-white/2 border-white/5 text-gray-400 opacity-60'}`}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-lg font-black">{tier.min_qty}+ {t('products.quantity')}</span>
                                                                <span className="text-[10px] font-bold uppercase opacity-60">{t('products.wholesale')}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-black">{tier.price_iqd.toLocaleString()}</span>
                                                                <span className="ml-1 text-xs font-bold">IQD</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">Technical Specifications</h3>
                                    <p className="text-gray-400 leading-relaxed text-lg whitespace-pre-wrap">
                                        {product?.description}
                                    </p>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-white/5">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between text-gray-400 font-bold uppercase text-xs tracking-widest px-2">
                                            <span>{t('products.selectQuantity')}</span>
                                            {nextTier ? (
                                                <span className="text-primary italic">
                                                    {t('products.buyMoreSaveMore')} ({nextTier.min_qty - quantity} more for {nextTier.price_iqd.toLocaleString()} IQD)
                                                </span>
                                            ) : (
                                                <span>{t('products.moqBadge', { qty: product?.minOrderQty || 1 })}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
                                            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-2 gap-3 lg:gap-4 justify-between lg:justify-start">
                                                <button
                                                    onClick={() => setQuantity(Math.max(product?.minOrderQty || 1, quantity - 1))}
                                                    disabled={(product?.stock || 0) <= 0}
                                                    className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl lg:text-3xl font-black transition-colors disabled:opacity-20"
                                                >-</button>
                                                <input
                                                    type="number"
                                                    value={quantity}
                                                    disabled={(product?.stock || 0) <= 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val)) {
                                                            const max = product?.stock || 999;
                                                            setQuantity(Math.min(max, Math.max(1, val)));
                                                        }
                                                    }}
                                                    onBlur={() => setQuantity(Math.min(product?.stock || 999, Math.max(product?.minOrderQty || 1, quantity)))}
                                                    className="w-12 lg:w-24 bg-transparent text-center text-xl lg:text-3xl font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-20"
                                                />
                                                <button
                                                    onClick={() => setQuantity(Math.min(product?.stock || 999, quantity + 1))}
                                                    disabled={(product?.stock || 0) <= 0 || quantity >= (product?.stock || 0)}
                                                    className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl lg:text-3xl font-black transition-colors disabled:opacity-20"
                                                >+</button>
                                            </div>
                                            <div className={`flex-1 px-5 py-4 lg:px-8 lg:py-4 rounded-2xl border flex flex-col justify-center transition-all duration-300 ${activeTier ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-primary/5 border-primary/10'}`}>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${activeTier ? 'text-emerald-500' : 'text-gray-500'} leading-none`}>{t('products.totalAmount')}</p>
                                                <p className={`text-xl lg:text-3xl font-black ${activeTier ? 'text-emerald-500' : 'text-primary'} leading-tight mt-1`}>{totalPriceIQD.toLocaleString()} <span className="text-[10px] lg:text-sm">IQD</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (product) {
                                                if (product.stock !== undefined && product.stock <= 0) {
                                                    alert(t('products.outOfStockMsg'));
                                                    return;
                                                }
                                                if (quantity > (product.stock || 0)) {
                                                    alert(t('products.notEnoughStock'));
                                                    return;
                                                }
                                                const result = addToCart(product, quantity);
                                                if (!result.success && result.error) {
                                                    alert(result.error);
                                                }
                                            }
                                        }}
                                        className={`w-full font-black py-6 px-8 rounded-2xl flex items-center justify-center gap-4 transition-all transform hover:scale-[1.02] shadow-2xl active:scale-95 uppercase tracking-widest ${product?.stock && product.stock > 0 ? (activeTier ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-primary hover:bg-cyan-400 text-black shadow-primary/20') : 'bg-gray-800 text-gray-400 border border-white/5 hover:bg-gray-700 shadow-none grayscale scale-100'}`}
                                    >
                                        <ShoppingCart className="w-6 h-6" />
                                        {(product?.stock || 0) <= 0 ? t('products.outOfStock') : t('products.addToCart')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
