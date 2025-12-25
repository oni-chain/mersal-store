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
        description: p.description
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
        <section className="py-20 px-4 max-w-7xl mx-auto bg-black text-white">
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
                                </Link>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors font-cairo truncate">{product.name}</h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-xl font-black text-primary">${product.price}</span>
                                            <span className="text-sm font-bold text-gray-500 italic">| {(product.priceIQD || (product.price * 1450)).toLocaleString()} IQD</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product)}
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
