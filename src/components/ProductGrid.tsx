"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useCartStore, Product } from '@/store/cart';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

export default function ProductGrid() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const addToCart = useCartStore((state) => state.addToCart);
    const { dictionary } = useLanguage();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch products sorted by newness
                const q = query(collection(db, "products"), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const items: Product[] = [];
                querySnapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() } as Product);
                });
                setProducts(items);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <section className="py-20 px-4 max-w-7xl mx-auto bg-black text-white">
            <h2 className="text-4xl font-bold mb-12 text-center tracking-tighter uppercase font-cairo">
                {dictionary.hero.title} <span className="text-primary">{dictionary.products.title}</span>
            </h2>

            {loading ? (
                <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <div key={product.id} className="group relative bg-[#1a1a1a] rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(0,212,255,0.1)] transition-all duration-300 border border-white/5 hover:border-primary/30">
                            <Link href={`/products/${product.id}`} className="block aspect-w-16 aspect-h-9 overflow-hidden">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                                />
                            </Link>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors font-cairo">{product.name}</h3>
                                    <span className="text-xl font-bold text-primary">${product.price}</span>
                                </div>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-black transition-all duration-300 transform active:scale-95"
                                >
                                    <Plus className="w-5 h-5" /> {dictionary.products.addToCart}
                                </button>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No products available.
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
