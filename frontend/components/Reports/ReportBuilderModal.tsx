'use client';
import { useState } from 'react';
import { X, FileText, Check } from 'lucide-react';
import { generatePDF } from '@/utils/pdfExport';

interface ReportBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SECTIONS = [
    { id: 'kpis', label: 'KPI Overview', description: 'Total Revenue, Orders, AOV, Customers' },
    { id: 'charts-main', label: 'Main Charts', description: 'Revenue Trends & Category Analysis' },
    { id: 'charts-region', label: 'Regional Data', description: 'Sales by Region' },
    { id: 'ai-insights', label: 'AI Insights', description: 'Automated analysis and recommendations' },
];

export default function ReportBuilderModal({ isOpen, onClose }: ReportBuilderModalProps) {
    const [selectedSections, setSelectedSections] = useState<string[]>(SECTIONS.map(s => s.id));
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const toggleSection = (id: string) => {
        setSelectedSections(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Sort selected based on original order to keep report logical
            const ordered = SECTIONS.map(s => s.id).filter(id => selectedSections.includes(id));
            if (ordered.length === 0) {
                alert("Please select at least one section.");
                return;
            }
            await generatePDF(ordered, 'Custom_Report.pdf');
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to generate report.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600" size={20} />
                        Report Builder
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 mb-2">Select the sections you want to include in your PDF report.</p>

                    <div className="space-y-3">
                        {SECTIONS.map((section) => {
                            const isSelected = selectedSections.includes(section.id);
                            return (
                                <div
                                    key={section.id}
                                    onClick={() => toggleSection(section.id)}
                                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-blue-200'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                                        }`}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                            {section.label}
                                        </h4>
                                        <p className="text-xs text-slate-500">{section.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || selectedSections.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {isGenerating ? 'Generating...' : 'Download PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
}
