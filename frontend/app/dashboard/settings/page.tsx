'use client';

import { useState, useEffect } from 'react';
import { Save, User, Key, Shield } from 'lucide-react';

export default function SettingsPage() {
    const [profile, setProfile] = useState({
        full_name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
    });
    const [apiKey, setApiKey] = useState('**********************');
    const [isSaving, setIsSaving] = useState(false);

    // Mock fetch profile
    useEffect(() => {
        // In real app, fetch from /users/me
    }, []);

    const handleSaveProfile = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

            {/* Profile Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <User className="text-blue-600" size={24} />
                    <h2 className="text-lg font-semibold text-slate-900">User Profile</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={profile.full_name}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveProfile}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin Only Section */}
            {profile.role === 'admin' && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                        <Shield className="text-purple-600" size={24} />
                        <h2 className="text-lg font-semibold text-slate-900">Admin Configuration</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        value={apiKey}
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500"
                                    />
                                </div>
                                <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">
                                    Change
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                This key is used for AI insight generation. Only admins can modify this.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
