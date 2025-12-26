import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import ChatWidget from '@/components/Chat/ChatWidget';
import { FilterProvider } from '@/contexts/FilterContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden ml-64">
                <FilterProvider>
                    <Header />
                    <main id="dashboard-content" className="flex-1 overflow-x-hidden overflow-y-auto p-6 transition-all duration-300">
                        {children}
                    </main>
                </FilterProvider>
            </div>
            <ChatWidget />
        </div>
    );
}
