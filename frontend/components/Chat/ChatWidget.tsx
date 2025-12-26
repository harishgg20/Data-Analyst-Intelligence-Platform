'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Database, Bot, User } from 'lucide-react';

interface Message {
    role: 'user' | 'bot';
    content: string;
    data?: any[]; // For future chart rendering
    sql?: string;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: 'Hello! I can answer questions about your sales data. Try "Show me top products" or "Revenue by region".' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            });

            if (!res.ok) throw new Error("Network error");

            const data = await res.json();

            // Add bot response
            setMessages(prev => [...prev, {
                role: 'bot',
                content: data.content,
                data: data.data, // Could be used to render charts later
                sql: data.sql
            }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I faced an error processing your request.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all z-50 animate-in slide-in-from-bottom-4"
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Header */}
                    <div className="p-4 bg-slate-900 text-white rounded-t-xl flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                        <div className="flex items-center gap-2">
                            <Bot size={20} className="text-blue-400" />
                            <h3 className="font-semibold text-sm">Data Assistant</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>

                                    {/* Optional: Show Data Table for small results */}
                                    {msg.data && msg.data.length > 0 && (
                                        <div className="mt-3 overflow-x-auto border rounded bg-slate-50 border-slate-200">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-100 font-semibold text-slate-600">
                                                    <tr>
                                                        {Object.keys(msg.data[0]).map(key => (
                                                            <th key={key} className="px-2 py-1 border-b">{key}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {msg.data.slice(0, 5).map((row: any, i: number) => (
                                                        <tr key={i} className="border-b last:border-0">
                                                            {Object.values(row).map((val: any, j) => (
                                                                <td key={j} className="px-2 py-1 truncate max-w-[100px]">{String(val)}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {msg.data.length > 5 && <p className="text-[10px] text-slate-400 p-1 italic">+ {msg.data.length - 5} more rows</p>}
                                        </div>
                                    )}

                                    {/* Optional: Show SQL for transparency/debugging if hovering or specialized mode */}
                                    {msg.sql && (
                                        <details className="mt-2 text-[10px] text-slate-400 cursor-pointer">
                                            <summary className="hover:text-slate-600 select-none">View SQL</summary>
                                            <code className="block mt-1 p-2 bg-slate-900 text-emerald-400 rounded overflow-x-auto font-mono">
                                                {msg.sql}
                                            </code>
                                        </details>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 p-3 rounded-lg rounded-tl-none flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-slate-400" />
                                    <span className="text-xs text-slate-500">Processing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your data..."
                            className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
