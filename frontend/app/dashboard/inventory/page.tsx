'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Filter, Search, Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Skeleton from '@/components/UI/Skeleton';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    stock_quantity: number;
    sku: string | null;
    low_stock_threshold: number;
}

export default function InventoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<number>(0);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleStockUpdate = async (id: number, newQuantity: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/products/${id}/stock?quantity=${newQuantity}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                setProducts(products.map(p => p.id === id ? { ...p, stock_quantity: newQuantity } : p));
                setEditingId(null);
            }
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const getStatus = (p: Product) => {
        if (p.stock_quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
        if (p.stock_quantity <= p.low_stock_threshold) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle };
        return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle };
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

        if (showLowStockOnly) {
            return matchesSearch && p.stock_quantity <= p.low_stock_threshold;
        }
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <Package className="text-blue-600" /> Inventory Management
                            </h1>
                            <p className="text-slate-500 text-sm">Track stock levels and manage SKUs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 transition-colors ${showLowStockOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <AlertTriangle size={16} />
                            {showLowStockOnly ? 'Showing Low Stock' : 'Show Low Stock'}
                        </button>
                        <button
                            onClick={fetchProducts}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by product name, SKU, or category..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            No products found matching your filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th className="p-4">Product Details</th>
                                        <th className="p-4">SKU</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Stock Level</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProducts.map((product) => {
                                        const status = getStatus(product);
                                        const StatusIcon = status.icon;

                                        return (
                                            <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-800">
                                                    {product.name}
                                                </td>
                                                <td className="p-4 text-slate-500 text-sm font-mono">
                                                    {product.sku || 'N/A'}
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {editingId === product.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                className="w-20 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handleStockUpdate(product.id, editValue)}
                                                                className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className="cursor-pointer hover:underline decoration-dashed underline-offset-4 decoration-slate-400"
                                                            onClick={() => {
                                                                setEditingId(product.id);
                                                                setEditValue(product.stock_quantity);
                                                            }}
                                                        >
                                                            {product.stock_quantity} units
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                                        <StatusIcon size={12} />
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(product.id);
                                                            setEditValue(product.stock_quantity);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
