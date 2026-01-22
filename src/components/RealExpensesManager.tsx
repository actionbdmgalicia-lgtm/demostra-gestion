'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Wallet, ArrowDown, ArrowUp } from 'lucide-react';
import ExpenseImputationForm from './ExpenseImputationForm';
import Modal from '@/components/Modal';

interface RealExpensesManagerProps {
    fair: any;
    onClose?: () => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
    'VENTA': '#00FFFF', 'CARPINTERIA': '#92D050', 'MONTAJE': '#92D050', 'MATERIAL': '#9BC2E6',
    'TRANSPORTE': '#FFC000', 'GASTOS VIAJE': '#C6E0B4', 'MOB ALQ': '#FF99FF', 'ELECTRICIDAD': '#00B0F0',
    'SSFF': '#FFFF00', 'MOB COMPRA': '#FF66FF', 'GRAFICA': '#FFC000', 'GASTOS GG': '#DDEBF7'
};

export default function RealExpensesManager({ fair, onClose }: RealExpensesManagerProps) {
    const [modalMode, setModalMode] = useState<'NONE' | 'CREATE' | 'EDIT'>('NONE');
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [expenses, setExpenses] = useState<any[]>(fair.realExpenses || []);

    // Sort: Date desc
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleSuccess = (data: any) => {
        // Since we don't have a real-time subscription or re-fetch here yet (unless we trigger a router refresh in parent),
        // we manually update the local list to reflect changes immediately.
        // However, the action calls revalidatePath, so router.refresh() in parent would be ideal.
        // For now, let's update local state.

        let newExpenses;
        if (modalMode === 'EDIT' && data.id) {
            newExpenses = expenses.map(e => e.id === data.id ? data : e);
        } else {
            newExpenses = [data, ...expenses];
        }
        setExpenses(newExpenses);
        setModalMode('NONE');
        setEditingExpense(null);
        // We really should trigger a router refresh to sync everything.
        // We can emit an event or let the parent handle it.
        // But for now, this local update gives instant feedback.
        window.location.reload(); // Brute force refresh to ensure data consistency with server
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* TOOLBAR */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Wallet className="text-brand-black" size={20} />
                    Movimientos Reales
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setEditingExpense(null); setModalMode('CREATE'); }}
                        className="btn-primary flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest"
                    >
                        <Plus size={14} /> Nuevo Movimiento
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-grow overflow-auto p-4 bg-gray-50/50">
                <table className="w-full text-sm bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50 border-b border-gray-200 text-brand-grey uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                            <th className="p-3 text-left">Fecha</th>
                            <th className="p-3 text-left">Tipo</th>
                            <th className="p-3 text-left">Concepto</th>
                            <th className="p-3 text-left">Proveedor</th>
                            <th className="p-3 text-right">Importe</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedExpenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50 group transition-colors">
                                <td className="p-3 font-mono text-gray-400 text-xs">{new Date(expense.date).toLocaleDateString()}</td>
                                <td className="p-3 font-bold">
                                    {expense.type === 'INCOME' ? (
                                        <span className="flex items-center gap-1 text-brand-accent">
                                            <ArrowUp size={12} strokeWidth={3} /> VENTA
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-brand-black">
                                            <ArrowDown size={12} strokeWidth={3} />
                                            <span style={{ backgroundColor: CATEGORY_COLORS[expense.category] }} className="px-2 py-0.5 rounded text-[10px] text-white uppercase ml-1">
                                                {expense.category}
                                            </span>
                                        </span>
                                    )}
                                </td>
                                <td className="p-3 font-medium text-gray-700">{expense.concept}</td>
                                <td className="p-3 text-gray-500 text-xs uppercase">{expense.provider || '-'}</td>
                                <td className={`p-3 text-right font-black font-mono ${expense.type === 'INCOME' ? 'text-brand-accent' : 'text-brand-black'}`}>
                                    {expense.totalAmount?.toFixed(2)}€
                                </td>
                                <td className="p-3 text-right relative">
                                    <button
                                        onClick={() => { setEditingExpense(expense); setModalMode('EDIT'); }}
                                        className="text-gray-300 hover:text-brand-black transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {sortedExpenses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-gray-400 italic">
                                    No hay movimientos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL Wrapper */}
            {modalMode !== 'NONE' && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold uppercase tracking-widest text-brand-black">
                                {modalMode === 'EDIT' ? 'Editar Movimiento' : 'Nuevo Movimiento'}
                            </h3>
                            <button onClick={() => setModalMode('NONE')} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="overflow-auto p-4 bg-gray-100">
                            <ExpenseImputationForm
                                fairId={fair.id}
                                clients={fair.clients}
                                initialData={editingExpense}
                                mode={modalMode}
                                onSaveSuccess={handleSuccess}
                                onCancel={() => setModalMode('NONE')}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
