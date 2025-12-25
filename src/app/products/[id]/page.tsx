"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCartStore } from '@/store/cart';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const addToCart = useCartStore((state) => state.addToCart);
    const { dictionary, language } = useLanguage();

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "products", id as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!product) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Product not found</div>;

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
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex flex-col justify-center space-y-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-2 font-cairo">{product.name}</h1>
                            <p className="text-2xl text-primary font-bold">${product.price}</p>
                        </div>

                        <p className="text-gray-400 leading-relaxed text-lg">
                            {/* Description fallback since custom products might not have description field yet */}
                            {product.description || "Experience precision and control with this premium gaming gear. Designed for esports professionals and enthusiasts alike."}
                        </p>

                        <button
                            onClick={() => addToCart(product)}
                            className="bg-white text-black font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 hover:bg-primary hover:text-black transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {dictionary.products.addToCart}
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
