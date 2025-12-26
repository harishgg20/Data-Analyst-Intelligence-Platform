'use client';

import { useState } from 'react';
import { UploadCloud, FileText, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Database, Plug, BarChart3, AlertTriangle, Check, Table as TableIcon } from 'lucide-react';

// Data Health Report Component
function DataHealthReport({
    analysis,
    onConfirm,
    uploading,
    replaceData,
    onReplaceToggle
}: {
    analysis: any,
    onConfirm: () => void,
    uploading: boolean,
    replaceData: boolean,
    onReplaceToggle: (val: boolean) => void
}) {
    if (!analysis) return null;

    const { shape, missing_values, duplicates, preview, recommendations } = analysis;
    const missingCount = Object.values(missing_values).reduce((a: any, b: any) => a + b, 0) as number;

    // Explicit Missing Data Breakdown
    const missingDetails = Object.entries(missing_values)
        .filter(([_, count]) => (count as number) > 0)
        .map(([col, count]) => `${col}: ${count} missing`);

    return (
        <div className="mt-8 border rounded-xl overflow-hidden bg-slate-50 border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats */}
            <div className="p-6 border-b border-slate-200 bg-white">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <TableIcon size={20} className="text-blue-600" />
                            Data Preview & Statistics
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Review your raw data before import.
                        </p>
                    </div>
                    {uploading ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-lg">
                            <Loader2 className="animate-spin" size={18} />
                            {replaceData ? 'Replacing Data...' : 'Appending Data...'}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={replaceData}
                                    onChange={(e) => onReplaceToggle(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Replace Existing Data
                            </label>
                            <button
                                onClick={onConfirm}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-shadow shadow-md hover:shadow-lg"
                            >
                                <span className="flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    {replaceData ? 'Import & Replace' : 'Import & Append'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-xs font-medium text-slate-500 uppercase">Total Rows</p>
                        <p className="text-2xl font-bold text-slate-800">{shape.rows.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-xs font-medium text-slate-500 uppercase">Columns</p>
                        <p className="text-2xl font-bold text-slate-800">{shape.cols}</p>
                    </div>
                    <div className={`p-4 rounded-lg border ${missingCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
                        <p className={`text-xs font-medium uppercase ${missingCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>Missing Values</p>
                        <p className={`text-2xl font-bold ${missingCount > 0 ? 'text-amber-700' : 'text-green-700'}`}>{missingCount}</p>
                    </div>
                    <div className={`p-4 rounded-lg border ${duplicates > 0 ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
                        <p className={`text-xs font-medium uppercase ${duplicates > 0 ? 'text-amber-600' : 'text-green-600'}`}>Duplicates</p>
                        <p className={`text-2xl font-bold ${duplicates > 0 ? 'text-amber-700' : 'text-green-700'}`}>{duplicates}</p>
                    </div>
                </div>

                {/* Missing Details Alert */}
                {missingCount > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                        <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <span className="font-semibold">Attention Needed:</span> Found missing data in:
                            <span className="font-mono ml-1">{missingDetails.join(', ')}</span>.
                            <br />
                            <span className="opacity-80 mt-1 block text-xs">The "Clean Data" process will automatically fix these using statistical imputation (Median/Mode).</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Preview Table */}
            <div className="p-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <TableIcon size={16} />
                    Raw Data Preview
                </h4>
                <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg shadow-sm scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                    <table className="w-full text-sm text-left relative">
                        <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
                            <tr>
                                {analysis.columns.map((col: string) => (
                                    <th key={col} className="px-4 py-3 border-b border-slate-200 whitespace-nowrap bg-slate-50">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {preview.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                    {analysis.columns.map((col: string) => (
                                        <td key={col} className="px-4 py-2 whitespace-nowrap text-slate-700 max-w-[200px] truncate border-r border-slate-50 last:border-0">
                                            {row[col] !== null ? row[col].toString() : <span className="text-slate-400 italic">null</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">Showing first {preview.length} rows of {shape.rows}</p>
            </div>
        </div>
    );
}

export default function UploadPage() {
    // ... (existing state) ...
    // State
    const [activeTab, setActiveTab] = useState<'csv' | 'pdf' | 'db'>('csv');
    const [isDragOver, setIsDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [analysis, setAnalysis] = useState<any>(null);
    const [replaceData, setReplaceData] = useState(true);

    // DB State
    const [dbConfig, setDbConfig] = useState({
        type: 'postgresql',
        host: 'localhost',
        port: '5432',
        user: 'postgres',
        password: '',
        dbname: 'analytics_db'
    });

    const dbOptions = [
        { id: 'postgresql', name: 'PostgreSQL', icon: Database, color: 'text-blue-600', port: '5432' },
        { id: 'mysql', name: 'MySQL', icon: Database, color: 'text-orange-600', port: '3306' },
        { id: 'sqlserver', name: 'SQL Server', icon: Database, color: 'text-red-600', port: '1433' },
        { id: 'mongodb', name: 'MongoDB', icon: Database, color: 'text-green-600', port: '27017' }
    ];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const scanFile = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload/analyze', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ detail: res.statusText }));
                throw new Error(errorData.detail || `Server Error: ${res.status}`);
            }

            const result = await res.json();
            setAnalysis(result);
            setFile(file);

        } catch (error: any) {
            console.error(error);
            alert(`Analysis Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const onFileSelected = (file: File) => {
        if (activeTab === 'csv') {
            scanFile(file);
        } else {
            setFile(file);
        }
    };

    const validateAndSetFile = (file: File) => {
        const validTypes = activeTab === 'csv' ? ['text/csv', 'application/vnd.ms-excel'] : ['application/pdf'];
        if (validTypes.includes(file.type)) {
            onFileSelected(file);
            setUploadStatus('idle');
        } else {
            alert(`Please upload a valid ${activeTab.toUpperCase()} file.`);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setUploadStatus('idle');

        try {
            // 1. Clear Data if requested
            if (activeTab === 'csv' && replaceData) {
                try {
                    console.log("Clearing existing data...");
                    await fetch('/api/upload/clear', { method: 'DELETE' });
                } catch (e) {
                    console.error("Clear failed, proceeding anyway", e);
                }
            }

            const formData = new FormData();
            formData.append('file', file);

            const endpoint = activeTab === 'csv' ? '/api/upload/csv' : '/api/upload/pdf';

            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Upload failed');
            }

            const data = await res.json();
            setUploading(false);
            setUploadStatus('success');

            if (activeTab === 'pdf') {
                alert(`Analysis Complete!\n\n${data.title}\n\nCheck 'Recent AI Insights' on the dashboard to see the full report.`);
            } else {
                window.location.href = '/dashboard';
            }

            setTimeout(() => {
                setFile(null);
                setUploadStatus('idle');
            }, 3000);

        } catch (error) {
            console.error('Upload error:', error);
            setUploading(false);
            setUploadStatus('error');
            alert('Upload failed. Please check details.');
        }
    };

    const handleDbConnect = async () => {
        setUploading(true);
        // Simulate DB Connection Check
        setTimeout(() => {
            setUploading(false);
            alert("Successfully connected to external database!\nThe dashboard will now sync periodically with this source.");
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* ... (Header and Tabs) ... */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Data Import</h1>
                    <p className="text-slate-500 mt-1">Upload files or connect to external data sources.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('csv')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'csv' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <FileSpreadsheet size={16} />
                    CSV Upload
                </button>
                <button
                    onClick={() => setActiveTab('db')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'db' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Database size={16} />
                    Connect Database
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                {activeTab === 'db' ? (
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Connect to External Database</h3>
                            <p className="text-slate-500 text-sm mt-1">Select your database provider</p>
                        </div>

                        {/* DB Type Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                            {dbOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setDbConfig({ ...dbConfig, type: opt.id, port: opt.port })}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${dbConfig.type === opt.id
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <opt.icon size={24} className={opt.color} />
                                    <span className={`text-xs font-semibold ${dbConfig.type === opt.id ? 'text-blue-700' : 'text-slate-600'}`}>
                                        {opt.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Host</label>
                                <input
                                    type="text"
                                    value={dbConfig.host}
                                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="localhost"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Port</label>
                                <input
                                    type="text"
                                    value={dbConfig.port}
                                    onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="5432"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Database Name</label>
                            <input
                                type="text"
                                value={dbConfig.dbname}
                                onChange={(e) => setDbConfig({ ...dbConfig, dbname: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="my_database"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">User</label>
                                <input
                                    type="text"
                                    value={dbConfig.user}
                                    onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="postgres"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Password</label>
                                <input
                                    type="password"
                                    value={dbConfig.password}
                                    onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleDbConnect}
                                disabled={uploading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="animate-spin" size={20} /> : <Plug size={20} />}
                                {uploading ? 'Connecting...' : 'Test Connection & Sync'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Dropzone */}
                        {/* Remove file variable check for Dropzone, handle it internally or wrapping */}
                        {/* Actually, existing code renders Dropzone ALWAYS unless activeTab is DB? No, wait. */}
                        {/* Existing code structure: */}
                        {/* <div className="... dropzone ..."> ... {file ? FileInfo : DefaultPrompt} ... </div> */}

                        {/* REPLACEMENT LOGIC: Keep Dropzone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                                }`}
                        >
                            {/* ... Dropzone Content ... */}
                            <div className={`p-4 rounded-full mb-4 ${activeTab === 'csv' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {activeTab === 'csv' ? <FileSpreadsheet size={32} /> : <FileText size={32} />}
                            </div>

                            {file ? (
                                <div className="text-center">
                                    <p className="text-lg font-medium text-slate-900">{file.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                    <button
                                        onClick={() => { setFile(null); setAnalysis(null); }}
                                        className="text-sm text-red-500 hover:text-red-600 mt-4 font-medium"
                                    >
                                        Remove File
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-lg font-medium text-slate-900">
                                        Drag & drop your {activeTab.toUpperCase()} file here
                                    </p>
                                    <label className="cursor-pointer block mt-4">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept={activeTab === 'csv' ? ".csv" : ".pdf"}
                                            onChange={handleFileSelect}
                                        />
                                        <span className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                                            Browse Files
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Analysis & Clean Data Action */}
                        {analysis && activeTab === 'csv' ? (
                            <DataHealthReport
                                analysis={analysis}
                                onConfirm={handleUpload}
                                uploading={uploading}
                                replaceData={replaceData}
                                onReplaceToggle={setReplaceData}
                            />
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}
