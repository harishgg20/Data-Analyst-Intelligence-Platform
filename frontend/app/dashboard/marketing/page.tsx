'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, RefreshCw, TrendingUp, DollarSign, Users, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import Skeleton from '@/components/UI/Skeleton';

interface ChannelMetric {
    channel_id: number;
    channel_name: string;
    spend: number;
    revenue: number;
    roas: number;
    conversions: number;
    cac: number;
    cpa: number;
}

export default function MarketingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<ChannelMetric[]>([]);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/analytics/marketing', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error("Failed to fetch marketing metrics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    // Aggregates
    const totalSpend = metrics.reduce((sum, m) => sum + m.spend, 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
    const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
    const blendedCAC = totalConversions > 0 ? totalSpend / totalConversions : 0; // Using CPA as CAC proxy if unique not summed

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
            {/* Header */}
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} className="text-slate-600" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketing ROI Analytics</h1>
                    </div>
                    <button
                        onClick={fetchMetrics}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-slate-500">Total Ad Spend</p>
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><DollarSign size={18} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">${totalSpend.toLocaleString()}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={18} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-slate-500">Blended ROAS</p>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Target size={18} /></div>
                        </div>
                        <h3 className={`text-2xl font-bold ${blendedROAS >= 4 ? 'text-green-600' : 'text-slate-900'}`}>
                            {blendedROAS.toFixed(2)}x
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Target: 4.0x</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-slate-500">Blended CPA</p>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={18} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">${blendedCAC.toFixed(2)}</h3>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance by Channel */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                        <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue vs Spend by Channel</h3>
                        {loading ? <Skeleton className="w-full h-80" /> : (
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="channel_name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                        <Tooltip
                                            cursor={{ fill: '#F1F5F9' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="spend" name="Ad Spend" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        <Bar dataKey="revenue" name="Revenue" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* ROAS Efficiency */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                        <h3 className="text-lg font-semibold text-slate-800 mb-6">Efficiency: ROAS by Channel</h3>
                        {loading ? <Skeleton className="w-full h-80" /> : (
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                        <XAxis type="number" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="channel_name" type="category" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                        <Tooltip
                                            cursor={{ fill: '#F1F5F9' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="roas" name="ROAS (Multiplier)" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-semibold text-slate-900">Detailed Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Channel</th>
                                    <th className="px-6 py-3 text-right">Spend</th>
                                    <th className="px-6 py-3 text-right">Revenue</th>
                                    <th className="px-6 py-3 text-right">Conversions</th>
                                    <th className="px-6 py-3 text-right">CPA</th>
                                    <th className="px-6 py-3 text-right">ROAS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {metrics.map((m) => (
                                    <tr key={m.channel_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-900">{m.channel_name}</td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-600">${m.spend.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-600">${m.revenue.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right text-slate-600">{m.conversions}</td>
                                        <td className="px-6 py-3 text-right text-slate-600">${m.cpa.toFixed(2)}</td>
                                        <td className={`px-6 py-3 text-right font-bold ${m.roas >= 4 ? 'text-green-600' : m.roas >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {m.roas.toFixed(2)}x
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
