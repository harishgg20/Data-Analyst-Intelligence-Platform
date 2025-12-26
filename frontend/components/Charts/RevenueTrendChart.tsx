'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useFilter } from '@/contexts/FilterContext';
import { TrendingUp, Info, Sparkles } from 'lucide-react';

const RevenueTrendChart = () => {
    const { selectedCategory, selectedRegion } = useFilter();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Forecast State
    const [showForecast, setShowForecast] = useState(false);
    const [forecastData, setForecastData] = useState<any[]>([]);

    // AI Explanation State
    const [showInfo, setShowInfo] = useState(false);
    const [explanation, setExplanation] = useState("");
    const [explaining, setExplaining] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedCategory) params.append('category', selectedCategory);
                if (selectedRegion) params.append('region', selectedRegion);

                const res = await fetch(`/api/kpis/revenue/trend?${params.toString()}`);
                if (res.ok) {
                    const json = await res.json();
                    const formattedHistory = json.map((item: any) => ({
                        date: item.date,
                        revenue: item.revenue,
                        forecast: null
                    }));
                    setData(formattedHistory);
                }
            } catch (err) {
                console.error("Failed to load trend data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory, selectedRegion]);

    // Fetch Forecast when toggled
    useEffect(() => {
        if (showForecast && forecastData.length === 0) {
            const fetchForecast = async () => {
                try {
                    const res = await fetch('/api/kpis/revenue/forecast?days=30');
                    if (res.ok) {
                        const json = await res.json();
                        setForecastData(json);
                    }
                } catch (e) {
                    console.error("Forecast fetch failed", e);
                }
            };
            fetchForecast();
        }
    }, [showForecast]);

    // Fetch Explanation
    useEffect(() => {
        if (!showInfo || data.length === 0) return;

        const fetchExplanation = async () => {
            setExplaining(true);
            try {
                // Summarize data for context (first, last, min, max)
                const values = data.map(d => d.revenue);
                const contextData = {
                    start_date: data[0].date,
                    end_date: data[data.length - 1].date,
                    start_revenue: values[0],
                    end_revenue: values[values.length - 1],
                    max_revenue: Math.max(...values),
                    min_revenue: Math.min(...values),
                    showing_forecast: showForecast
                };

                const res = await fetch('/api/ai/explain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chart_name: "Revenue Trend Over Time",
                        context: contextData,
                        selected_item: showForecast ? "With 30-Day Forecast" : "Historical Trend"
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
    }, [showInfo, showForecast, data]);


    const getChartData = () => {
        if (!showForecast) return data;
        const formattedForecast = forecastData.map((item: any) => ({
            date: item.date,
            revenue: null,
            forecast: item.revenue
        }));
        if (data.length > 0 && formattedForecast.length > 0) {
            const lastHistory = data[data.length - 1];
            const connectionPoint = {
                date: lastHistory.date,
                revenue: null,
                forecast: lastHistory.revenue
            };
            return [...data, connectionPoint, ...formattedForecast];
        }
        return [...data, ...formattedForecast];
    };

    const chartData = getChartData();

    if (loading && data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                <span className="animate-pulse">Loading trend data...</span>
            </div>
        );
    }

    if (data.length === 0 && !loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
                <p className="text-sm font-medium">No trend data available.</p>
            </div>
        );
    }

    return (
        <div id="revenue-chart-container" className="relative w-full h-full flex flex-col p-4">

            {/* Header Controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={`p-1.5 rounded-full transition-colors ${showInfo ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                    title="Toggle AI Insight"
                >
                    <Info size={18} />
                </button>

                <button
                    onClick={() => setShowForecast(!showForecast)}
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border transition-colors ${showForecast
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    <TrendingUp size={12} />
                    {showForecast ? 'Hide Forecast' : 'Show Forecast'}
                </button>
            </div>

            {/* AI Explanation Box */}
            {showInfo && (
                <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-slate-700 animate-in fade-in slide-in-from-top-2 z-20 relative mt-8 mr-32">
                    <div className="flex items-center gap-2 mb-1 text-blue-700 font-medium">
                        <Sparkles size={14} />
                        <span>AI Analysis</span>
                    </div>
                    {explaining ? (
                        <span className="animate-pulse">Analyzing trend...</span>
                    ) : (
                        <p className="leading-relaxed">{explanation}</p>
                    )}
                </div>
            )}

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            stroke="#9ca3af"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(str) => {
                                if (!str) return '';
                                const date = new Date(str);
                                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            }}
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
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#3b82f6' }}
                            formatter={(value: any, name: string) => [
                                `$${value?.toLocaleString()}`,
                                name === 'forecast' ? 'Projects' : 'Revenue'
                            ]}
                            labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />

                        {/* Historical Data */}
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />

                        {/* Forecast Data */}
                        <Area
                            type="monotone"
                            dataKey="forecast"
                            stroke="#a855f7"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fillOpacity={1}
                            fill="url(#colorForecast)"
                            connectNulls
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueTrendChart;
