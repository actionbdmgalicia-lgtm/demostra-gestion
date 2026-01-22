'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getAllFairsAndClients } from '@/app/actions_data';
import { saveExpenseImputation } from '@/app/actions_expenses';
import { ArrowLeft, Wallet, Save, Check, AlertCircle, Plus, X } from 'lucide-react';
import ExpenseImputationForm from './ExpenseImputationForm';
import Link from 'next/link';

// Reuse colors
const CATEGORY_COLORS: { [key: string]: string } = {
    'VENTA': '#00FFFF', 'CARPINTERIA': '#92D050', 'MONTAJE': '#92D050', 'MATERIAL': '#9BC2E6',
    'TRANSPORTE': '#FFC000', 'GASTOS VIAJE': '#C6E0B4', 'MOB ALQ': '#FF99FF', 'ELECTRICIDAD': '#00B0F0',
    'SSFF': '#FFFF00', 'MOB COMPRA': '#FF66FF', 'GRAFICA': '#FFC000', 'GASTOS GG': '#DDEBF7'
};

const STANDARD_CATEGORIES = [
    'CARPINTERIA', 'MONTAJE', 'MATERIAL', 'TRANSPORTE',
    'GASTOS VIAJE', 'MOB ALQ', 'ELECTRICIDAD', 'SSFF',
    'MOB COMPRA', 'GRAFICA', 'GASTOS GG', 'OTROS'
];

export default function ExpenseImputer() {
    const [allFairs, setAllFairs] = useState<any[]>([]);
    const [selectedFairId, setSelectedFairId] = useState('');
    const [loading, setLoading] = useState(true);
    const [imputationHistory, setImputationHistory] = useState<any[]>([]);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        getAllFairsAndClients().then(data => {
            setAllFairs(data);
            if (data.length > 0) setSelectedFairId(data[0].id);
            setLoading(false);
        });
    }, []);

    const currentFair = useMemo(() => allFairs.find(f => f.id === selectedFairId), [allFairs, selectedFairId]);
    const clients = useMemo(() => currentFair?.clients || [], [currentFair]);

    const handleDeleteFromHistory = (index: number) => {
        setImputationHistory(prev => prev.filter((_, i) => i !== index));
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="min-h-screen bg-brand-light font-sans text-brand-black">
            {/* HEADER */}
            <div className="bg-white px-8 py-6 border-b border-gray-200 flex items-center gap-6 sticky top-0 z-50">
                <Link href="/" className="text-brand-grey hover:text-brand-black transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-black text-brand-black uppercase tracking-tight flex items-center gap-3">
                    <span className="p-1 rounded bg-brand-black text-white"><Wallet size={20} /></span>
                    Imputación / Ventas
                </h1>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 space-y-6">

                {/* FAIR SELECTOR */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm max-w-xl">
                    <label className="text-[10px] font-bold text-brand-grey uppercase tracking-widest mb-2 block">Evento / Feria</label>
                    <select
                        value={selectedFairId}
                        onChange={e => setSelectedFairId(e.target.value)}
                        className="w-full text-lg font-bold bg-gray-50 border-b-2 border-transparent hover:border-brand-black focus:border-brand-black transition-all p-3 outline-none"
                    >
                        {allFairs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>

                {/* FORM COMPONENT */}
                {selectedFairId && (
                    <ExpenseImputationForm
                        fairId={selectedFairId}
                        clients={clients}
                        onSaveSuccess={(data) => {
                            setImputationHistory(prev => [{ ...data, id: Date.now().toString() }, ...prev]);
                            setSuccessMsg(`${data.type === 'INCOME' ? 'Venta' : 'Gasto'} guardado correctamente.`);
                            setTimeout(() => setSuccessMsg(''), 3000);
                        }}
                    />
                )}

                {/* SUCCESS MESSAGE */}
                {successMsg && (
                    <div className="fixed bottom-8 right-8 bg-black text-white px-6 py-4 rounded shadow-lg animate-in slide-in-from-bottom-4 flex items-center gap-3 z-50">
                        <Check size={20} className="text-green-400" />
                        <span className="font-bold">{successMsg}</span>
                    </div>
                )}

                {/* HISTORY */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-8">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-brand-black flex items-center gap-2">
                            <span className="w-2 h-2 bg-brand-accent rounded-full"></span>
                            Historial de Sesión Actual
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-white border-b border-gray-200 text-brand-grey uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-4 w-20">Hora</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Concepto</th>
                                    <th className="p-4 text-right">Importe</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {imputationHistory.map((item, idx) => (
                                    <tr key={item.id || idx} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-400 font-mono">{new Date(parseInt(item.id)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="p-4 font-bold text-brand-black">
                                            {item.type === 'INCOME' ? (
                                                <span className="px-2 py-1 rounded-sm text-[10px] uppercase tracking-wider text-white bg-brand-accent">VENTA</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-sm text-[10px] uppercase tracking-wider text-white" style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#999' }}>
                                                    {item.category}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600 truncate max-w-[200px]">{item.concept || '-'}</td>
                                        <td className="p-4 text-right font-mono font-bold text-brand-black">{item.totalAmount?.toFixed(2)}€</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDeleteFromHistory(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {imputationHistory.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">No hay movimientos en esta sesión.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
