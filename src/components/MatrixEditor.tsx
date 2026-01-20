'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { saveFairData } from '@/app/actions_matrix';
import { deleteClient } from '@/app/actions_delete';
import { getAllFairsAndClients } from '@/app/actions_data';
import { ArrowLeft, Plus, Save, Loader2, Trash2, Copy, X } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';

interface Client {
    id: string;
    name: string;
    status?: string;
    budget: {
        income: any[];
        expenses: any[];
    };
}

interface Row {
    id: string;
    type: 'INGRESO' | 'GASTO';
    category: string;
    description: string;
    [clientId: string]: any;
}

// DEFINICION DE COLORES EXACTOS (Inline Styles para asegurar compatibilidad)
// Usamos Hex codes directos para evitar problemas con Tailwind
const CATEGORY_COLORS: { [key: string]: string } = {
    'VENTA': '#00FFFF', // Cyan puro
    'CARPINTERIA': '#92D050', // Verde Lima
    'MONTAJE': '#92D050', // Verde Lima (mismo que carpinteria en imagen)
    'MATERIAL': '#9BC2E6', // Azul claro
    'TRANSPORTE': '#FFC000', // Naranja/Amarillo fuerte
    'GASTOS VIAJE': '#C6E0B4', // Verde suave
    'MOB ALQ': '#FF99FF', // Rosa
    'ELECTRICIDAD': '#00B0F0', // Azul eléctrico
    'SSFF': '#FFFF00', // Amarillo
    'MOB COMPRA': '#FF66FF', // Fucsia
    'GRAFICIA': '#FFC000',
    'GRAFICA': '#FFC000', // Naranja/Amarillo fuerte
    'GASTOS GG': '#DDEBF7', // Azul muy pálido
    'DEFAULT': '#F3F4F6' // Gris suave por defecto
};

