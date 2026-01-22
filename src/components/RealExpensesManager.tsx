'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, X, Wallet } from 'lucide-react';
import ExpenseImputationForm from './ExpenseImputationForm';

interface RealExpensesManagerProps {
    fair: any;
    onClose?: () => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
    'VENTA': '#00FFFF', 'CARPINTERIA': '#92D050', 'MONTAJE': '#92D050', 'MATERIAL': '#9BC2E6',
    'TRANSPORTE': '#FFC000', 'GASTOS VIAJE': '#C6E0B4', 'MOB ALQ': '#FF99FF', 'ELECTRICIDAD': '#00B0F0',
    'SSFF': '#FFFF00', 'MOB COMPRA': '#FF66FF', 'GRAFICA': '#FFC000', 'GASTOS GG': '#DDEBF7',
    'OTROS': '#F4F4F5', 'DEFAULT': '#F3F4F6'
};

export default function RealExpensesManager({ fair, onClose }: RealExpensesManagerProps) {
    const [modalMode, setModalMode] = useState<'NONE' | 'CREATE' | 'EDIT'>('NONE');
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [expenses, setExpenses] = useState<any[]>(fair.realExpenses || []);

    const clients = fair.clients || [];

    const handleSuccess = (data: any) => {
        // Brute force refresh for data consistency
        window.location.reload();
    };

    // --- GROUP AND SORT ---
    // Group: Category -> Array of Expense items
    const groupedExpenses = useMemo(() => {
        const groups: { [cat: string]: any[] } = {};
        expenses.forEach(e => {
            const cat = e.category || 'OTROS';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(e);
        });

        // Sort items by date desc
        Object.keys(groups).forEach(k => {
            groups[k].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        return groups;
    }, [expenses]);

    // Determines categories order, putting VENTA first
    const categories = Object.keys(groupedExpenses).sort((a, b) => {
        if (a === 'VENTA') return -1;
        if (b === 'VENTA') return 1;
        return a.localeCompare(b);
    });

    const getCategoryColor = (cat: string) => {
        return CATEGORY_COLORS[cat.toUpperCase()] || CATEGORY_COLORS['DEFAULT'];
    };

    // --- CALCULATORS ---
    // Total for a column (Client) for ALL expenses
    const getClientTotalExpense = (clientId: string) => {
        return expenses.filter(e => e.type === 'EXPENSE').reduce((sum, e) => {
            // Check if client is in distribution
            const dist = e.distribution || {};
            // Expense is negative in DB logic for Budget, but here stored usually as positive total and distribution.
            // Wait, standard for Expense in this app: stored as POSITIVE total, need to verify "signed" value logic.
            // Budget matrix stores expenses as NEGATIVE.
            // Let's standardise: Expense = Negative.
            // In the DB, 'saveExpenseImputation' saves positive totalAmount.
            // Typically "Expenses" are displayed negative.
            // If distribution has { "clientA": 100 }, that 100 is cost. So it should be -100 for profit calc.
            return sum - (dist[clientId] || 0);
        }, 0);
    };

    const getClientTotalIncome = (clientId: string) => {
        return expenses.filter(e => e.type === 'INCOME').reduce((sum, e) => {
            const dist = e.distribution || {};
            return sum + (dist[clientId] || 0);
        }, 0);
    };

    // Calculate row total for an unexpected column or checking
    // Not strictly needed if we trust the columns sum up to Total, but good for display.

    return (
        <div className="h-full flex flex-col bg-white">
            {/* TOOLBAR */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-brand-black">
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
                </div>
            </div>

            {/* MATRIX TABLE VIEW */}
            <div className="flex-grow overflow-auto bg-white relative pb-32">
                <table className="w-full border-collapse text-left">
                    <thead className="bg-white sticky top-0 z-40 shadow-sm border-b-2 border-brand-black">
                        <tr>
                            <th className="w-12 p-3 border-b text-xs text-center text-brand-grey bg-white">#</th>
                            <th className="p-3 border-b border-r text-[10px] font-bold text-brand-black uppercase tracking-widest bg-gray-50 min-w-[200px]">Categoría</th>
                            <th className="p-3 border-b border-r text-[10px] font-bold text-brand-black uppercase tracking-widest bg-gray-50 w-[300px]">Detalle (Proveedor | Concepto)</th>
                            <th className="p-3 border-b border-r text-[10px] font-bold text-brand-black uppercase tracking-widest bg-gray-50 w-24 text-center">Fecha</th>

                            {/* Client Columns */}
                            {clients.map((c: any) => (
                                <th key={c.id} className="min-w-[100px] p-2 border-b text-center bg-white border-r last:border-0 border-dashed border-gray-200">
                                    <span className="text-sm font-bold text-brand-black block w-full truncate px-4 pb-1 uppercase tracking-tight" title={c.name}>
                                        {c.name}
                                    </span>
                                </th>
                            ))}
                            <th className="w-10 border-b bg-white"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat) => {
                            const catColor = getCategoryColor(cat);
                            const items = groupedExpenses[cat];

                            return (
                                <React.Fragment key={cat}>
                                    {/* Category Header Row */}
                                    <tr className="border-y border-brand-black/20">
                                        <td style={{ backgroundColor: catColor }}></td>
                                        <td style={{ backgroundColor: catColor }} className="p-2 text-xs font-bold uppercase tracking-wider text-black border-r border-black/5" colSpan={3 + clients.length + 1}>
                                            {cat}
                                        </td>
                                    </tr>

                                    {/* Detail Rows */}
                                    {items.map((item, i) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 group">
                                            <td className="text-[10px] text-gray-300 text-center select-none py-1.5 pl-2">{i + 1}</td>

                                            {/* Category (Dimmed, repeated) or Empty */}
                                            <td className="py-0 border-r border-gray-50">
                                                <div className="text-[10px] text-gray-300 uppercase truncate px-2 font-medium tracking-wide opacity-50">{cat}</div>
                                            </td>

                                            {/* Detail: Provider | Concept */}
                                            <td className="py-2 px-2 border-r border-gray-50">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-800">{item.concept}</span>
                                                    {item.provider && <span className="text-[10px] text-gray-400 uppercase tracking-wide">{item.provider}</span>}
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="py-2 px-2 border-r border-gray-50 text-center">
                                                <span className="text-[10px] font-mono text-gray-400">
                                                    {new Date(item.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </td>

                                            {/* Client Values */}
                                            {clients.map((c: any) => {
                                                const val = item.distribution ? item.distribution[c.id] : 0;
                                                // Display Logic:
                                                // Expense: Show as NEGATIVE, RED.
                                                // Income: Show as POSITIVE, BLACK/GREEN.
                                                // Currently 'val' is absolute amount.

                                                let displayVal = 0;
                                                let colorClass = "text-gray-300"; // Zero

                                                if (val && val !== 0) {
                                                    if (item.type === 'INCOME') {
                                                        displayVal = val; // Positive
                                                        colorClass = "text-brand-black font-bold";
                                                    } else {
                                                        displayVal = -val; // Negative
                                                        colorClass = "text-red-500 font-medium";
                                                    }
                                                }

                                                return (
                                                    <td key={c.id} className="py-0 border-r border-gray-50 last:border-0 text-right px-2">
                                                        <span className={`text-sm font-mono ${colorClass}`}>
                                                            {displayVal !== 0 ? displayVal.toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '-'}
                                                        </span>
                                                    </td>
                                                )
                                            })}

                                            {/* Edit Action */}
                                            <td className="text-center">
                                                <button
                                                    onClick={() => { setEditingExpense(item); setModalMode('EDIT'); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-brand-black"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}

                        {/* --- FOOTER SUMMARIES --- */}

                        {/* TOTAL GASTOS */}
                        <tr className="border-t-2 border-brand-black bg-gray-100">
                            <td colSpan={4} className="p-3 text-right font-bold text-brand-black text-xs uppercase tracking-widest border-r border-gray-200">TOTAL GASTOS</td>
                            {clients.map((c: any) => {
                                const val = getClientTotalExpense(c.id);
                                return (
                                    <td key={c.id} className="p-3 text-right font-bold text-red-500 font-mono text-sm border-r border-gray-300 last:border-0 bg-white">
                                        {val.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </td>
                                )
                            })}
                            <td></td>
                        </tr>

                        {/* BENEFICIO */}
                        <tr className="border-t border-brand-black border-b bg-brand-black text-white">
                            <td colSpan={4} className="p-4 text-right font-bold text-white text-sm uppercase tracking-widest">BENEFICIO</td>
                            {clients.map((c: any) => {
                                const inc = getClientTotalIncome(c.id);
                                const exp = getClientTotalExpense(c.id); // negative
                                const total = inc + exp;
                                return (
                                    <td key={c.id} className="p-4 text-right font-black text-white font-mono text-lg border-r border-white/20 last:border-0 text-white">
                                        {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </td>
                                )
                            })}
                            <td></td>
                        </tr>

                        {/* % BENEFICIO */}
                        <tr className="border-b-2 border-brand-black bg-brand-black text-white">
                            <td colSpan={4} className="p-3 text-right font-bold text-brand-grey text-xs uppercase tracking-widest">% BENEFICIO</td>
                            {clients.map((c: any) => {
                                const inc = getClientTotalIncome(c.id);
                                const exp = getClientTotalExpense(c.id);
                                const profit = inc + exp;
                                const margin = inc !== 0 ? (profit / inc) * 100 : 0;

                                let colorClass = "text-brand-grey";
                                if (margin > 20) colorClass = "text-green-400";
                                else if (margin > 0) colorClass = "text-yellow-400";
                                else colorClass = "text-red-400";

                                return (
                                    <td key={c.id} className={`p-3 text-right font-bold font-mono text-sm border-r border-white/20 last:border-0 ${colorClass}`}>
                                        {margin.toFixed(2)}%
                                    </td>
                                )
                            })}
                            <td></td>
                        </tr>

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
