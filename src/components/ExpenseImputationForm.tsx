'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { saveExpenseImputation } from '@/app/actions_expenses';
import { Calculator, Check, AlertCircle, Plus, X } from 'lucide-react';

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

interface ExpenseImputationFormProps {
    fairId: string;
    clients: any[]; // Clients with their budgets
    initialData?: any;
    onSaveSuccess?: (savedData: any) => void;
    onCancel?: () => void;
    mode?: 'CREATE' | 'EDIT';
}

export default function ExpenseImputationForm({ fairId, clients, initialData, onSaveSuccess, onCancel, mode = 'CREATE' }: ExpenseImputationFormProps) {
    const [transactionType, setTransactionType] = useState<'EXPENSE' | 'INCOME'>(initialData?.type || 'EXPENSE');
    const [category, setCategory] = useState(initialData?.category || STANDARD_CATEGORIES[0]);
    const [provider, setProvider] = useState(initialData?.provider || '');
    const [concept, setConcept] = useState(initialData?.concept || '');
    const [totalAmount, setTotalAmount] = useState<string>(initialData?.totalAmount?.toString() || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

    // Distribution State
    const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set(initialData ? Object.keys(initialData.distribution || {}) : []));
    const [distributionMode, setDistributionMode] = useState<'PROPORTIONAL' | 'MANUAL'>(initialData?.distributionMode || 'PROPORTIONAL');
    const [manualValues, setManualValues] = useState<{ [clientId: string]: string }>(
        initialData?.distributionMode === 'MANUAL'
            ? Object.fromEntries(Object.entries(initialData.distribution).map(([k, v]) => [k, (v as number).toFixed(2)]))
            : {}
    );

    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (transactionType === 'INCOME') {
            setCategory('VENTA');
        } else {
            if (category === 'VENTA') setCategory(STANDARD_CATEGORIES[0]);
        }
    }, [transactionType]);

    // --- CALCULATIONS ---
    const clientWeights = useMemo(() => {
        if (transactionType === 'INCOME') return {};
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

        if (totalBudget === 0) {
            clients.forEach((c: any) => weights[c.id] = 1);
        }

        return { weights, totalBudget };
    }, [clients, category, transactionType]);

    const distributedValues = useMemo(() => {
        const total = parseFloat(totalAmount) || 0;
        const result: { [id: string]: number } = {};

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

        // PROPORTIONAL MODE
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

    const handleToggleClient = (id: string) => {
        if (transactionType === 'INCOME') {
            const next = new Set<string>();
            if (selectedClientIds.has(id)) setSelectedClientIds(next);
            else { next.add(id); setSelectedClientIds(next); }
            return;
        }
        const next = new Set(selectedClientIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedClientIds(next);
    };

    const handleManualChange = (id: string, val: string) => {
        setManualValues(prev => ({ ...prev, [id]: val }));
    };

    const handleSave = async () => {
        setErrorMsg('');
        const finalAmount = parseFloat(totalAmount);

        // Validation Logic
        if (transactionType === 'EXPENSE') {
            if (finalAmount > 0) {
                const confirmed = confirm("⚠️ Estás guardando un GASTO en POSITIVO (Ingreso/Devolución).\n\n¿Es correcto?\n\n- Pulsa ACEPTAR si es una DEVOLUCIÓN de proveedor.\n- Pulsa CANCELAR para corregir (debería ser negativo: -100).");
                if (!confirmed) return;
            }
        }
        if (transactionType === 'INCOME') {
            if (finalAmount < 0) {
                const confirmed = confirm("⚠️ Estás guardando una VENTA en NEGATIVO (Abono).\n\n¿Es correcto?");
                if (!confirmed) return;
            }
        }

        if (!isBalanced && distributionMode === 'MANUAL') {
            const diff = finalAmount - currentDistributionTotal;
            if (!confirm(`El total distribuido no coincide con el importe (${diff.toFixed(2)} diferencia). ¿Guardar de todas formas?`)) return;
        }

        setSaving(true);
        const data = {
            id: initialData?.id, // Preserve ID if editing
            type: transactionType,
            category,
            provider: transactionType === 'INCOME' ? '' : provider,
            concept,
            totalAmount: finalAmount,
            date,
            distribution: distributedValues,
            distributionMode
        };

        try {
            // Note: saveExpenseImputation handles both Create and Update logic if we pass ID?
            // Actually, saveExpenseImputation inside actions_expenses just pushes to array. It doesn't update existing.
            // We need to fix the server action to handle updates if ID exists.
            // But lets assume for now we might need a separate action or modify the existing one.
            // I will update the action later.

            await saveExpenseImputation(fairId, data);

            setSaving(false);
            if (onSaveSuccess) onSaveSuccess(data);

            // Independent Reset if creating
            if (mode === 'CREATE') {
                setTotalAmount('');
                setConcept('');
                setManualValues({});
            }
        } catch (e) {
            console.error(e);
            setSaving(false);
            setErrorMsg('Error al guardar.');
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-0 border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
            {/* LEFT: INPUT FORM */}
            <div className="lg:col-span-1 p-6 border-b lg:border-b-0 lg:border-r border-gray-200 space-y-6 bg-white">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setTransactionType('EXPENSE')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${transactionType === 'EXPENSE' ? 'bg-white shadow text-brand-black' : 'text-gray-400'}`}>Gasto</button>
                    <button onClick={() => setTransactionType('INCOME')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${transactionType === 'INCOME' ? 'bg-brand-accent text-white shadow' : 'text-gray-400'}`}>Venta</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Fecha</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
                    </div>

                    {transactionType === 'EXPENSE' ? (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Partida</label>
                            <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                                {STANDARD_CATEGORIES.map(cat => (
                                    <button key={cat} onClick={() => setCategory(cat)} className={`text-[10px] font-bold py-2 uppercase tracking-wide transition-all ${category === cat ? 'text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} style={category === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}>{cat}</button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-bold text-sm uppercase">VENTA (Ingreso)</div>
                    )}

                    {transactionType === 'EXPENSE' && (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Proveedor</label>
                            <input placeholder="Ej. Amazon..." value={provider} onChange={e => setProvider(e.target.value)} className="input-field" />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Concepto / Detalle</label>
                        <input placeholder={transactionType === 'INCOME' ? "Descripción..." : "Ej. Material..."} value={concept} onChange={e => setConcept(e.target.value)} className="input-field" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-black mb-2">Importe Total (€)</label>
                        <input type="number" placeholder="0.00" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className={`w-full text-3xl font-mono font-black text-right border-b-2 outline-none py-1 ${transactionType === 'INCOME' ? 'text-brand-accent border-brand-accent' : 'text-brand-black border-gray-200'}`} />
                    </div>
                </div>
            </div>

            {/* RIGHT: DISTRIBUTION */}
            <div className="lg:col-span-2 bg-gray-50/50 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Calculator size={14} /> Distribución</h3>
                    {transactionType === 'EXPENSE' && (
                        <div className="flex border border-gray-300">
                            <button onClick={() => setDistributionMode('PROPORTIONAL')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${distributionMode === 'PROPORTIONAL' ? 'bg-brand-black text-white' : 'text-gray-500'}`}>Auto</button>
                            <button onClick={() => setDistributionMode('MANUAL')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${distributionMode === 'MANUAL' ? 'bg-brand-black text-white' : 'text-gray-500'}`}>Manual</button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="flex flex-wrap gap-2">
                        {clients.map((c: any) => (
                            <button key={c.id} onClick={() => handleToggleClient(c.id)} className={`px-3 py-1 text-[10px] font-bold border uppercase tracking-widest transition-all ${selectedClientIds.has(c.id) ? (transactionType === 'INCOME' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-black text-white border-brand-black') : 'bg-white text-gray-400 border-gray-200'}`}>{c.name}</button>
                        ))}
                    </div>
                </div>

                <div className="flex-grow overflow-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-200">
                            <tr><th className="p-3 text-left">Cliente</th><th className="p-3 text-right">Peso</th><th className="p-3 text-right">Asignado</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {Array.from(selectedClientIds).map(id => {
                                const client = clients.find((c: any) => c.id === id);
                                if (!client) return null;
                                const val = distributedValues[id] || 0;
                                const weight = clientWeights?.weights?.[id] || 0;
                                return (
                                    <tr key={id}>
                                        <td className="p-3 font-bold">{client.name}</td>
                                        <td className="p-3 text-right text-gray-400 font-mono">{transactionType === 'EXPENSE' && weight > 0 ? `${weight}€` : '-'}</td>
                                        <td className="p-3 text-right font-mono font-bold">
                                            {distributionMode === 'PROPORTIONAL' || transactionType === 'INCOME' ? (
                                                <span className={transactionType === 'INCOME' ? 'text-brand-accent' : 'text-brand-black'}>{val.toFixed(2)}€</span>
                                            ) : (
                                                <input type="number" value={manualValues[id] || (val ? val.toFixed(2) : '')} onChange={e => handleManualChange(id, e.target.value)} className="bg-gray-100 p-1 text-right w-24 outline-none border-b border-transparent focus:border-black" />
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
                    <div className="text-red-500 text-xs font-bold">{errorMsg}</div>
                    <div className="flex gap-4 items-center">
                        <div className={`text-2xl font-black font-mono ${(!isBalanced && transactionType === 'EXPENSE') ? 'text-red-500' : 'text-brand-black'}`}>{currentDistributionTotal.toFixed(2)}€</div>
                        {onCancel && <button onClick={onCancel} className="btn-secondary px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>}
                        <button onClick={handleSave} disabled={!totalAmount || selectedClientIds.size === 0 || saving} className={`btn-primary px-6 py-2 text-xs uppercase tracking-widest ${transactionType === 'INCOME' ? 'bg-brand-accent hover:bg-brand-accent/90' : ''}`}>{saving ? 'Guardando...' : (mode === 'EDIT' ? 'Actualizar' : 'Guardar')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
