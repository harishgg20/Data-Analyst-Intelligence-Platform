'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plug, CheckCircle, RefreshCw, X, AlertCircle, ShoppingBag, CreditCard } from 'lucide-react';

interface Connector {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    connected: boolean;
    lastSynced: string | null;
}

export default function ConnectorsPage() {
    const router = useRouter();
    const [connectors, setConnectors] = useState<Connector[]>([
        { id: 'shopify', name: 'Shopify', description: 'Import products & orders', icon: ShoppingBag, color: 'bg-emerald-500', connected: false, lastSynced: null },
        { id: 'stripe', name: 'Stripe', description: 'Sync transactions', icon: CreditCard, color: 'bg-indigo-500', connected: false, lastSynced: null },
        { id: 'woocommerce', name: 'WooCommerce', description: 'WordPress store sync', icon: ShoppingBag, color: 'bg-violet-500', connected: false, lastSynced: null },
    ]);

    const [modalOpen, setModalOpen] = useState(false);
    const [activeConnector, setActiveConnector] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [syncing, setSyncing] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initial check from local storage to persist simple state
    useEffect(() => {
        const newConnectors = connectors.map(c => ({
            ...c,
            connected: localStorage.getItem(`connected_${c.id}`) === 'true',
            lastSynced: localStorage.getItem(`synced_${c.id}`)
        }));
        setConnectors(newConnectors);
    }, []);

    const handleConnectClick = (id: string) => {
        setActiveConnector(id);
        setModalOpen(true);
        setApiKey('');
    };

    const handleConnectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/integrations/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ provider: activeConnector, api_key: apiKey })
            });

            if (res.ok) {
                // Update local state
                localStorage.setItem(`connected_${activeConnector}`, 'true');
                setConnectors(prev => prev.map(c => c.id === activeConnector ? { ...c, connected: true } : c));
                setModalOpen(false);
                setMessage({ type: 'success', text: `Successfully connected to ${activeConnector}` });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSync = async (id: string) => {
        setSyncing(id);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/integrations/sync/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const now = new Date().toLocaleString();
                localStorage.setItem(`synced_${id}`, now);
                setConnectors(prev => prev.map(c => c.id === id ? { ...c, lastSynced: now } : c));
                setMessage({
                    type: 'success',
                    text: `${data.message} (${data.details?.orders_imported || 0} orders, $${data.details?.revenue_added || 0})`
                });
            } else {
                setMessage({ type: 'error', text: 'Sync failed. Please try again.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error during sync.' });
        } finally {
            setSyncing(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Plug className="text-blue-600" /> Integrations Hub
                        </h1>
                        <p className="text-slate-500 text-sm">Connect external data sources to supercharge your dashboard</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {connectors.map(connector => {
                        const Icon = connector.icon;
                        return (
                            <div key={connector.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className={`h-2 ${connector.color} w-full`} />
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-lg ${connector.color} bg-opacity-10`}>
                                            <Icon className={`text-${connector.color.split('-')[1]}-600`} size={24} />
                                        </div>
                                        {connector.connected && (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                                <CheckCircle size={12} /> Connected
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{connector.name}</h3>
                                    <p className="text-slate-500 text-sm mb-6">{connector.description}</p>

                                    <div className="mt-auto space-y-3">
                                        {connector.connected ? (
                                            <>
                                                <div className="text-xs text-slate-400">
                                                    Last synced: {connector.lastSynced || 'Never'}
                                                </div>
                                                <button
                                                    onClick={() => handleSync(connector.id)}
                                                    disabled={syncing === connector.id}
                                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                                >
                                                    <RefreshCw size={18} className={syncing === connector.id ? "animate-spin" : ""} />
                                                    {syncing === connector.id ? 'Syncing...' : 'Sync Now'}
                                                </button>
                                                <button
                                                    className="w-full py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors text-sm"
                                                >
                                                    Configure
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleConnectClick(connector.id)}
                                                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Connect
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-slate-900 mb-4">Connect {connectors.find(c => c.id === activeConnector)?.name}</h2>

                        <form onSubmit={handleConnectSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">API Key / Access Token</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your API key..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">This is a simulation. Enter any dummy text.</p>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
                                >
                                    Save Connection
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
