'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Settings, LogOut, PieChart } from 'lucide-react';

const Sidebar = () => {
    const pathname = usePathname();

    const links = [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
        { href: '/dashboard/analytics', label: 'Analytics', icon: PieChart },
        { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col">
            <div className="p-6 border-b border-slate-700">
                <h1 className="text-xl font-bold text-blue-400">DataPlatform.ai</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
