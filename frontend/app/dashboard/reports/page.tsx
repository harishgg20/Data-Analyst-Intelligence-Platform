'use client';

import { FileText, Download, Calendar } from 'lucide-react';

export default function ReportsPage() {
    const historicalReports: any[] = [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Reports Archive</h1>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Available Reports</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {historicalReports.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                                <FileText size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No archived reports</h3>
                            <p className="mt-1 text-sm">Generated reports will appear here automatically.</p>
                        </div>
                    ) : (
                        historicalReports.map((report) => (
                            <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900">{report.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                            <Calendar size={14} />
                                            <span>{report.date}</span>
                                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-semibold">{report.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                    <Download size={20} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> Real-time reports can be generated from the
                    <a href="/dashboard/analytics" className="underline ml-1 font-semibold">Analytics</a> page.
                </p>
            </div>
        </div>
    );
}
