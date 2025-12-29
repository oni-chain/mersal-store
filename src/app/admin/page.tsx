"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
        image_url: '',
        minOrderQty: '1',
        stock: '0',
        priceTiers: [] as { min_qty: number; price_iqd: number }[]
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
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } else {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProducts(data || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Fetch failed. Check Supabase credentials or table permissions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, activeTab]);

    const handlePriceIQDChange = (val: string) => {
        const iqd = parseFloat(val) || 0;
        setFormData({
            ...formData,
            priceIQD: val,
            priceUSD: (iqd / EXCHANGE_RATE).toFixed(2)
        });
    };

    const handlePriceUSDChange = (val: string) => {
        const usd = parseFloat(val) || 0;
        setFormData({
            ...formData,
            priceUSD: val,
            priceIQD: Math.round(usd * EXCHANGE_RATE).toString()
        });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let imageUrl = formData.image_url;

            if (imageFile) {
                const fileName = `${Date.now()}-${imageFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(`products/${fileName}`, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(`products/${fileName}`);

                imageUrl = publicUrl;
            }

            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.priceUSD),
                price_iqd: parseFloat(formData.priceIQD),
                image_url: imageUrl,
                min_order_qty: parseInt(formData.minOrderQty) || 1,
                stock: parseInt(formData.stock) || 0,
                price_tiers: formData.priceTiers,
            };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
            }

            setIsFormOpen(false);
            setEditingProduct(null);
            setFormData({ name: '', description: '', priceUSD: '', priceIQD: '', image_url: '', minOrderQty: '1', stock: '0', priceTiers: [] });
            setImageFile(null);
            fetchData();
            alert(`Product ${editingProduct ? 'updated' : 'added'} successfully!`);
        } catch (error: any) {
            console.error("Error saving product:", error);
            alert(`Failed to save product: ${error.message || 'Unknown error'}. Check Supabase logs or RLS policies.`);
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
            priceIQD: (product.price_iqd || (product.price * EXCHANGE_RATE)).toString(),
            image_url: product.image_url,
            minOrderQty: (product.min_order_qty || 1).toString(),
            stock: (product.stock || 0).toString(),
            priceTiers: product.price_tiers || []
        });
        setIsFormOpen(true);
    };

    const deleteProduct = async (product: any) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            // Delete from Supabase Storage if it's a supabase link
            if (product.image_url && product.image_url.includes('supabase.co')) {
                const path = product.image_url.split('/public/product-images/')[1];
                if (path) {
                    await supabase.storage.from('product-images').remove([path]);
                }
            }

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

            if (error) throw error;
            setProducts(products.filter(p => p.id !== product.id));
        } catch (error) {
            console.error("Delete error:", error);
            alert('Failed to delete product');
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            const order = orders.find(o => o.id === orderId);
            const oldStatus = order?.status;

            // Stock Reduction Logic: Triggered when status changes to 'confirmed'
            if (newStatus === 'confirmed' && oldStatus !== 'confirmed' && order.items) {
                for (const item of order.items) {
                    // Fetch latest stock to ensure accuracy and prevent race conditions
                    const { data: product, error: fetchError } = await supabase
                        .from('products')
                        .select('stock, sold_count')
                        .eq('id', item.id)
                        .single();

                    if (fetchError || !product) {
                        console.error(`Failed to fetch stock for product ${item.id}`);
                        continue;
                    }

                    const newStock = Math.max(0, (product.stock || 0) - item.quantity);
                    const newSoldCount = (product.sold_count || 0) + item.quantity;

                    const { error: updateError } = await supabase
                        .from('products')
                        .update({
                            stock: newStock,
                            sold_count: newSoldCount
                        })
                        .eq('id', item.id);

                    if (updateError) {
                        console.error(`Failed to update product ${item.id}`);
                    }
                }
            }
            // Stock & Sold Count Restoration Logic: Triggered when status changes FROM 'confirmed' to something else (e.g. cancelled)
            else if (oldStatus === 'confirmed' && newStatus !== 'confirmed' && order.items) {
                for (const item of order.items) {
                    const { data: product, error: fetchError } = await supabase
                        .from('products')
                        .select('stock, sold_count')
                        .eq('id', item.id)
                        .single();

                    if (fetchError || !product) continue;

                    const newStock = (product.stock || 0) + item.quantity;
                    const newSoldCount = Math.max(0, (product.sold_count || 0) - item.quantity);

                    await supabase
                        .from('products')
                        .update({
                            stock: newStock,
                            sold_count: newSoldCount
                        })
                        .eq('id', item.id);
                }
            }

            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

            // Re-fetch products if stock might have changed
            if ((newStatus === 'confirmed' && oldStatus !== 'confirmed') || (oldStatus === 'confirmed' && newStatus !== 'confirmed')) {
                fetchData();
            }
        } catch (error) {
            console.error("Update error:", error);
            alert('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const deleteOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to delete this order?')) return;
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;
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
                            <p className="text-gray-500 text-sm">Supabase Sync Live</p>
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
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{new Date(order.created_at).toLocaleString()}</span>
                                                    <button onClick={() => deleteOrder(order.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-primary text-xl">
                                                        {order.customer_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold">{order.customer_name}</h3>
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
                                        setFormData({ name: '', description: '', priceUSD: '', priceIQD: '', image_url: '', minOrderQty: '1', stock: '0', priceTiers: [] });
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
                                                {product.image_url ? (
                                                    <a href={product.image_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full group/img relative">
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-2xl opacity-80 group-hover/img:opacity-100 transition-opacity" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/40 rounded-2xl">
                                                            <Globe className="w-8 h-8 text-white" />
                                                            <span className="ml-2 text-xs font-bold text-white uppercase tracking-widest">Verify Public Link</span>
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-2xl">
                                                        <Package className="w-12 h-12 text-gray-700" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button onClick={() => openEditForm(product)} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-primary"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteProduct(product)} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-3 flex-grow">
                                                <h3 className="text-xl font-bold truncate">{product.name}</h3>
                                                <p className="text-gray-500 text-sm line-clamp-2 h-10">{product.description || 'No description provided.'}</p>
                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-600 font-bold uppercase">Price</p>
                                                        <p className="text-xl font-black text-white">{Math.round(product.price_iqd || (product.price * EXCHANGE_RATE)).toLocaleString()} <span className="text-[10px]">IQD</span></p>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <p className="text-xs text-gray-600 font-bold uppercase">Availability</p>
                                                        <p className={`text-xl font-black ${product.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{product.stock || 0} <span className="text-[10px]">UNITS</span></p>
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
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price (IQD)</label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.priceIQD}
                                                onChange={(e) => handlePriceIQDChange(e.target.value)}
                                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-primary font-bold focus:border-primary focus:outline-none transition-colors"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price (USD)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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
                                    </div>

                                    {/* Tiered Pricing Section */}
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Tiered Pricing (Wholesale)</label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    priceTiers: [...formData.priceTiers, { min_qty: 0, price_iqd: 0 }]
                                                })}
                                                className="text-xs font-bold text-primary hover:text-cyan-400 transition-colors flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Add Tier
                                            </button>
                                        </div>

                                        {formData.priceTiers.map((tier, index) => (
                                            <div key={index} className="grid grid-cols-7 gap-2 items-center animate-in slide-in-from-top-1 duration-200">
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        placeholder="Min Qty"
                                                        value={tier.min_qty}
                                                        onChange={(e) => {
                                                            const newTiers = [...formData.priceTiers];
                                                            newTiers[index].min_qty = parseInt(e.target.value) || 0;
                                                            setFormData({ ...formData, priceTiers: newTiers });
                                                        }}
                                                        className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-white focus:border-primary outline-none"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        placeholder="IQD Price"
                                                        value={tier.price_iqd}
                                                        onChange={(e) => {
                                                            const newTiers = [...formData.priceTiers];
                                                            newTiers[index].price_iqd = parseInt(e.target.value) || 0;
                                                            setFormData({ ...formData, priceTiers: newTiers });
                                                        }}
                                                        className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-primary font-bold focus:border-primary outline-none"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newTiers = formData.priceTiers.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, priceTiers: newTiers });
                                                    }}
                                                    className="col-span-1 flex justify-center text-gray-600 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.priceTiers.length === 0 && (
                                            <p className="text-[10px] text-gray-700 italic">No wholesale tiers defined.</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Min Order (MOQ)</label>
                                            <input
                                                required
                                                type="number"
                                                min="1"
                                                value={formData.minOrderQty}
                                                onChange={(e) => setFormData({ ...formData, minOrderQty: e.target.value })}
                                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                                placeholder="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Current Stock</label>
                                            <input
                                                required
                                                type="number"
                                                min="0"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-emerald-500 font-bold focus:border-primary focus:outline-none transition-colors"
                                                placeholder="0"
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
                                            ) : formData.image_url ? (
                                                <div className="space-y-2">
                                                    <img src={formData.image_url} className="h-20 mx-auto object-cover rounded-lg" />
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
