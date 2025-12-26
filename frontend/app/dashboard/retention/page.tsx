'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Info } from 'lucide-react';
import Skeleton from '@/components/UI/Skeleton';

interface RetentionPoint {
    month_index: number;
    active_customers: number;
    percentage: number;
}

interface Cohortgroup {
    cohort: string;
    size: number;
    retention: RetentionPoint[];
}

export default function RetentionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [cohorts, setCohorts] = useState<Cohortgroup[]>([]);

    const fetchCohorts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/analytics/retention', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCohorts(data);
            }
        } catch (error) {
            console.error("Failed to fetch retention", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCohorts();
    }, []);

    // Helper for color scale
    const getCellColor = (percentage: number) => {
        if (percentage >= 50) return 'bg-emerald-500 text-white';
        if (percentage >= 30) return 'bg-emerald-300 text-emerald-900';
        if (percentage >= 15) return 'bg-emerald-200 text-emerald-800';
        if (percentage > 0) return 'bg-emerald-100 text-emerald-700';
        return 'bg-slate-50 text-slate-400';
    };

    // Find max month index for columns
    const maxMonth = cohorts.reduce((max, c) => {
        const cMax = Math.max(...c.retention.map(r => r.month_index), 0);
        return Math.max(max, cMax);
    }, 0);

    const columns = Array.from({ length: maxMonth + 1 }, (_, i) => i);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} className="text-slate-600" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Retention (Cohorts)</h1>
                    </div>
                    <button
                        onClick={fetchCohorts}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="mb-6 flex items-start gap-2 text-sm text-slate-500 bg-blue-50 p-3 rounded-lg">
                        <Info size={18} className="text-blue-600 min-w-fit mt-0.5" />
                        <p>
                            This heatmap shows the percentage of users who returned to make a purchase in subsequent months.
                            <br />
                            <strong>Month 0</strong> is the month of their first purchase (always 100%).
                        </p>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : cohorts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">No data available for cohort analysis.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-separate border-spacing-1">
                                <thead>
                                    <tr>
                                        <th className="text-left font-medium text-slate-500 p-2 min-w-[120px]">Cohort</th>
                                        <th className="text-left font-medium text-slate-500 p-2 min-w-[80px]">Size</th>
                                        {columns.map(m => (
                                            <th key={m} className="p-2 font-medium text-slate-500 text-center min-w-[60px]">
                                                {m === 0 ? 'Month 0' : `+${m}`}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {cohorts.map(cohort => (
                                        <tr key={cohort.cohort}>
                                            <td className="p-2 font-medium text-slate-800 bg-slate-50 rounded">{cohort.cohort}</td>
                                            <td className="p-2 text-slate-600 bg-slate-50 rounded">{cohort.size} Users</td>
                                            {columns.map(m => {
                                                const point = cohort.retention.find(r => r.month_index === m);
                                                const percent = point ? point.percentage : 0;
                                                // Don't render cells for future logic (e.g. if cohort is new, only Month 0 exists)
                                                // Simple logic based on data presence
                                                if (!point) return <td key={m} className="bg-slate-50/30 rounded"></td>;

                                                return (
                                                    <td
                                                        key={m}
                                                        className={`p-2 text-center rounded font-medium transition-colors ${getCellColor(percent)}`}
                                                        title={`${point.active_customers} users returned`}
                                                    >
                                                        {percent}%
                                                    </td>
                                                );
                                            })}
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
