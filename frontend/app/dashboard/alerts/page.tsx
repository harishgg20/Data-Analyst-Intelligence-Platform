'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Plus, Trash2, Power, Play, CheckCircle } from 'lucide-react';

interface AlertRule {
    id: number;
    name: string;
    metric: string;
    condition: string;
    threshold: number;
    is_active: boolean;
    last_triggered_at: string | null;
}

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function AlertsPage() {
    const router = useRouter();
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [tab, setTab] = useState<'RULES' | 'NOTIFICATIONS'>('RULES');

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newRule, setNewRule] = useState({ name: '', metric: 'REVENUE', condition: 'GT', threshold: 0 });

    const fetchRules = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/alerts/rules', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setRules(await res.json());
    };

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/alerts/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setNotifications(await res.json());
    };

    useEffect(() => {
        fetchRules();
        fetchNotifications();
    }, []);

    const handleCreate = async () => {
        const token = localStorage.getItem('token');
        await fetch('/api/alerts/rules', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(newRule)
        });
        setIsAdding(false);
        fetchRules();
    };

    const handleToggle = async (id: number) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/alerts/rules/${id}/toggle`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        fetchRules();
    };

    const handleDelete = async (id: number) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/alerts/rules/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        fetchRules();
    };

    const handleRunChecks = async () => {
        const token = localStorage.getItem('token');
        await fetch('/api/alerts/run', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        fetchNotifications(); // Refresh notifications
        fetchRules(); // Refresh last_triggered
        alert("Manual check executed!");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} className="text-slate-600" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Alerts</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleRunChecks}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 flex items-center gap-2"
                        >
                            <Play size={16} /> Run Check Now
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setTab('RULES')}
                        className={`px-6 py-3 font-medium ${tab === 'RULES' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Alert Rules
                    </button>
                    <button
                        onClick={() => setTab('NOTIFICATIONS')}
                        className={`px-6 py-3 font-medium ${tab === 'NOTIFICATIONS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Notifications
                        {notifications.filter(n => !n.is_read).length > 0 &&
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                                {notifications.filter(n => !n.is_read).length}
                            </span>
                        }
                    </button>
                </div>

                {/* Content */}
                {tab === 'RULES' ? (
                    <div className="space-y-4">
                        {/* Create Rule Form */}
                        {isAdding ? (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
                                <h3 className="font-semibold text-slate-800">New Alert Rule</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text" placeholder="Rule Name (e.g. High Revenue)"
                                        className="p-2 border rounded"
                                        value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                    />
                                    <select
                                        className="p-2 border rounded"
                                        value={newRule.metric} onChange={e => setNewRule({ ...newRule, metric: e.target.value })}
                                    >
                                        <option value="REVENUE">Daily Revenue</option>
                                        <option value="ORDERS">Daily Orders</option>
                                        <option value="AOV">Daily AOV</option>
                                    </select>
                                    <select
                                        className="p-2 border rounded"
                                        value={newRule.condition} onChange={e => setNewRule({ ...newRule, condition: e.target.value })}
                                    >
                                        <option value="GT">Greater Than ({'>'})</option>
                                        <option value="LT">Less Than ({'<'})</option>
                                    </select>
                                    <input
                                        type="number" placeholder="Threshold Value"
                                        className="p-2 border rounded"
                                        value={newRule.threshold} onChange={e => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                                    <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Rule</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex justify-center items-center gap-2"
                            >
                                <Plus size={20} /> Add New Alert Rule
                            </button>
                        )}

                        {/* Rules List */}
                        {rules.map(rule => (
                            <div key={rule.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-800">{rule.name}</h4>
                                    <p className="text-sm text-slate-500">
                                        If <strong>{rule.metric}</strong> is <strong>{rule.condition === 'GT' ? 'Greater' : 'Less'} Than {rule.threshold}</strong>
                                    </p>
                                    {rule.last_triggered_at && <p className="text-xs text-slate-400 mt-1">Last triggered: {new Date(rule.last_triggered_at).toLocaleString()}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(rule.id)}
                                        className={`p-2 rounded-full ${rule.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        <Power size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No notifications yet.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`p-4 flex gap-4 ${notif.is_read ? 'bg-white' : 'bg-blue-50/50'}`}>
                                        <div className={`mt-1 p-1.5 rounded-full ${notif.is_read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                                            <Bell size={16} />
                                        </div>
                                        <div>
                                            <p className="text-slate-800">{notif.message}</p>
                                            <p className="text-xs text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
