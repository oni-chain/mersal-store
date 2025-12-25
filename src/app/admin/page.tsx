"use client";
import React, { useEffect, useState } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Loader2, RefreshCw, Package, ShoppingCart, Trash2, Plus, Upload, Edit, X, DollarSign, Globe } from 'lucide-react';
import Image from 'next/image';

const EXCHANGE_RATE = 1450; // 1 USD = 1450 IQD

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    // Form states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priceUSD: '',
        priceIQD: '',
        image: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const checkPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsAuthenticated(true);
        } else {
            alert('Incorrect Password');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'orders') {
                const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } else {
                const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, activeTab]);

    const handlePriceUSDChange = (val: string) => {
        const usd = parseFloat(val) || 0;
        setFormData({
            ...formData,
            priceUSD: val,
            priceIQD: (usd * EXCHANGE_RATE).toString()
        });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let imageUrl = formData.image;

            if (imageFile) {
                const storageRef = ref(storage, `products/${Date.now()}-${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.priceUSD),
                priceIQD: parseFloat(formData.priceIQD),
                image: imageUrl,
                updatedAt: serverTimestamp()
            };

            if (editingProduct) {
                await updateDoc(doc(db, 'products', editingProduct.id), productData);
            } else {
                await addDoc(collection(db, 'products'), {
                    ...productData,
                    createdAt: serverTimestamp()
                });
            }

            setIsFormOpen(false);
            setEditingProduct(null);
            setFormData({ name: '', description: '', priceUSD: '', priceIQD: '', image: '' });
            setImageFile(null);
            fetchData();
            alert(`Product ${editingProduct ? 'updated' : 'added'} successfully!`);
        } catch (error) {
            console.error("Error saving product:", error);
            alert('Failed to save product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditForm = (product: any) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            priceUSD: product.price.toString(),
            priceIQD: (product.priceIQD || (product.price * EXCHANGE_RATE)).toString(),
            image: product.image
        });
        setIsFormOpen(true);
    };

    const deleteProduct = async (product: any) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            if (product.image && product.image.includes('firebasestorage')) {
                try {
                    const imageRef = ref(storage, product.image);
                    await deleteObject(imageRef);
                } catch (e) { console.warn("Image delete failed", e); }
            }
            await deleteDoc(doc(db, 'products', product.id));
            setProducts(products.filter(p => p.id !== product.id));
        } catch (error) {
            alert('Failed to delete product');
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const deleteOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to delete this order?')) return;
        try {
            await deleteDoc(doc(db, 'orders', orderId));
            setOrders(orders.filter(o => o.id !== orderId));
        } catch (error) {
            alert('Failed to delete order');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <form onSubmit={checkPassword} className="bg-gray-900 p-8 rounded-2xl border border-white/5 w-full max-w-sm space-y-6 shadow-2xl">
                    <div className="text-center space-y-2">
                        <Globe className="w-12 h-12 text-primary mx-auto animate-pulse" />
                        <h1 className="text-3xl font-bold text-white font-cairo">Admin Control</h1>
                        <p className="text-gray-500 text-sm">Secure Terminal Access Required</p>
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-all text-center tracking-widest"
                        placeholder="••••••••"
                        autoFocus
                    />
                    <button type="submit" className="w-full bg-primary text-black font-black py-4 rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(0,212,255,0.2)] active:scale-95 uppercase tracking-widest">
                        Authorize
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-cairo">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-900 p-6 rounded-3xl border border-white/5 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Globe className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Admin <span className="text-primary">Console</span></h1>
                            <p className="text-gray-500 text-sm">Real-time Synchronization Active</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-black rounded-xl p-1 border border-white/5">
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'orders' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                <ShoppingCart className="w-4 h-4" /> Orders
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'products' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Package className="w-4 h-4" /> Products
                            </button>
                        </div>
                        <button onClick={fetchData} className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-primary' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading && !isFormOpen ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {activeTab === 'orders' ? (
                            <div className="grid gap-6">
                                {orders.map(order => (
                                    <div key={order.id} className="bg-gray-900 border border-white/5 rounded-3xl p-6 shadow-lg hover:border-primary/20 transition-all">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Recent'}</span>
                                                    <button onClick={() => deleteOrder(order.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-primary text-xl">
                                                        {order.customerName?.[0]}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold">{order.customerName}</h3>
                                                        <p className="text-gray-400 text-sm">{order.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-black rounded-2xl border border-white/5 text-sm text-gray-300">
                                                    <p className="font-bold text-gray-500 uppercase text-[10px] mb-2">Shipping Address</p>
                                                    {order.address}
                                                </div>
                                            </div>

                                            <div className="w-full md:w-80 space-y-4">
                                                <div className="space-y-2">
                                                    {order.items?.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-sm">
                                                            <span className="text-gray-400 truncate max-w-[150px]">{item.name} <span className="text-gray-600 text-xs">x{item.quantity}</span></span>
                                                            <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                                        <span className="font-bold text-primary italic">Total</span>
                                                        <span className="text-2xl font-black text-white">${order.total}</span>
                                                    </div>
                                                </div>
                                                <select
                                                    disabled={updating === order.id}
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-primary focus:outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="pending">Pending Review</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="shipped">In Transit</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {orders.length === 0 && <div className="text-center py-20 text-gray-600 italic">No signals received yet.</div>}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <button
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setFormData({ name: '', description: '', priceUSD: '', priceIQD: '', image: '' });
                                        setIsFormOpen(true);
                                    }}
                                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-3xl text-gray-500 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                    <span className="font-bold">Initialize New Product Entry</span>
                                </button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {products.map(product => (
                                        <div key={product.id} className="group bg-gray-900 rounded-3xl overflow-hidden border border-white/5 shadow-lg hover:border-primary/30 transition-all flex flex-col">
                                            <div className="relative h-56 bg-black p-2">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditForm(product)} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-primary"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteProduct(product)} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-3 flex-grow">
                                                <h3 className="text-xl font-bold truncate">{product.name}</h3>
                                                <p className="text-gray-500 text-sm line-clamp-2 h-10">{product.description || 'No description provided.'}</p>
                                                <div className="flex items-center justify-between pt-4">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-600 font-bold uppercase">USD Entry</p>
                                                        <p className="text-xl font-black text-white">${product.price}</p>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <p className="text-xs text-gray-600 font-bold uppercase">IQD Entry</p>
                                                        <p className="text-xl font-black text-primary">{Math.round(product.priceIQD || (product.price * EXCHANGE_RATE)).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
                    <div className="relative bg-gray-900 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                {editingProduct ? <Edit className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
                                {editingProduct ? 'Edit Product Entry' : 'Configure New Product'}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                            placeholder="Product Title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Detailed Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors h-40 resize-none"
                                            placeholder="Write detailed specifications..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price (USD)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.priceUSD}
                                                    onChange={(e) => handlePriceUSDChange(e.target.value)}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price (IQD)</label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.priceIQD}
                                                onChange={(e) => setFormData({ ...formData, priceIQD: e.target.value })}
                                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-primary font-bold focus:border-primary focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Visual Mapping</label>
                                        <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            {imageFile ? (
                                                <div className="space-y-2">
                                                    <Package className="w-8 h-8 text-primary mx-auto" />
                                                    <p className="text-sm text-white truncate px-4">{imageFile.name}</p>
                                                </div>
                                            ) : formData.image ? (
                                                <div className="space-y-2">
                                                    <img src={formData.image} className="h-20 mx-auto object-cover rounded-lg" />
                                                    <p className="text-xs text-gray-500">Click to replace image</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Upload className="w-8 h-8 text-gray-600 mx-auto group-hover:text-primary transition-colors" />
                                                    <p className="text-xs text-gray-500">Upload high-res artifact image</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary text-black font-black py-4 rounded-2xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.1)] active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (editingProduct ? 'Update Data' : 'Execute Creation')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
