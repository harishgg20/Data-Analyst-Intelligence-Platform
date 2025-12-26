'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFilter } from '@/contexts/FilterContext';
import { Info, Sparkles } from 'lucide-react';

const CategoryBarChart = () => {
    const { selectedCategory, setSelectedCategory, selectedRegion, labels } = useFilter();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // AI Explanation State
    const [showInfo, setShowInfo] = useState(false);
    const [explanation, setExplanation] = useState("");
    const [explaining, setExplaining] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = new URLSearchParams();
                if (selectedRegion) params.append('region', selectedRegion);

                const res = await fetch(`/api/kpis/revenue/category?${params.toString()}`);
                if (res.ok) {
                    const json = await res.json();
                    const formatted = json.map((item: any) => ({
                        name: item.category,
                        value: item.revenue
                    }));
                    setData(formatted);
                }
            } catch (err) {
                console.error("Failed to load category data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedRegion]);

    // Fetch Explanation when Info is shown or selection changes
    useEffect(() => {
        if (!showInfo || data.length === 0) return;

        const fetchExplanation = async () => {
            setExplaining(true);
            try {
                const contextData = data.slice(0, 5).reduce((acc: any, item: any) => {
                    acc[item.name] = item.value;
                    return acc;
                }, {});

                const res = await fetch('/api/ai/explain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chart_name: "Sales by Category",
                        context: contextData,
                        selected_item: selectedCategory
                    })
                });

                if (res.ok) {
                    const json = await res.json();
                    setExplanation(json.explanation);
                }
            } catch (error) {
                console.error("Failed to fetch explanation", error);
                setExplanation("Could not generate explanation.");
            } finally {
                setExplaining(false);
            }
        };

        // Debounce slightly to avoid rapid clicks spamming
        const timer = setTimeout(fetchExplanation, 500);
        return () => clearTimeout(timer);

    }, [showInfo, selectedCategory, data]);


    const handleClick = (entry: any) => {
        if (selectedCategory === entry.name) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(entry.name);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                <span className="animate-pulse">Loading categories...</span>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
                <p className="text-sm font-medium">No category data.</p>
            </div>
        );
    }

    const sortedData = [...data].sort((a, b) => b.value - a.value);

    // Window Logic
    let displayData = [];
    const windowSize = 7;

    if (!selectedCategory) {
        displayData = sortedData.slice(0, windowSize);
    } else {
        const currentIndex = sortedData.findIndex(item => item.name === selectedCategory);
        if (currentIndex === -1) {
            displayData = sortedData.slice(0, windowSize);
        } else {
            let start = Math.max(0, currentIndex - 3);
            let end = start + windowSize;
            if (end > sortedData.length) {
                end = sortedData.length;
                start = Math.max(0, end - windowSize);
            }
            displayData = sortedData.slice(start, end);
        }
    }

    return (
        <div id="category-chart-container" className="w-full h-full p-4 relative flex flex-col">
            {/* Controls Header */}
            <div className="flex justify-between items-start mb-2 z-10 w-full pl-2">

                {/* Info Button */}
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={`p-1.5 rounded-full transition-colors ${showInfo ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                    title="Toggle AI Insight"
                >
                    <Info size={18} />
                </button>

                {/* Dropdown */}
                <select
                    className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm max-w-[150px]"
                    value={selectedCategory || ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCategory(val === "" ? null : val);
                    }}
                >
                    <option value="">Top {labels.category}s</option>
                    {sortedData.map(item => (
                        <option key={item.name} value={item.name}>
                            {item.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* AI Explanation Box */}
            {showInfo && (
                <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-slate-700 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-1 text-blue-700 font-medium">
                        <Sparkles size={14} />
                        <span>AI Analysis</span>
                    </div>
                    {explaining ? (
                        <span className="animate-pulse">Analyzing selection...</span>
                    ) : (
                        <p className="leading-relaxed">{explanation}</p>
                    )}
                </div>
            )}

            <div className="h-[250px] flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            stroke="#9ca3af"
                            tick={{ fill: '#64748b', fontSize: 11, angle: -45, textAnchor: 'end' }}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            height={60}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                return value;
                            }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar
                            dataKey="value"
                            onClick={handleClick}
                            radius={[6, 6, 0, 0]}
                            cursor="pointer"
                        >
                            {displayData.map((entry, index) => {
                                const isSelected = selectedCategory === entry.name;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={isSelected ? '#1e293b' : 'url(#colorRevenue)'}
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CategoryBarChart;
