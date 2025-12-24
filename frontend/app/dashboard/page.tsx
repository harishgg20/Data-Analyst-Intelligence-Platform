'use client';
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { DollarSign, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight, ShoppingBag, Lightbulb } from 'lucide-react';
import RevenueTrendChart from '@/components/Charts/RevenueTrendChart';
import CategoryBarChart from '@/components/Charts/CategoryBarChart';
import RegionPieChart from '@/components/Charts/RegionPieChart';
import Link from "next/link";
import FilterBar from '@/components/Filters/FilterBar';
import Skeleton from '@/components/UI/Skeleton'; // Assuming Skeleton component path

export default function DashboardPage() {
    const [filters, setFilters] = useState({ dateRange: '30d', category: 'all', region: 'all' });
    const [loading, setLoading] = useState(true); // Add loading state

    // Real-time State
    const [stats, setStats] = useState({ totalRevenue: 0, activeOrders: 0 });

    // Connect to WebSocket (replace localhost with env var in prod)
    const { message, isConnected } = useWebSocket('/ws/kpi-stream');

    useEffect(() => {
        // Simulate initial load
        setTimeout(() => {
            setStats({ totalRevenue: 52450, activeOrders: 126 });
            setLoading(false);
        }, 800);
    }, []);

    useEffect(() => {
        if (message && message.type === 'KPI_UPDATE') {
            setStats(prev => ({
                ...prev,
                totalRevenue: message.payload.total_revenue, // Updated to total_revenue
                activeOrders: message.payload.active_orders
            }));
        }
    }, [message]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        // In future: Fetch new data based on filters
        console.log('Filters updated:', newFilters);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Download Report
                </button>
            </div>

            <FilterBar onFilterChange={handleFilterChange} />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                            {loading ? (
                                <Skeleton className="h-8 w-32 mt-1" />
                            ) : (
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    ${stats.totalRevenue.toLocaleString()}
                                </h3>
                            )}
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 font-medium flex items-center">
                            <ArrowUpRight size={16} className="mr-1" />
                            +12.5%
                        </span>
                        <span className="text-slate-500 ml-2">from last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Orders</p>
                            {loading ? (
                                <Skeleton className="h-8 w-24 mt-1" />
                            ) : (
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    {stats.activeOrders}
                                </h3>
                            )}
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 font-medium flex items-center">
                            <ArrowUpRight size={16} className="mr-1" />
                            +8.2%
                        </span>
                        <span className="text-slate-500 ml-2">from last month</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Avg. Order Value</p>
                            {loading ? (
                                <Skeleton className="h-8 w-24 mt-1" />
                            ) : (
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    $85.20
                                </h3>
                            )}
                        </div>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-red-600 font-medium flex items-center">
                            <ArrowDownRight size={16} className="mr-1" />
                            -2.1%
                        </span>
                        <span className="text-slate-500 ml-2">from last month</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Customers</p>
                            {loading ? (
                                <Skeleton className="h-8 w-24 mt-1" />
                            ) : (
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    1,240
                                </h3>
                            )}
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 font-medium flex items-center">
                            <ArrowUpRight size={16} className="mr-1" />
                            +5.4%
                        </span>
                        <span className="text-slate-500 ml-2">from last month</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue Trends</h3>
                    <div className="h-80">
                        <RevenueTrendChart />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Sales by Category</h3>
                    <div className="h-80">
                        <CategoryBarChart />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Regional Distribution</h3>
                    <div className="h-64">
                        <RegionPieChart />
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Recent AI Insights</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                    </div>
                    <div className="space-y-4">
                        {/* Placeholder for AI insights list */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex gap-3">
                                <div className="mt-1"><Lightbulb className="text-blue-500" size={20} /></div>
                                <div>
                                    <h4 className="font-semibold text-blue-900">Revenue Spike Detected</h4>
                                    <p className="text-sm text-blue-800 mt-1">Unusual spike in Electronics category driven by "Wireless Headphones" sales in North Region.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                            <div className="flex gap-3">
                                <div className="mt-1"><Lightbulb className="text-yellow-600" size={20} /></div>
                                <div>
                                    <h4 className="font-semibold text-yellow-900">Inventory Warning</h4>
                                    <p className="text-sm text-yellow-800 mt-1">Low stock predicted for "Smart Watch Series 5" within the next 48 hours based on current velocity.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
