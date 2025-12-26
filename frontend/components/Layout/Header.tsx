'use client';

import { Bell, Search, User, Download, FileText } from 'lucide-react'; // Added FileText just in case
import { generateFullReport } from '@/utils/reportGenerator'; // New Import
import { useState } from 'react';
import { useFilter } from '@/contexts/FilterContext';

const Header = () => {
    const { selectedCategory, selectedRegion } = useFilter();
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            // 1. Fetch KPI Overview Data
            const params = new URLSearchParams();
            if (selectedCategory) params.append('category', selectedCategory);
            if (selectedRegion) params.append('region', selectedRegion);

            const kpiRes = await fetch(`/api/kpis/overview?${params.toString()}`);
            const kpiData = await kpiRes.json();

            // 2. Fetch Latest AI Insight Directly (or use what's in overview)
            // Overview endpoint actually returns 'latest_analysis' now!

            // 3. Prepare Report Data
            const reportData = {
                title: "Strategic Performance Report",
                date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                kpis: {
                    revenue: `$${kpiData.total_revenue?.toLocaleString() || '0'}`,
                    orders: kpiData.active_orders || 0,
                    aov: `$${kpiData.average_order_value?.toLocaleString() || '0'}`,
                    customers: kpiData.active_customers || 0
                },
                aiInsight: kpiData.latest_analysis ? {
                    title: kpiData.latest_analysis.title,
                    content: kpiData.latest_analysis.content,
                    type: kpiData.latest_analysis.type
                } : null
            };

            // 4. Generate PDF
            await generateFullReport(reportData);

        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to generate report. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
                <div className="hidden md:flex items-center text-sm text-slate-500">
                    <span className="mx-2">/</span>
                    <span>Overview</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors"
                >
                    <Download size={18} />
                    {exporting ? 'Generating...' : 'Export Report'}
                </button>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                </div>

                <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-slate-700">Admin User</p>
                        <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold border border-blue-200">
                        AU
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
