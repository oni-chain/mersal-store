"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useCartStore, Product } from '@/store/cart';
import { Plus } from 'lucide-react';

export default function ProductGrid() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const addToCart = useCartStore((state) => state.addToCart);

    // Fallback data in case Firestore is empty/not configured yet
    const fallbackProducts: Product[] = [
        { id: '1', name: 'Samurai Edge X1', price: 49.99, image: '/hero_background.png' },
        { id: '2', name: 'Ronin Speed Pad', price: 39.99, image: '/hero_background.png' },
        { id: '3', name: 'Shogun Control', price: 59.99, image: '/hero_background.png' },
    ];

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "products"));
                const items: Product[] = [];
                querySnapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() } as Product);
                });
                if (items.length > 0) {
                    setProducts(items);
                } else {
                    console.log("No products found in Firestore, using fallback.");
                    setProducts(fallbackProducts);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts(fallbackProducts);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <section className="py-20 px-4 max-w-7xl mx-auto bg-black text-white">
            <h2 className="text-4xl font-bold mb-12 text-center tracking-tighter uppercase">
                Elite <span className="text-red-600">Arsenal</span>
            </h2>

            {loading ? (
                <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <div key={product.id} className="group relative bg-[#1a1a1a] rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-red-900/20 transition-all duration-300 border border-white/5 hover:border-red-600/30">
                            <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold text-white group-hover:text-red-500 transition-colors">{product.name}</h3>
                                    <span className="text-xl font-bold text-red-600">${product.price}</span>
                                </div>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all duration-300"
                                >
                                    <Plus className="w-5 h-5" /> Add to Loadout
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
