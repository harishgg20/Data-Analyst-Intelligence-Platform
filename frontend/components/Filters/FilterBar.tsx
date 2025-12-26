'use client';

import { useState, useEffect } from 'react';
import { useFilter } from '@/contexts/FilterContext';

const FilterBar = () => {
    const {
        selectedCategory, setSelectedCategory,
        selectedRegion, setSelectedRegion,
        dateRange, setDateRange,
        minOrderValue, setMinOrderValue
    } = useFilter();

    const [categories, setCategories] = useState<string[]>([]);
    const [regions, setRegions] = useState<string[]>([]);

    const [labels, setLabels] = useState({ category: 'Category', region: 'Region' });

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/kpis/filters', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                    setRegions(data.regions || []);
                    if (data.labels) {
                        setLabels(data.labels);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch filters", err);
            }
        };
        fetchFilters();
    }, []);

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Date Range</label>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 3 Months</option>
                    <option value="12m">Last 12 Months</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            {categories.length > 1 && (
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">{labels.category}</label>
                    <select
                        value={selectedCategory || 'all'}
                        onChange={(e) => setSelectedCategory(e.target.value === 'all' ? null : e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All {labels.category}s</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            )}

            {regions.length > 1 && (
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">{labels.region}</label>
                    <select
                        value={selectedRegion || 'all'}
                        onChange={(e) => setSelectedRegion(e.target.value === 'all' ? null : e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All {labels.region}s</option>
                        {regions.map(reg => (
                            <option key={reg} value={reg}>{reg}</option>
                        ))}
                    </select>
                </div>
            )}


        </div>
    );
};

export default FilterBar;
