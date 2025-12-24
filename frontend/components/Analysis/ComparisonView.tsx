'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const ComparisonView = () => {
    const [comparison, setComparison] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleCompare = async () => {
        setLoading(true);
        try {
            // Mock API call
            const res = await fetch('/api/ai/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_period_label: 'Aug 2024', previous_period_label: 'Jul 2024' })
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error("Comparison API Error:", errText);
                alert(`Error: ${res.statusText}`);
                return;
            }

            const data = await res.json();
            setComparison(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Period Comparison</h3>
                <button
                    onClick={handleCompare}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : <>Compare Periods <ArrowRight size={16} /></>}
                </button>
            </div>

            {comparison && (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Previous (Jul)</p>
                            <p className="text-xl font-bold text-slate-700">${comparison.previous.total_revenue.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-600 mb-1">Difference</p>
                            <p className="text-xl font-bold text-blue-700">{comparison.delta.revenue_change}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 mb-1">Current (Aug)</p>
                            <p className="text-xl font-bold text-slate-900">${comparison.current.total_revenue.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="text-purple-600" size={20} />
                            <h4 className="font-semibold text-purple-900">AI Analysis</h4>
                        </div>
                        <div className="prose prose-sm text-purple-800">
                            {/* In a real scenario, we'd parse the JSON string if needed, or just display raw if text */}
                            {/* For this mock, the backend returns a JSON string inside 'ai_explanation', so we parse it usually, 
                                but simplicity let's assume content field access or just dump it */}
                            <p className="leading-relaxed">
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(comparison.ai_explanation);
                                        return parsed.content;
                                    } catch {
                                        return "AI analysis unavailable.";
                                    }
                                })()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonView;
