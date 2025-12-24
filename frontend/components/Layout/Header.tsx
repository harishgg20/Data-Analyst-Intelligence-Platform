'use client';

import { Bell, Search, User, Download } from 'lucide-react';
import { generatePDF } from '@/utils/pdfExport';
import { useState } from 'react';

const Header = () => {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        // Identify the main content area ID. 
        // We'll assume the main layout or specific page wraps content in id="main-content"
        // If not, we might need to target 'document.body' or add an ID to the layout.
        // For better results, let's target the dashboard container.
        await generatePDF('dashboard-content', 'dashboard-report.pdf');
        setExporting(false);
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
                <div className="hidden md:flex items-center text-sm text-slate-500">
                    <span className="mx-2">/</span>
                    <span>Overview</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors"
                >
                    <Download size={18} />
                    {exporting ? 'Exporting...' : 'Export Report'}
                </button>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                </div>

                <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-slate-700">Admin User</p>
                        <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold border border-blue-200">
                        AU
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
