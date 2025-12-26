'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Share2, Info, ArrowUpRight } from 'lucide-react';
import Skeleton from '@/components/UI/Skeleton';

interface AffinityPair {
    product_a: string;
    product_b: string;
    frequency: number;
    confidence: number;
    lift: number;
    strength: 'High' | 'Medium' | 'Low';
}

export default function AffinityPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [pairs, setPairs] = useState<AffinityPair[]>([]);

    const fetchAffinity = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/analytics/affinity', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPairs(data);
            }
        } catch (error) {
            console.error("Failed to fetch affinity", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAffinity();
    }, []);

    const getStrengthColor = (s: string) => {
        if (s === 'High') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (s === 'Medium') return 'bg-blue-50 text-blue-700 border-blue-200';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Market Basket Analysis</h1>
                            <p className="text-slate-500 text-sm">Discover frequently bought together products</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchAffinity}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="mb-6 flex items-start gap-4 p-4 bg-indigo-50 rounded-lg text-indigo-900 text-sm">
                        <Info className="min-w-5 mt-0.5 text-indigo-600" size={20} />
                        <div>
                            <p className="font-semibold mb-1">Understanding Lift</p>
                            <p className="opacity-80">
                                <strong>Lift {'>'} 1.0</strong> means products are more likely to be bought together than random chance.
                                <br />
                                High Lift indicates a strong pairing opportunity for bundles or cross-sells.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : pairs.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            No significant product associations found yet. Need more order data!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-sm font-medium text-slate-500">
                                        <th className="p-4">Product Combination</th>
                                        <th className="p-4">Frequency</th>
                                        <th className="p-4">Confidence</th>
                                        <th className="p-4">Lift (Strength)</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {pairs.map((pair, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 ring-2 ring-white">A</div>
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 ring-2 ring-white">B</div>
                                                    </div>
                                                    <div className="font-medium text-slate-700">
                                                        {pair.product_a} <span className="text-slate-400 mx-1">+</span> {pair.product_b}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600">{pair.frequency} orders</td>
                                            <td className="p-4 text-slate-600">
                                                {pair.confidence}%
                                                <span className="text-xs text-slate-400 ml-1">(Bought B)</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStrengthColor(pair.strength)}`}>
                                                    {pair.lift}x ({pair.strength})
                                                </span>
                                            </td>
                                            <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 ml-auto">
                                                    Create Bundle <ArrowUpRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
