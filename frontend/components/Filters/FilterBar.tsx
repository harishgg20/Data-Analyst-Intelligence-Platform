'use client';

import { useState } from 'react';

const FilterBar = ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => {
    const [dateRange, setDateRange] = useState('30d');
    const [category, setCategory] = useState('all');
    const [region, setRegion] = useState('all');

    const handleDateChange = (e: any) => {
        setDateRange(e.target.value);
        onFilterChange({ dateRange: e.target.value, category, region });
    };

    const handleCategoryChange = (e: any) => {
        setCategory(e.target.value);
        onFilterChange({ dateRange, category: e.target.value, region });
    };

    const handleRegionChange = (e: any) => {
        setRegion(e.target.value);
        onFilterChange({ dateRange, category, region: e.target.value });
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Date Range</label>
                <select
                    value={dateRange}
                    onChange={handleDateChange}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 3 Months</option>
                    <option value="12m">Last 12 Months</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
                <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    <option value="home">Home</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Region</label>
                <select
                    value={region}
                    onChange={handleRegionChange}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Regions</option>
                    <option value="na">North America</option>
                    <option value="eu">Europe</option>
                    <option value="asia">Asia</option>
                </select>
            </div>
        </div>
    );
};

export default FilterBar;
