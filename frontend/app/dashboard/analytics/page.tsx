'use client';

import { useState } from 'react';
import InsightTimeline from '@/components/AI/InsightTimeline';
import RevenueTrendChart from '@/components/Charts/RevenueTrendChart';
import ComparisonView from '@/components/Analysis/ComparisonView';
import DrillDownModal from '@/components/Analysis/DrillDownModal';
import ExecutiveReport from '@/components/AI/ExecutiveReport';

export default function AnalyticsPage() {
    const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Advanced Analytics</h1>
                <button
                    onClick={() => setIsDrillDownOpen(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                    Run Root Cause Analysis
                </button>
            </div>

            <DrillDownModal
                isOpen={isDrillDownOpen}
                onClose={() => setIsDrillDownOpen(false)}
                metricName="Total Revenue"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-96">
                        <RevenueTrendChart />
                    </div>

                    <ComparisonView />
                </div>

                {/* AI Insights Sidebar */}
                <div>
                    <InsightTimeline />
                </div>

                {/* Full Width Report Section */}
                <ExecutiveReport />
            </div>
        </div>
    );
}
