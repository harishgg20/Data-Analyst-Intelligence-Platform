'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFilter } from '@/contexts/FilterContext';
import { Info, Sparkles } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

const RegionPieChart = () => {
    const { selectedRegion, setSelectedRegion, selectedCategory, labels } = useFilter();
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
                if (selectedCategory) params.append('category', selectedCategory);

                const res = await fetch(`/api/kpis/revenue/region?${params.toString()}`);
                if (res.ok) {
                    const json = await res.json();
                    const formatted = json.map((item: any) => ({
                        name: item.region,
                        value: item.revenue
                    }));
                    setData(formatted);
                }
            } catch (err) {
                console.error("Failed to load region data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory]);

    // Fetch Explanation
    useEffect(() => {
        if (!showInfo || data.length === 0) return;

        const fetchExplanation = async () => {
            setExplaining(true);
            try {
                const contextData = data.reduce((acc: any, item: any) => {
                    acc[item.name] = item.value;
                    return acc;
                }, {});

                const res = await fetch('/api/ai/explain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chart_name: "Sales by Region",
                        context: contextData,
                        selected_item: selectedRegion
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

        const timer = setTimeout(fetchExplanation, 500);
        return () => clearTimeout(timer);
    }, [showInfo, selectedRegion, data]);

    const handleClick = (entry: any) => {
        if (selectedRegion === entry.name) {
            setSelectedRegion(null);
        } else {
            setSelectedRegion(entry.name);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                <span className="animate-pulse">Loading regions...</span>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
                <p className="text-sm font-medium">No region data.</p>
            </div>
        );
    }

    return (
        <div id="region-chart-container" className="w-full h-full p-4 relative flex flex-col">

            {/* Header controls */}
            <div className="flex justify-end mb-2 absolute top-4 right-4 z-10">
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={`p-1.5 rounded-full transition-colors ${showInfo ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                    title="Toggle AI Insight"
                >
                    <Info size={18} />
                </button>
            </div>

            {/* AI Explanation Box */}
            {showInfo && (
                <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-slate-700 animate-in fade-in slide-in-from-top-2 z-20 relative">
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

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            onClick={handleClick}
                            cursor="pointer"
                        >
                            {data.map((entry, index) => {
                                const isSelected = selectedRegion === entry.name;
                                const isDimmed = selectedRegion && !isSelected;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        opacity={isDimmed ? 0.3 : 1}
                                        stroke={isSelected ? "#1e293b" : "none"}
                                        strokeWidth={isSelected ? 2 : 0}
                                    />
                                );
                            })}
                        </Pie>
                        <Tooltip
                            formatter={(value: any) => [`$${value?.toLocaleString()}`, "Revenue"]}
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RegionPieChart;
