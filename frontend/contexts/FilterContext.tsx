'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
    selectedCategory: string | null;
    setSelectedCategory: (category: string | null) => void;
    selectedRegion: string | null;
    setSelectedRegion: (region: string | null) => void;
    dateRange: string;
    setDateRange: (range: string) => void;
    minOrderValue: number | null;
    setMinOrderValue: (value: number | null) => void;
    resetFilters: () => void;
    labels: { category: string; region: string };
    dashboardData: any | null;
    setDashboardData: (data: any | null) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<string>('30d');
    const [minOrderValue, setMinOrderValue] = useState<number | null>(null);
    const [dashboardData, setDashboardData] = useState<any | null>(null);

    const resetFilters = () => {
        setSelectedCategory(null);
        setSelectedRegion(null);
        setDateRange('30d');
        setMinOrderValue(null);
    };

    const [labels, setLabels] = useState({ category: 'Category', region: 'Region' });

    // Fetch labels on mount
    React.useEffect(() => {
        const fetchLabels = async () => {
            try {
                // We use the public endpoint now
                const res = await fetch('/api/kpis/filters');
                if (res.ok) {
                    const data = await res.json();
                    if (data.labels) {
                        setLabels(data.labels);
                    }
                }
            } catch (err) {
                // silent fail
            }
        };
        fetchLabels();
    }, []);

    return (
        <FilterContext.Provider value={{
            selectedCategory,
            setSelectedCategory,
            selectedRegion,
            setSelectedRegion,
            dateRange,
            setDateRange,
            minOrderValue,
            setMinOrderValue,
            resetFilters,
            labels,
            dashboardData,
            setDashboardData
        }}>
            {children}
        </FilterContext.Provider>
    );
}

export function useFilter() {
    const context = useContext(FilterContext);
    if (context === undefined) {
        throw new Error('useFilter must be used within a FilterProvider');
    }
    return context;
}
