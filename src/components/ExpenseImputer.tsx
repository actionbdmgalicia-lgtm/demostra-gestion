'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getAllFairsAndClients } from '@/app/actions_data';
import { saveExpenseImputation } from '@/app/actions_expenses';
import { ArrowLeft, Wallet, Save, Calculator, Check, AlertCircle, Plus, X } from 'lucide-react';
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

    // Transaction Type
    const [transactionType, setTransactionType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

    // Form State
    const [category, setCategory] = useState(STANDARD_CATEGORIES[0]);
    const [provider, setProvider] = useState(''); // For Expense: Provider. For Income: maybe not used or "Client"?
    // User request: "Ventas son por cliente". We usually invoice a client.
    // Let's keep Provider for Expenses. For Income, we might hide it.

    const [concept, setConcept] = useState('');
    const [totalAmount, setTotalAmount] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Distribution State (For Income, it forces single selection)
    const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
    const [distributionMode, setDistributionMode] = useState<'PROPORTIONAL' | 'MANUAL'>('PROPORTIONAL');
    const [manualValues, setManualValues] = useState<{ [clientId: string]: string }>({});

    // Feedback
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // History State
    const [imputationHistory, setImputationHistory] = useState<any[]>([]);

    useEffect(() => {
        getAllFairsAndClients().then(data => {
            setAllFairs(data);
            if (data.length > 0) setSelectedFairId(data[0].id);
            setLoading(false);
        });
    }, []);

    const currentFair = useMemo(() => allFairs.find(f => f.id === selectedFairId), [allFairs, selectedFairId]);
    const clients = useMemo(() => currentFair?.clients || [], [currentFair]);

    // Reset standard category when switching types?
    useEffect(() => {
        if (transactionType === 'INCOME') {
            setCategory('VENTA');
        } else {
            if (category === 'VENTA') setCategory(STANDARD_CATEGORIES[0]);
        }
    }, [transactionType]);

    // --- CALCULATIONS ---

    // Calculate budget weights for the selected category
    const clientWeights = useMemo(() => {
        if (transactionType === 'INCOME') return {}; // No weights for income
        if (!category || clients.length === 0) return {};

        const weights: { [id: string]: number } = {};
        let totalBudget = 0;

        clients.forEach((c: any) => {
            const catBudget = c.budget?.expenses
                ?.filter((e: any) => e.category === category)
                .reduce((sum: number, e: any) => sum + (e.estimated || 0), 0) || 0;
            weights[c.id] = catBudget;
            totalBudget += catBudget;
        });

        // Normalize
        if (totalBudget === 0) {
            // Equal weight if no budget
            clients.forEach((c: any) => weights[c.id] = 1);
        }

        return { weights, totalBudget };
    }, [clients, category, transactionType]);

    // Calculate Distributed Values
    const distributedValues = useMemo(() => {
        const total = parseFloat(totalAmount) || 0;
        const result: { [id: string]: number } = {};

        // For INCOME, user selects ONE client, and total goes there.
        if (transactionType === 'INCOME') {
            if (selectedClientIds.size > 0) {
                const id = Array.from(selectedClientIds)[0];
                result[id] = total;
            }
            return result;
        }

        if (distributionMode === 'MANUAL') {
            selectedClientIds.forEach(id => {
                result[id] = parseFloat(manualValues[id]) || 0;
            });
            return result;
        }

        // PROPORTIONAL MODE (Expense)
        const activeClients = clients.filter((c: any) => selectedClientIds.has(c.id));
        if (activeClients.length === 0) return {};

        const totalBudget = clientWeights?.totalBudget || 0;
        const weights = clientWeights?.weights || {};

        if (totalBudget > 0) {
            let activeBudgetSum = 0;
            activeClients.forEach((c: any) => activeBudgetSum += (weights[c.id] || 0));

            if (activeBudgetSum === 0) {
                const split = total / activeClients.length;
                activeClients.forEach((c: any) => result[c.id] = split);
            } else {
                activeClients.forEach((c: any) => {
                    const ratio = (weights[c.id] || 0) / activeBudgetSum;
                    result[c.id] = total * ratio;
                });
            }
        } else {
            const split = total / activeClients.length;
            activeClients.forEach((c: any) => result[c.id] = split);
        }

        return result;
    }, [totalAmount, selectedClientIds, distributionMode, manualValues, clientWeights, clients, transactionType]);

    const currentDistributionTotal = Object.values(distributedValues).reduce((a, b) => a + b, 0);
    const amountDiff = (parseFloat(totalAmount) || 0) - currentDistributionTotal;
    const isBalanced = Math.abs(amountDiff) < 0.02;

    // --- HANDLERS ---

    const handleToggleClient = (id: string) => {
        if (transactionType === 'INCOME') {
            // Only allow one
            const next = new Set<string>();
            if (selectedClientIds.has(id)) {
                // Deselecting the only one
                setSelectedClientIds(next);
            } else {
                next.add(id);
                setSelectedClientIds(next);
            }
            return;
        }

        // Expense Multi-select
        const next = new Set(selectedClientIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedClientIds(next);
    };

    const handleManualChange = (id: string, val: string) => {
        setManualValues(prev => ({ ...prev, [id]: val }));
    };

    const handleSave = async () => {
        if (!isBalanced && distributionMode === 'MANUAL') {
            if (!confirm(`El total distribuido no coincide con el importe (${amountDiff.toFixed(2)} diferencia). ¿Guardar de todas formas?`)) return;
        }

        setSaving(true);
        const data = {
            type: transactionType,
            category,
            provider: transactionType === 'INCOME' ? '' : provider, // Provider empty for Income
            concept,
            totalAmount: parseFloat(totalAmount),
            date,
            distribution: distributedValues,
            distributionMode
        };

        await saveExpenseImputation(selectedFairId, data);
        setImputationHistory(prev => [{ ...data, id: Date.now().toString() }, ...prev]);

        setSaving(false);
        setSuccessMsg(`${transactionType === 'INCOME' ? 'Venta' : 'Gasto'} guardado correctamente.`);

        // Reset form partials
        setTotalAmount('');
        setConcept('');
        setManualValues({});
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleDeleteFromHistory = (index: number) => {
        setImputationHistory(prev => prev.filter((_, i) => i !== index));
    };

    if (loading) return null;

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

            <div className="grid lg:grid-cols-3 gap-0 max-w-[1600px] mx-auto border-x border-gray-200 bg-white min-h-[calc(100vh-80px)]">

                {/* LEFT: INPUT FORM */}
                <div className="lg:col-span-1 p-8 border-b lg:border-b-0 lg:border-r border-gray-200 space-y-8">

                    {/* TYPE SELECTOR */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setTransactionType('EXPENSE')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-md transition-all ${transactionType === 'EXPENSE' ? 'bg-white shadow text-brand-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Gasto
                        </button>
                        <button
                            onClick={() => setTransactionType('INCOME')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-md transition-all ${transactionType === 'INCOME' ? 'bg-brand-accent text-white shadow' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Venta
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-brand-grey uppercase tracking-widest mb-2 block">Evento / Feria</label>
                            <select
                                value={selectedFairId}
                                onChange={e => setSelectedFairId(e.target.value)}
                                className="w-full text-lg font-bold bg-gray-50 border-b-2 border-transparent hover:border-brand-black focus:border-brand-black transition-all p-3 outline-none"
                            >
                                {allFairs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Fecha</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
                        </div>

                        {transactionType === 'EXPENSE' && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-3">Partida</label>
                                <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                                    {STANDARD_CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={`text-[10px] font-bold py-3 px-2 uppercase tracking-wider transition-all ${category === cat ? 'text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                            style={category === cat ? { backgroundColor: CATEGORY_COLORS[cat] || '#000' } : {}}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {transactionType === 'INCOME' && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Partida</label>
                                <div className="p-3 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-bold text-sm uppercase">
                                    VENTA (Ingreso)
                                </div>
                            </div>
                        )}

                        {transactionType === 'EXPENSE' && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Proveedor</label>
                                <input placeholder="Ej. Amazon..." value={provider} onChange={e => setProvider(e.target.value)} className="input-field" />
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Concepto / Detalle</label>
                            <input placeholder={transactionType === 'INCOME' ? "Descripción de la venta..." : "Ej. Material vario..."} value={concept} onChange={e => setConcept(e.target.value)} className="input-field" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-black mb-2">Importe Total (€)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={totalAmount}
                                onChange={e => setTotalAmount(e.target.value)}
                                className={`w-full text-4xl font-mono font-black text-right border-b-2 outline-none py-2 placeholder:text-gray-200 ${transactionType === 'INCOME' ? 'text-brand-accent border-brand-accent' : 'text-brand-black border-gray-200 focus:border-brand-black'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: DISTRIBUTION */}
                <div className="lg:col-span-2 bg-gray-50/30 flex flex-col">
                    <div className="p-8 border-b border-gray-200 flex justify-between items-center bg-white">
                        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calculator size={16} /> {transactionType === 'INCOME' ? 'Asignación a Cliente' : 'Distribución del Gasto'}
                        </h3>
                        {transactionType === 'EXPENSE' && (
                            <div className="flex border border-gray-300">
                                <button
                                    onClick={() => setDistributionMode('PROPORTIONAL')}
                                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${distributionMode === 'PROPORTIONAL' ? 'bg-brand-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Automática
                                </button>
                                <button
                                    onClick={() => setDistributionMode('MANUAL')}
                                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${distributionMode === 'MANUAL' ? 'bg-brand-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    Manual
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Client Selection */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between mb-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {transactionType === 'INCOME' ? 'Selecciona Cliente (Solo Uno):' : 'Imputar a:'}
                            </span>
                            {transactionType === 'EXPENSE' && (
                                <button onClick={() => setSelectedClientIds(new Set(clients.map((c: any) => c.id)))} className="text-[10px] font-bold text-brand-black underline uppercase tracking-widest">Seleccionar Todos</button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {clients.map((c: any) => (
                                <button
                                    key={c.id}
                                    onClick={() => handleToggleClient(c.id)}
                                    className={`px-4 py-2 text-xs font-bold border uppercase tracking-widest transition-all ${selectedClientIds.has(c.id)
                                            ? (transactionType === 'INCOME' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-black text-white border-brand-black')
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-grow overflow-auto p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest sticky top-0 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-left">Cliente</th>
                                    {transactionType === 'EXPENSE' && <th className="p-4 text-right">Peso Presup.</th>}
                                    <th className="p-4 text-right">Asignación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {Array.from(selectedClientIds).map(id => {
                                    const client = clients.find((c: any) => c.id === id);
                                    if (!client) return null;

                                    const val = distributedValues[id] || 0;
                                    const weight = clientWeights?.weights?.[id] || 0;

                                    return (
                                        <tr key={id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-bold text-brand-black uppercase text-xs tracking-wide">{client.name}</td>
                                            {transactionType === 'EXPENSE' && (
                                                <td className="p-4 text-right text-gray-400 font-mono text-xs">
                                                    {weight > 0 ? `${weight.toLocaleString('es-ES')}€` : '-'}
                                                </td>
                                            )}
                                            <td className="p-4 text-right">
                                                {transactionType === 'INCOME' ? (
                                                    <span className="font-mono font-bold text-base text-brand-accent">{val.toFixed(2)}€</span>
                                                ) : (
                                                    distributionMode === 'PROPORTIONAL' ? (
                                                        <span className="font-mono font-bold text-base text-brand-black">{val.toFixed(2)}€</span>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            value={manualValues[id] || (val ? val.toFixed(2) : '')}
                                                            onChange={e => handleManualChange(id, e.target.value)}
                                                            className="bg-gray-100 p-2 text-right font-mono font-bold outline-none focus:bg-white focus:ring-1 ring-brand-black w-32 border-b border-transparent focus:border-brand-black transition-all"
                                                        />
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {selectedClientIds.size === 0 && (
                                    <tr><td colSpan={3} className="p-10 text-center text-gray-300 italic">
                                        {transactionType === 'INCOME' ? 'Selecciona un cliente para asignar la venta' : 'Selecciona clientes para distribuir el gasto'}
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Total */}
                    <div className="p-8 border-t border-gray-200 bg-white">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-xs font-bold text-brand-grey uppercase tracking-widest">Total Asignado</span>
                            <div className="text-right">
                                <div className={`text-4xl font-black font-mono ${(!isBalanced && transactionType === 'EXPENSE') ? 'text-red-500' : 'text-brand-black'}`}>
                                    {currentDistributionTotal.toFixed(2)}€
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                            <div className="text-sm text-green-600 font-bold">{successMsg}</div>
                            <button
                                onClick={handleSave}
                                disabled={!totalAmount || selectedClientIds.size === 0 || saving}
                                className={`btn-primary flex items-center gap-3 disabled:opacity-50 h-[50px] px-8 text-sm uppercase tracking-widest ${transactionType === 'INCOME' ? 'bg-brand-accent hover:bg-brand-accent/90' : ''}`}
                            >
                                {saving ? 'Guardando...' : <><Check size={18} /> Confirmar {transactionType === 'INCOME' ? 'Venta' : 'Gasto'}</>}
                            </button>
                        </div>
                    </div>

                    {/* History Section */}
                    {/* ... (Existing History UI, slightly adapted) ... */}
                    <div className="mt-8 border-t border-gray-200">
                        <div className="p-8 pb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-black flex items-center gap-2">
                                <span className="w-2 h-2 bg-brand-accent rounded-full"></span>
                                Historial de Sesión
                            </h3>
                        </div>
                        <div className="overflow-x-auto max-h-[300px]">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 border-y border-gray-200 text-brand-grey uppercase tracking-wider font-bold">
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
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
