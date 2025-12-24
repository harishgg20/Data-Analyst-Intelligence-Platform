'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, ArrowRight, Volume2, StopCircle } from 'lucide-react';

interface Insight {
    id: number;
    title: string;
    type: 'TREND' | 'ANOMALY' | 'PREDICTION' | 'RECOMMENDATION';
    content: string;
    confidence_score: number;
    created_at: string;
}

const InsightTimeline = () => {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(false);
    const [speakingId, setSpeakingId] = useState<number | null>(null);

    // Mock fetch for demonstration if API is not available
    const fetchInsights = async () => {
        setLoading(true);
        try {
            // In a real app, use auth token
            const res = await fetch('/api/ai/insights');

            if (!res.ok) {
                const text = await res.text();
                console.error("API Error:", text);
                return; // Stop processing
            }

            const data = await res.json();
            setInsights(data);
        } catch (error) {
            console.error("Failed to fetch insights", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();

        // Cleanup speech on unmount
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const handleSpeak = (insight: Insight) => {
        if (speakingId === insight.id) {
            window.speechSynthesis.cancel();
            setSpeakingId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(insight.content);
        utterance.onend = () => setSpeakingId(null);
        setSpeakingId(insight.id);
        window.speechSynthesis.speak(utterance);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'TREND': return <TrendingUp className="text-blue-500" />;
            case 'ANOMALY': return <AlertTriangle className="text-red-500" />;
            default: return <Lightbulb className="text-yellow-500" />;
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">AI Business Insights</h3>
                <button
                    onClick={fetchInsights}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Refresh
                </button>
            </div>
            <div className="p-6 space-y-6">
                {loading ? (
                    <p className="text-slate-500 text-center">Analyzing data...</p>
                ) : (
                    insights.map((insight) => (
                        <div key={insight.id} className="flex gap-4">
                            <div className="mt-1 p-2 bg-slate-50 rounded-lg h-fit">
                                {getIcon(insight.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-slate-900">{insight.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSpeak(insight)}
                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                            title="Read Aloud"
                                        >
                                            {speakingId === insight.id ? <StopCircle size={16} /> : <Volume2 size={16} />}
                                        </button>
                                        <span className="text-xs text-slate-500">
                                            {new Date(insight.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm mt-1">{insight.content}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${insight.confidence_score > 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {Math.round(insight.confidence_score * 100)}% Confidence
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InsightTimeline;
