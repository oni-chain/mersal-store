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
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-bold mb-2 font-cairo">{product?.name}</h1>
                                    <p className="text-2xl text-primary font-bold">${product?.price}</p>
                                </div>

                                <p className="text-gray-400 leading-relaxed text-lg">
                                    {product?.description || "Experience precision and control with this premium gaming gear. Designed for esports professionals and enthusiasts alike."}
                                </p>

                                <button
                                    onClick={() => product && addToCart(product)}
                                    className="bg-white text-black font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 hover:bg-primary hover:text-black transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                >
                                    <ShoppingCart className="w-5 h-5" />
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
