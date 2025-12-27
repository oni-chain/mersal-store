"use client";
import React from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { useCartStore, Product } from '@/store/cart';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { ProductSkeleton } from './ProductSkeleton';

const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        priceIQD: p.price_iqd,
        image: p.image_url,
        description: p.description,
        minOrderQty: p.min_order_qty
    }));
};

export default function ProductGrid() {
    const { data: products, error, isLoading } = useSWR('products', fetchProducts, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute cache
    });

    const addToCart = useCartStore((state) => state.addToCart);
    const { dictionary } = useLanguage();

    if (error) {
        return (
            <div className="py-20 text-center text-red-500 font-cairo">
                Failed to load products. Check Supabase connection.
            </div>
        );
    }

    return (
        <section id="products" className="py-20 px-4 max-w-7xl mx-auto bg-black text-white">
            <h2 className="text-4xl font-bold mb-12 text-center tracking-tighter uppercase font-cairo">
                {dictionary.hero.title} <span className="text-primary">{dictionary.products.title}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => <ProductSkeleton key={i} />)
                ) : (
                    <>
                        {products?.map((product) => (
                            <div key={product.id} className="group relative bg-[#1a1a1a] rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(0,212,255,0.1)] transition-all duration-300 border border-white/5 hover:border-primary/30">
                                <Link href={`/products/${product.id}`} className="block relative h-64 overflow-hidden">
                                    <Image
                                        src={product.image || '/hero_background.png'}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transform group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                                        loading="lazy"
                                    />
                                    {/* View Details Overlay: Persistent on mobile, hover on desktop */}
                                    <div className="absolute inset-0 bg-black/20 lg:bg-black/40 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px] lg:backdrop-blur-[2px]">
                                        <div className="bg-white/10 lg:bg-white/5 border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 transform translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 transition-transform duration-300">
                                            <span className="text-white text-[10px] lg:text-xs font-black uppercase tracking-widest font-cairo">
                                                {dictionary.products.viewDetails}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <Link href={`/products/${product.id}`}>
                                            <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors font-cairo truncate">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-xl font-black text-primary">{(product.priceIQD || (product.price * 1450)).toLocaleString()} IQD</span>
                                            <span className="text-sm font-bold text-gray-500 italic">| ${product.price}</span>
                                        </div>
                                    </div>
                                    {product.minOrderQty && product.minOrderQty > 1 && (
                                        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest font-cairo">
                                                {dictionary.products.moqBadge.replace('{qty}', product.minOrderQty.toString())}
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            const result = addToCart(product, product.minOrderQty || 1);
                                            if (!result.success && result.error) {
                                                alert(result.error);
                                            }
                                        }}
                                        className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-black transition-all duration-300 transform active:scale-95 group/btn shadow-lg"
                                    >
                                        <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" /> {dictionary.products.addToCart}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {products?.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No products available.
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
