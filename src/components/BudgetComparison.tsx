'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getAllFairsAndClients } from '@/app/actions_data';
import { getFairExpenses } from '@/app/actions_expenses';
import * as XLSX from 'xlsx';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, BarChart3, ArrowDown } from 'lucide-react';
import Link from 'next/link';

const STANDARD_CATEGORIES = [
    'VENTA', 'CARPINTERIA', 'MONTAJE', 'MATERIAL', 'TRANSPORTE',
    'GASTOS VIAJE', 'MOB ALQ', 'ELECTRICIDAD', 'SSFF',
    'MOB COMPRA', 'GRAFICA', 'GASTOS GG', 'OTROS'
];

// Helper to format currency
const formatMoney = (val: number) => {
    return val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
};

export default function BudgetComparison() {
    const [allFairs, setAllFairs] = useState<any[]>([]);
    const [selectedFairId, setSelectedFairId] = useState('');
    const [realExpenses, setRealExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter
    const [selectedClientId, setSelectedClientId] = useState<string>('ALL');

    // Execution State
    const [executionPcts, setExecutionPcts] = useState<{ [category: string]: number }>({});

    // Fetch Initial Data
    useEffect(() => {
        getAllFairsAndClients().then(data => {
            setAllFairs(data);
            if (data.length > 0) setSelectedFairId(data[0].id);
            setLoading(false);
        });
    }, []);

    // Fetch Expenses when fair changes
    useEffect(() => {
        if (selectedFairId) {
            getFairExpenses(selectedFairId).then(setRealExpenses);
            setExecutionPcts({});
        }
    }, [selectedFairId]);

    const currentFair = useMemo(() => allFairs.find(f => f.id === selectedFairId), [allFairs, selectedFairId]);
    const clients = useMemo(() => currentFair?.clients || [], [currentFair]);

    // Calculate Data
    const comparisonData = useMemo(() => {
        if (!currentFair) return { rows: [], totals: { budget: 0, real: 0, earnedValue: 0, margin: 0 } };

        const data: any[] = [];
        const activeClients = selectedClientId === 'ALL'
            ? clients
            : clients.filter((c: any) => c.id === selectedClientId);

        STANDARD_CATEGORIES.forEach(cat => {
            let budgetTotal = 0;
            activeClients.forEach((c: any) => {
                const catBudget = c.budget?.expenses
                    ?.filter((e: any) => e.category === cat)
                    .reduce((sum: number, item: any) => sum + (item.estimated || 0), 0) || 0;
                budgetTotal += catBudget;
            });

            let realTotal = 0;
            const catExpenses = realExpenses.filter((e: any) => e.category === cat);
            catExpenses.forEach((exp: any) => {
                if (exp.distribution) {
                    activeClients.forEach((c: any) => {
                        realTotal += (exp.distribution[c.id] || 0);
                    });
                }
            });

            if (budgetTotal > 0 || realTotal > 0) {
                const pct = executionPcts[cat] !== undefined ? executionPcts[cat] : 100;
                const earnedValue = budgetTotal * (pct / 100);
                const margin = earnedValue - realTotal;

                data.push({
                    category: cat,
                    budget: budgetTotal,
                    real: realTotal,
                    pct,
                    earnedValue,
                    margin
                });
            }
        });

        // Add Totals Row
        const totals = data.reduce((acc, row) => ({
            budget: acc.budget + row.budget,
            real: acc.real + row.real,
            earnedValue: acc.earnedValue + row.earnedValue,
            margin: acc.margin + row.margin
        }), { budget: 0, real: 0, earnedValue: 0, margin: 0 });

        return { rows: data, totals };
    }, [currentFair, selectedClientId, clients, realExpenses, executionPcts]);

    const handlePctChange = (cat: string, val: string) => {
        const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
        setExecutionPcts(prev => ({ ...prev, [cat]: num }));
    };

    // Collapse State
    const [collapsed, setCollapsed] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const getCategoryExpenses = (category: string) => {
        return realExpenses.filter(e => e.category === category);
    };

    const handleExport = () => {
        // ... (existing export logic remains the same, simplified for brevity in this edit plan but implies full replacement if not careful, I will keep function body intact in real apply)
        const wb = XLSX.utils.book_new();
        const exportData: any[] = [];

        // Header
        exportData.push(['Partida', 'Presupuesto Ofertado (Est.)', '% Ejecución', 'Valor Avance', 'Coste Real', 'Obra en Curso (Imputado)', 'Desviación (Margen)']);

        // Rows
        comparisonData.rows.forEach(row => {
            exportData.push([
                row.category,
                row.budget,
                row.pct / 100,
                row.earnedValue,
                row.real,
                row.real,
                row.margin
            ]);
        });

        // Totals
        exportData.push(['TOTALES', comparisonData.totals.budget, '', comparisonData.totals.earnedValue, comparisonData.totals.real, comparisonData.totals.real, comparisonData.totals.margin]);

        const ws = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Comparativo");
        XLSX.writeFile(wb, `Control_Presupuestario_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-brand-light font-sans text-brand-black flex flex-col">
            <div className="bg-white px-8 py-6 border-b border-gray-200 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-brand-grey hover:text-brand-black transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-black tracking-tight text-brand-black uppercase flex items-center gap-3">
                        <span className="p-1 rounded bg-brand-black text-white"><TrendingUp size={20} /></span>
                        Control Presupuestario
                    </h1>
                </div>
                <button onClick={handleExport} className="btn-primary h-10 px-6 text-xs uppercase tracking-widest flex items-center gap-2">
                    <ArrowDown size={14} /> Exportar
                </button>
            </div>

            <div className="flex-grow p-0 lg:p-0 flex flex-col h-full overflow-hidden">
                {/* FILTERS */}
                <div className="bg-white border-b border-gray-200 px-8 py-6 flex flex-col xl:flex-row gap-8 items-start relative z-40">
                    <div className="relative min-w-[300px]">
                        <label className="text-[10px] font-bold text-brand-grey uppercase tracking-widest mb-2 block">Evento / Feria</label>
                        <select
                            value={selectedFairId}
                            onChange={e => setSelectedFairId(e.target.value)}
                            className="w-full text-lg font-bold bg-white border-b-2 border-gray-200 hover:border-brand-black focus:border-brand-black transition-all p-2 outline-none appearance-none rounded-none"
                        >
                            {allFairs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 bottom-3 text-brand-black pointer-events-none" size={16} />
                    </div>

                    <div className="relative min-w-[300px]">
                        <label className="text-[10px] font-bold text-brand-grey uppercase tracking-widest mb-2 block">Filtrar por Cliente</label>
                        <select
                            value={selectedClientId}
                            onChange={e => setSelectedClientId(e.target.value)}
                            className="w-full text-lg font-bold bg-white border-b-2 border-gray-200 hover:border-brand-black focus:border-brand-black transition-all p-2 outline-none appearance-none rounded-none"
                        >
                            <option value="ALL">-- TODOS --</option>
                            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 bottom-3 text-brand-black pointer-events-none" size={16} />
                    </div>

                    <div className="flex items-end h-full pt-6">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="btn-secondary h-10 text-[10px] uppercase tracking-widest flex items-center gap-2 border-dashed border-gray-300 hover:border-brand-black"
                        >
                            {collapsed ? <BarChart3 size={14} /> : <ArrowDown size={14} />}
                            {collapsed ? 'Ver Detalle' : 'Vista Resumen'}
                        </button>
                    </div>
                </div>

                {/* TABLE */}
                <div className="flex-grow overflow-auto bg-white border-t border-gray-100 relative">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-white text-[10px] text-brand-black uppercase font-black tracking-widest sticky top-0 z-30 border-b-2 border-brand-black">
                            <tr>
                                <th className="p-4 w-[250px]">Partida</th>
                                <th className="p-4 text-right w-[120px]">Presupuesto (Est.)</th>
                                <th className="p-4 text-center w-[100px]">% Ejecución</th>
                                <th className="p-4 text-right w-[120px]">Valor Avance</th>
                                <th className="p-4 text-right w-[120px]">Coste Real</th>
                                <th className="p-4 text-right w-[120px]">Desviación</th>
                                <th className="p-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!collapsed && comparisonData.rows.map(row => {
                                const isPositive = row.margin >= 0;
                                const pctOfBudget = row.budget > 0 ? (row.real / row.budget) * 100 : 0;

                                return (
                                    <React.Fragment key={row.category}>
                                        <tr className="group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === row.category ? null : row.category)}>
                                            <td className="p-4 font-bold text-brand-black text-xs uppercase tracking-wide truncate border-r border-gray-50 flex items-center gap-2">
                                                {expandedCategory === row.category ? <ChevronDown size={14} /> : <div className="w-3" />}
                                                {row.category}
                                            </td>
                                            <td className="p-4 text-right font-mono text-sm text-gray-500 border-r border-gray-50">{formatMoney(row.budget)}</td>

                                            <td className="p-4 text-center border-r border-gray-50" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <input
                                                        type="number"
                                                        min="0" max="100"
                                                        value={row.pct}
                                                        onChange={e => handlePctChange(row.category, e.target.value)}
                                                        className="w-12 text-center font-bold font-mono text-brand-black border-b border-gray-300 focus:border-brand-black outline-none bg-transparent"
                                                    />
                                                    <span className="text-[10px] font-bold text-gray-400">%</span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-right font-mono font-bold text-brand-black border-r border-gray-50">{formatMoney(row.earnedValue)}</td>
                                            <td className="p-4 text-right font-mono font-bold text-gray-600 bg-gray-50 border-r border-gray-50">{formatMoney(row.real)}</td>

                                            <td className={`p-4 text-right font-mono font-bold border-r border-gray-50 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                                {isPositive ? '+' : ''}{formatMoney(row.margin)}
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className="w-full bg-gray-100 h-1 mb-2 overflow-hidden">
                                                    <div
                                                        className={`h-full ${pctOfBudget > 100 ? 'bg-red-500' : 'bg-brand-black'}`}
                                                        style={{ width: `${Math.min(pctOfBudget, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex justify-between items-center">
                                                    <span>{pctOfBudget.toFixed(0)}% GASTADO</span>
                                                    {row.margin < 0 && <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={10} /> DESVÍO</span>}
                                                    {row.margin >= 0 && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={10} /> OK</span>}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedCategory === row.category && (
                                            <tr className="bg-gray-50 shadow-inner">
                                                <td colSpan={7} className="p-0">
                                                    <div className="p-6 bg-gray-50 border-y border-gray-200">
                                                        <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-3 ml-2">Detalle de Imputaciones: {row.category}</h4>
                                                        <table className="w-full text-xs text-left bg-white border border-gray-200">
                                                            <thead className="bg-gray-100 text-[9px] uppercase font-bold text-gray-500">
                                                                <tr>
                                                                    <th className="p-3">Fecha</th>
                                                                    <th className="p-3">Proveedor</th>
                                                                    <th className="p-3">Concepto</th>
                                                                    <th className="p-3 text-right">Importe Asignado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {getCategoryExpenses(row.category).map((exp: any, idx: number) => {
                                                                    // Calculate portion for this client selection logic if needed, but for now show raw expense or distributed portion
                                                                    // const amount = exp.totalAmount; // This is total for the expense.
                                                                    // We need the distributed amount for the selected client context.
                                                                    let amount = 0;
                                                                    if (selectedClientId === 'ALL') {
                                                                        amount = exp.totalAmount; // Simplification: if ALL, we show total. But wait, comparison data sums distributed parts.
                                                                        // Actually, earlier we summed distributed parts. Let's do that.
                                                                        if (exp.distribution) {
                                                                            Object.values(exp.distribution).forEach((v: any) => amount += (typeof v === 'number' ? v : 0));
                                                                        } else {
                                                                            amount = exp.totalAmount;
                                                                        }
                                                                    } else {
                                                                        amount = exp.distribution?.[selectedClientId] || 0;
                                                                    }

                                                                    if (amount === 0) return null;

                                                                    return (
                                                                        <tr key={idx} className="hover:bg-gray-50">
                                                                            <td className="p-3 font-mono text-gray-500">{exp.date}</td>
                                                                            <td className="p-3 font-bold">{exp.provider || '-'}</td>
                                                                            <td className="p-3 text-gray-600">{exp.concept}</td>
                                                                            <td className="p-3 text-right font-mono font-bold text-brand-black">{amount.toFixed(2)}€</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                {getCategoryExpenses(row.category).length === 0 && <tr><td colSpan={4} className="p-4 text-center italic text-gray-400">No hay imputaciones registradas.</td></tr>}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}

                            {!collapsed && comparisonData.rows.length === 0 && (
                                <tr><td colSpan={7} className="p-10 text-center text-gray-400 italic font-light">No hay datos de presupuesto o gastos para esta selección.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="bg-brand-black text-white text-sm font-bold border-t-4 border-double border-white sticky bottom-0 z-20 shadow-2xl">
                            <tr>
                                <td className="p-4 uppercase tracking-widest w-[250px] border-r border-white/20">Total General</td>
                                <td className="p-4 text-right font-mono opacity-80 w-[120px] border-r border-white/20">{formatMoney(comparisonData.totals.budget)}</td>
                                <td className="p-4 text-center text-gray-500 w-[100px] border-r border-white/20">—</td>
                                <td className="p-4 text-right font-mono w-[120px] border-r border-white/20">{formatMoney(comparisonData.totals.earnedValue)}</td>
                                <td className="p-4 text-right font-mono text-gray-300 w-[120px] border-r border-white/20">{formatMoney(comparisonData.totals.real)}</td>
                                <td className={`p-4 text-right font-mono text-lg w-[120px] border-r border-white/20 ${comparisonData.totals.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {comparisonData.totals.margin >= 0 ? '+' : ''}{formatMoney(comparisonData.totals.margin)}
                                </td>
                                <td className="p-4"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
