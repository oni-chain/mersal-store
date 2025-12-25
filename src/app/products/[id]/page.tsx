"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCartStore, Product } from '@/store/cart';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

const fetchProduct = async (id: string): Promise<Product> => {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    throw new Error('Product not found');
};

export default function ProductPage() {
    const { id } = useParams();
    const { data: product, error, isLoading } = useSWR<Product>(id ? `product-${id}` : null, () => fetchProduct(id as string), {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    const addToCart = useCartStore((state) => state.addToCart);
    const { dictionary, language } = useLanguage();

    if (error) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center space-y-4">
                <p className="text-xl">Product not found</p>
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
                    {dictionary.cart.continue}
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="relative aspect-square bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5">
                        {isLoading ? (
                            <div className="w-full h-full animate-pulse bg-white/5" />
                        ) : (
                            <Image
                                src={product?.image || '/hero_background.png'}
                                alt={product?.name || 'Product'}
                                fill
                                priority
                                className="object-cover"
                            />
                        )}
                    </div>

                    <div className="flex flex-col justify-center space-y-6">
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
                                <div className="space-y-4">
                                    <h1 className="text-4xl md:text-5xl font-black font-cairo tracking-tight text-white">{product?.name}</h1>
                                    <div className="flex items-center gap-6">
                                        <div className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                                            <p className="text-xs font-bold text-primary uppercase mb-1">Price USD</p>
                                            <p className="text-3xl font-black text-white">${product?.price}</p>
                                        </div>
                                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Price IQD</p>
                                            <p className="text-3xl font-black text-gray-300">{(product?.priceIQD || (product!.price * 1450)).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">Technical Specifications</h3>
                                    <p className="text-gray-400 leading-relaxed text-lg whitespace-pre-wrap">
                                        {product?.description || "Experience precision and control with this premium gaming gear. Designed for esports professionals and enthusiasts alike. Optimized for maximum performance and durability in the most demanding environments."}
                                    </p>
                                </div>

                                <button
                                    onClick={() => product && addToCart(product)}
                                    className="w-full bg-primary text-black font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-4 hover:bg-cyan-400 transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(0,212,255,0.2)] active:scale-95 uppercase tracking-widest"
                                >
                                    <ShoppingCart className="w-6 h-6" />
                                    {dictionary.products.addToCart}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
