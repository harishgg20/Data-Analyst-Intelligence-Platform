'use client';

import { useState } from 'react';
import { X, Search, CheckCircle } from 'lucide-react';

interface DrillDownModalProps {
    isOpen: boolean;
    onClose: () => void;
    metricName: string;
}

const DrillDownModal = ({ isOpen, onClose, metricName }: DrillDownModalProps) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleAnalyze = () => {
        setAnalyzing(true);
        // Simulate AI analysis delay
        setTimeout(() => {
            setResult({
                root_cases: [
                    { factor: "High-value orders", impact: "+12%", description: "Three large enterprise orders processed in North America." },
                    { factor: "New Product Launch", impact: "+5%", description: "The 'Pro' version launch exceeded expectations by 200 units." }
                ],
                summary: "The revenue increase is primarily driven by specific B2B transactions rather than broad consumer growth."
            });
            setAnalyzing(false);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden m-4">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">Root Cause Analysis: {metricName}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {!result ? (
                        <div className="text-center py-8">
                            <div className="mb-6">
                                <p className="text-slate-600 mb-2">Identify why <b>{metricName}</b> changed significantly.</p>
                                <p className="text-sm text-slate-500">Gemini will analyze transaction-level data to find attribution.</p>
                            </div>
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2 mx-auto"
                            >
                                {analyzing ? (
                                    <>
                                        <Search className="animate-spin" size={20} /> Analyzing Data...
                                    </>
                                ) : (
                                    <>
                                        <Search size={20} /> Find Root Cause
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex gap-3">
                                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                                <div>
                                    <h4 className="font-semibold text-green-900">Analysis Complete</h4>
                                    <p className="text-green-800 text-sm mt-1">{result.summary}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-slate-900 mb-3">Top Contributing Factors</h4>
                                <div className="space-y-3">
                                    {result.root_cases.map((cause: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-slate-900">{cause.factor}</p>
                                                <p className="text-sm text-slate-500">{cause.description}</p>
                                            </div>
                                            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                                                {cause.impact}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DrillDownModal;
