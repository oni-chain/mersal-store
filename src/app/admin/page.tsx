"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, RefreshCw, Package, ShoppingCart, Trash2, Plus } from 'lucide-react';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    // Product Form State
    const [newProduct, setNewProduct] = useState({ name: '', price: '', image: '/hero_background.png' });
    const [isAddingProduct, setIsAddingProduct] = useState(false);

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
                const q = query(collection(db, 'products')); // Add orderBy if you add a createdAt to products
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

    const updateStatus = async (orderId: string, newStatus: string) => {
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

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingProduct(true);
        try {
            await addDoc(collection(db, 'products'), {
                name: newProduct.name,
                price: parseFloat(newProduct.price),
                image: newProduct.image,
                createdAt: serverTimestamp()
            });
            setNewProduct({ name: '', price: '', image: '/hero_background.png' });
            fetchData(); // Refresh list
            alert('Product added successfully!');
        } catch (error) {
            console.error("Error adding product:", error);
            alert('Failed to add product');
        } finally {
            setIsAddingProduct(false);
        }
    };

    const deleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteDoc(doc(db, 'products', productId));
            setProducts(products.filter(p => p.id !== productId));
        } catch (error) {
            console.error("Error deleting product:", error);
            alert('Failed to delete product');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <form onSubmit={checkPassword} className="bg-gray-900 p-8 rounded-xl border border-gray-800 w-full max-w-sm space-y-4">
                    <h1 className="text-2xl font-bold text-white text-center">Admin Access</h1>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="Enter Password"
                        autoFocus
                    />
                    <button type="submit" className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                        Login
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-primary font-cairo">Admin Dashboard</h1>

                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'orders' ? 'bg-primary text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <ShoppingCart className="w-4 h-4" /> Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'products' ? 'bg-primary text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Package className="w-4 h-4" /> Products
                        </button>
                    </div>

                    <button onClick={fetchData} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors text-white">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'orders' ? (
                            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#0a0a0a]">
                                            <tr className="text-gray-400 text-sm uppercase tracking-wider">
                                                <th className="p-4 font-semibold">Date</th>
                                                <th className="p-4 font-semibold">Customer</th>
                                                <th className="p-4 font-semibold">Contact</th>
                                                <th className="p-4 font-semibold">Items</th>
                                                <th className="p-4 font-semibold">Total</th>
                                                <th className="p-4 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {orders.map(order => (
                                                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4 whitespace-nowrap text-gray-300 md:w-32">
                                                        {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-white">{order.customerName}</div>
                                                        <div className="text-sm text-gray-500 max-w-[200px] truncate" title={order.address}>{order.address}</div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap text-gray-300">{order.phone}</td>
                                                    <td className="p-4 max-w-md">
                                                        <ul className="text-sm text-gray-400 space-y-1">
                                                            {order.items?.map((item: any, idx: number) => (
                                                                <li key={idx} className="flex justify-between">
                                                                    <span>{item.name} <span className="text-gray-600">x{item.quantity}</span></span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                    <td className="p-4 font-bold text-green-400 whitespace-nowrap">${order.total}</td>
                                                    <td className="p-4">
                                                        <select
                                                            disabled={updating === order.id}
                                                            value={order.status}
                                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                                            className={`bg-black border border-gray-700 text-white text-sm rounded-lg block w-full p-2.5 focus:border-primary focus:outline-none ${updating === order.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="confirmed">Confirmed</option>
                                                            <option value="shipped">Shipped</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {orders.length === 0 && <div className="p-8 text-center text-gray-500">No orders found.</div>}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Add Product Form */}
                                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Add New Product</h2>
                                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Product Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={newProduct.name}
                                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                                className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white focus:border-primary focus:outline-none"
                                                placeholder="e.g. Gaming Mouse"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Price (USD)</label>
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                value={newProduct.price}
                                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                                className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white focus:border-primary focus:outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm text-gray-400 mb-1">Image URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    required
                                                    type="text"
                                                    value={newProduct.image}
                                                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                                                    className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white focus:border-primary focus:outline-none"
                                                    placeholder="https://..."
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isAddingProduct}
                                                    className="bg-primary text-black font-bold px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                                >
                                                    {isAddingProduct ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                {/* Product List */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.map(product => (
                                        <div key={product.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 flex flex-col group hover:border-primary/50 transition-colors">
                                            <div className="relative h-48 bg-black">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="absolute top-2 right-2 p-2 bg-red-600/80 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-4 flex flex-col flex-grow">
                                                <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
                                                <p className="text-primary font-bold text-xl">${product.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {products.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No products added yet.</p>}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