export default function MatrixEditor({ initialFair }: { initialFair: any }) {
    const [clients, setClients] = useState<Client[]>(initialFair.clients || []);
    const [rows, setRows] = useState<Row[]>([]);
    const [saving, setSaving] = useState(false);
    const [allFairs, setAllFairs] = useState<any[]>([]);
    const [modalMode, setModalMode] = useState<'NONE' | 'ADD_ROW' | 'ADD_CLIENT'>('NONE');

    // Inputs
    const [newClientName, setNewClientName] = useState('');
    const [selectedFairId, setSelectedFairId] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [newRowData, setNewRowData] = useState({ type: 'GASTO', category: '', description: '' });

    useEffect(() => {
        if (modalMode === 'ADD_CLIENT' && allFairs.length === 0) {
            getAllFairsAndClients().then(setAllFairs);
        }
    }, [modalMode]);

    useEffect(() => {
        const rowMap = new Map<string, Row>();

        clients.forEach((client: Client) => {
            client.budget.income.forEach(item => {
                const key = `INGRESO|${item.category}|${item.description}`;
                if (!rowMap.has(key)) rowMap.set(key, { id: key, type: 'INGRESO', category: item.category, description: item.description });
                rowMap.get(key)![client.id] = item.amount;
            });
            client.budget.expenses.forEach(item => {
                const key = `GASTO|${item.category}|${item.description}`;
                if (!rowMap.has(key)) rowMap.set(key, { id: key, type: 'GASTO', category: item.category, description: item.description });
                rowMap.get(key)![client.id] = -item.estimated;
            });
        });

        rows.forEach(r => {
            if (!rowMap.has(r.id)) rowMap.set(r.id, r);
        });

        const sortedRows = Array.from(rowMap.values()).sort((a, b) => {
            if (a.type !== b.type) return a.type === 'INGRESO' ? -1 : 1;
            if (a.category !== b.category) return a.category.localeCompare(b.category);
            return a.description.localeCompare(b.description);
        });

        setRows(sortedRows);
    }, [clients.length]);

    // --- Calculations ---
    const groupedRows = useMemo(() => {
        const groups: { [key: string]: Row[] } = {};
        rows.forEach(r => {
            const key = r.category;
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });
        return groups;
    }, [rows]);

    const categories = Object.keys(groupedRows).sort((a, b) => {
        const typeA = groupedRows[a][0].type;
        const typeB = groupedRows[b][0].type;
        if (typeA !== typeB) return typeA === 'INGRESO' ? -1 : 1;
        return 0;
    });

    const getCategoryTotal = (cat: string, clientId: string) => {
        return groupedRows[cat].reduce((sum, r) => {
            const val = parseFloat(r[clientId]) || 0;
            return sum + val;
        }, 0);
    };

    const getCategoryColor = (cat: string) => {
        return CATEGORY_COLORS[cat.toUpperCase()] || CATEGORY_COLORS['DEFAULT'];
    };

    const getTotalExpenses = (clientId: string) => {
        return rows.filter(r => r.type === 'GASTO').reduce((sum, r) => {
            const val = parseFloat(r[clientId]) || 0;
            return sum + val;
        }, 0);
    };

    const getTotalIncome = (clientId: string) => {
        return rows.filter(r => r.type === 'INGRESO').reduce((sum, r) => {
            const val = parseFloat(r[clientId]) || 0;
            return sum + val;
        }, 0);
    };

    // --- Handlers ---
    const handleCellChange = (rowId: string, clientId: string, value: string) => {
        setRows(prev => prev.map(r => r.id === rowId ? { ...r, [clientId]: value } : r));
    };

    const executeAddRow = () => {
        if (!newRowData.category || !newRowData.description) return;
        const key = `${newRowData.type}|${newRowData.category}|${newRowData.description}`;
        setRows(prev => {
            if (prev.find(r => r.id === key)) return prev;
            return [...prev, { id: key, type: newRowData.type as any, category: newRowData.category, description: newRowData.description }];
        });
        setModalMode('NONE');
        setNewRowData({ type: 'GASTO', category: '', description: '' });
    };

    const executeAddClient = () => {
        if (!newClientName) return;
        const newId = newClientName.replace(/\s+/g, '-').toUpperCase() + '-' + Date.now();
        let newBudget = { income: [], expenses: [] };
        if (selectedFairId && selectedClientId) {
            const fair = allFairs.find(f => f.id === selectedFairId);
            const sourceClient = fair?.clients.find((c: any) => c.id === selectedClientId);
            if (sourceClient) newBudget = JSON.parse(JSON.stringify(sourceClient.budget));
        }
        setClients(prev => [...prev, { id: newId, name: newClientName, status: 'Active', budget: newBudget }]);
        setModalMode('NONE');
        setNewClientName('');
        setSelectedFairId('');
        setSelectedClientId('');
    };

    const handleDeleteClient = async (cId: string) => {
        if (!confirm('¿ELIMINAR DEFINITIVAMENTE este cliente?')) return;
        setClients(prev => prev.filter(c => c.id !== cId));
        await deleteClient(initialFair.id, cId);
    };

    const handleSave = async () => {
        setSaving(true);
        const activeClientsMap = new Map();
        clients.forEach(c => {
            c.budget = { income: [], expenses: [] };
            activeClientsMap.set(c.id, c);
        });

        rows.forEach(row => {
            activeClientsMap.forEach((client) => {
                const val = row[client.id];
                if (val !== undefined && val !== '' && val !== null) {
                    const numVal = parseFloat(val);
                    if (!isNaN(numVal)) {
                        if (row.type === 'INGRESO') {
                            client.budget.income.push({ category: row.category, description: row.description, amount: Math.abs(numVal) });
                        } else {
                            client.budget.expenses.push({ category: row.category, description: row.description, estimated: Math.abs(numVal) });
                        }
                    }
                }
            });
        });

        const finalClients = Array.from(activeClientsMap.values());
        await saveFairData(initialFair.id, finalClients);
        setSaving(false);
    };

    const selectedFairClients = allFairs.find(f => f.id === selectedFairId)?.clients || [];

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* HEADER */}
            <div className="flex-none px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-50">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-brand-grey hover:text-brand-black transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight text-brand-black">{initialFair.name}</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="btn-secondary text-xs h-10 uppercase tracking-widest flex items-center gap-2" onClick={() => setModalMode('ADD_ROW')}>
                        <Plus size={14} /> Concepto
                    </button>
                    <button className="btn-primary h-10 text-xs uppercase tracking-widest flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* MATRIX TABLE */}
            <div className="flex-grow overflow-auto bg-white relative pb-32">
                <table className="w-full border-collapse text-left">
                    <thead className="bg-white sticky top-0 z-40 shadow-sm border-b-2 border-brand-black">
                        <tr>
                            <th className="w-12 p-3 border-b text-xs text-center text-brand-grey bg-white">#</th>
                            <th className="p-3 border-b border-r w-[200px] text-[10px] font-bold text-brand-black uppercase tracking-widest bg-gray-50">Categoría</th>
                            <th className="p-3 border-b border-r w-[300px] text-[10px] font-bold text-brand-black uppercase tracking-widest bg-gray-50">Detalle</th>
                            {clients.map(c => (
                                <th key={c.id} className="min-w-[100px] p-2 border-b text-center relative group bg-white border-r last:border-0 border-dashed border-gray-200">
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-sm font-bold text-brand-black block w-full truncate px-4 pb-1 uppercase tracking-tight" title={c.name}>{c.name}</span>
                                        <button
                                            onClick={() => handleDeleteClient(c.id)}
                                            className="absolute right-1 top-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                            title="Eliminar Cliente"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat) => {
                            const rowsInCat = groupedRows[cat];
                            const catColor = getCategoryColor(cat);

                            return (
                                <React.Fragment key={cat}>
                                    {/* Category Header / Total Row */}
                                    <tr className="border-y border-brand-black/20">
                                        <td style={{ backgroundColor: catColor }}></td>
                                        <td style={{ backgroundColor: catColor }} className="p-2 text-xs font-bold uppercase tracking-wider text-black border-r border-black/5" colSpan={2}>{cat}</td>
                                        {clients.map(c => {
                                            const val = getCategoryTotal(cat, c.id);
                                            return (
                                                <td key={c.id} style={{ backgroundColor: catColor, position: 'relative', zIndex: 1 }} className="p-1.5 text-right text-sm font-bold border-r border-black/10 last:border-0 text-black font-mono">
                                                    {val !== 0 ? val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                                                </td>
                                            )
                                        })}
                                    </tr>

                                    {/* Detail Rows */}
                                    {rowsInCat.map((row, i) => (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50">
                                            <td className="text-[10px] text-gray-300 text-center select-none py-1.5 pl-2">{i + 1}</td>
                                            <td className="py-0 border-r border-gray-50">
                                                <div className="text-[10px] text-gray-400 uppercase truncate px-2 font-medium tracking-wide">{row.category}</div>
                                            </td>
                                            <td className="py-0 border-r border-gray-50">
                                                <input
                                                    className="w-full bg-transparent p-1.5 outline-none text-sm text-gray-600 focus:text-brand-black focus:font-medium transition-all placeholder:text-gray-300"
                                                    value={row.description}
                                                    onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, description: e.target.value } : r))}
                                                />
                                            </td>
                                            {clients.map(c => (
                                                <td key={c.id} className="py-0 border-r border-gray-50 last:border-0 relative">
                                                    <input
                                                        className={`w-full bg-transparent p-1.5 text-right outline-none text-sm font-mono ${parseFloat(row[c.id]) < 0 ? 'text-red-500 font-medium' : 'text-gray-900'}`}
                                                        value={row[c.id] !== undefined ? row[c.id] : ''}
                                                        onChange={(e) => handleCellChange(row.id, c.id, e.target.value)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            )
                        })}

                        {/* SUMMARY ROWS - High Contrast Footer */}

                        {/* TOTAL GASTOS ROW */}
                        <tr className="border-t-2 border-brand-black bg-gray-100">
                            <td colSpan={3} className="p-3 text-right font-bold text-brand-black text-xs uppercase tracking-widest border-r border-gray-200">TOTAL GASTOS</td>
                            {clients.map(c => {
                                const val = getTotalExpenses(c.id);
                                return (
                                    <td key={c.id} className="p-3 text-right font-bold text-red-500 font-mono text-sm border-r border-gray-300 last:border-0 bg-white">
                                        {val.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </td>
                                )
                            })}
                        </tr>

                        {/* BENEFICIO ROW */}
                        <tr className="border-t border-brand-black border-b-2 bg-brand-black text-white">
                            <td colSpan={3} className="p-4 text-right font-bold text-white text-sm uppercase tracking-widest">BENEFICIO</td>
                            {clients.map(c => {
                                const inc = getTotalIncome(c.id);
                                const exp = getTotalExpenses(c.id);
                                const total = inc + exp;
                                return (
                                    <td key={c.id} className="p-4 text-right font-black text-white font-mono text-lg border-r border-white/20 last:border-0">
                                        {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </td>
                                )
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Square Floating Action Button */}
            <button
                onClick={() => setModalMode('ADD_CLIENT')}
                className="fixed bottom-10 right-10 z-[500] w-14 h-14 bg-brand-black text-white shadow-2xl hover:scale-105 transition-transform flex items-center justify-center hover:bg-gray-800 active:scale-95"
                title="Añadir Cliente"
            >
                <Plus size={24} />
            </button>

            {/* MODALS */}
            {modalMode === 'ADD_CLIENT' && (
                <Modal title="Nuevo Cliente / Presupuesto" onClose={() => setModalMode('NONE')}>
                    <div className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Nombre del Cliente</label>
                            <input className="input-field" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Ej. NUEVO CLIENTE..." autoFocus />
                        </div>
                        <div className="p-6 bg-gray-50 border border-gray-200">
                            <h4 className="text-[10px] font-bold text-brand-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Copy size={12} /> Copiar Presupuesto (Opcional)
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <select className="input-field text-sm py-3 cursor-pointer" value={selectedFairId} onChange={e => { setSelectedFairId(e.target.value); setSelectedClientId(''); }}>
                                        <option value="">-- Origen: Ninguna --</option>
                                        {allFairs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                                {selectedFairId && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <select className="input-field text-sm py-3 cursor-pointer" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                                            <option value="">-- Cliente de Origen --</option>
                                            {selectedFairClients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={executeAddClient} disabled={!newClientName} className="btn-primary w-full justify-center disabled:opacity-50 h-12 uppercase tracking-widest text-xs">
                            {selectedClientId ? 'Crear y Copiar' : 'Crear Vacío'}
                        </button>
                    </div>
                </Modal>
            )}

            {modalMode === 'ADD_ROW' && (
                <Modal title="Añadir Concepto" onClose={() => setModalMode('NONE')}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-0 border border-brand-black">
                            <button className={`py-3 text-xs font-bold uppercase tracking-widest transition-all ${newRowData.type === 'GASTO' ? 'bg-brand-black text-white' : 'text-brand-gray hover:bg-gray-50'}`} onClick={() => setNewRowData({ ...newRowData, type: 'GASTO' })}>GASTO</button>
                            <button className={`py-3 text-xs font-bold uppercase tracking-widest transition-all ${newRowData.type === 'INGRESO' ? 'bg-brand-black text-white' : 'text-brand-gray hover:bg-gray-50'}`} onClick={() => setNewRowData({ ...newRowData, type: 'INGRESO' })}>INGRESO</button>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Categoría</label>
                            <input className="input-field" value={newRowData.category} onChange={e => setNewRowData({ ...newRowData, category: e.target.value })} placeholder="Ej. CARPINTERIA" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Concepto</label>
                            <input className="input-field" value={newRowData.description} onChange={e => setNewRowData({ ...newRowData, description: e.target.value })} placeholder="Ej. Detalle..." />
                        </div>
                        <button onClick={executeAddRow} className="btn-primary w-full h-12 uppercase tracking-widest text-xs justify-center">Añadir Concepto</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
