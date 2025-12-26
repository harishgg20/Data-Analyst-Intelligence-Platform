'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Save, Trash2, ChevronDown, Check, X } from 'lucide-react';
import { useFilter } from '@/contexts/FilterContext';

interface SavedView {
    id: number;
    name: string;
    settings: string;
}

export default function SavedViewsMenu() {
    const { selectedCategory, selectedRegion, setSelectedCategory, setSelectedRegion, dateRange, setDateRange } = useFilter();
    const [views, setViews] = useState<SavedView[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newViewName, setNewViewName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    const fetchViews = async () => {
        try {
            const res = await fetch('/api/users/me/views');
            if (res.ok) {
                const data = await res.json();
                setViews(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isOpen) fetchViews();
    }, [isOpen]);

    const handleSave = async () => {
        if (!newViewName.trim()) return;
        setIsSaving(true);
        try {
            const settings = JSON.stringify({ category: selectedCategory, region: selectedRegion, dateRange });

            const res = await fetch('/api/users/me/views', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newViewName, settings })
            });

            if (res.ok) {
                setNewViewName('');
                setShowSaveInput(false);
                fetchViews();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoad = (view: SavedView) => {
        try {
            const settings = JSON.parse(view.settings);
            setSelectedCategory(settings.category || null);
            setSelectedRegion(settings.region || null);
            if (settings.dateRange) setDateRange(settings.dateRange);
            setIsOpen(false);
        } catch (e) {
            console.error("Failed to parse view settings", e);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await fetch(`/api/users/me/views/${id}`, {
                method: 'DELETE'
            });
            setViews(prev => prev.filter(v => v.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                title="Saved Views"
            >
                <Bookmark size={16} className="text-slate-500" />
                <span className="hidden sm:inline">Views</span>
                <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-slate-100">
                        {!showSaveInput ? (
                            <button
                                onClick={() => setShowSaveInput(true)}
                                className="w-full py-1.5 px-3 bg-blue-50 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Save size={14} />
                                Save Current View
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="View Name..."
                                    className="flex-1 text-xs px-2 py-1 border rounded"
                                    value={newViewName}
                                    onChange={e => setNewViewName(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={() => setShowSaveInput(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1">
                        {views.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No saved views</p>
                        ) : (
                            views.map((view) => (
                                <div
                                    key={view.id}
                                    onClick={() => handleLoad(view)}
                                    className="group flex items-center justify-between p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors"
                                >
                                    <span className="text-xs text-slate-700 font-medium truncate">{view.name}</span>
                                    <button
                                        onClick={(e) => handleDelete(e, view.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}


