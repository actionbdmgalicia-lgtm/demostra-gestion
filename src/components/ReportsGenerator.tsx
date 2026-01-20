'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllFairsAndClients } from '@/app/actions_data';
import { ArrowLeft, FileChartColumn, PieChart, LayoutGrid, Check, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, X, Filter } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// === CONSTANTS ===

const CATEGORY_COLORS: { [key: string]: string } = {
    'VENTA': '#00FFFF', 'CARPINTERIA': '#92D050', 'MONTAJE': '#92D050', 'MATERIAL': '#9BC2E6',
    'TRANSPORTE': '#FFC000', 'GASTOS VIAJE': '#C6E0B4', 'MOB ALQ': '#FF99FF', 'ELECTRICIDAD': '#00B0F0',
    'SSFF': '#FFFF00', 'MOB COMPRA': '#FF66FF', 'GRAFICIA': '#FFC000', 'GRAFICA': '#FFC000',
    'GASTOS GG': '#DDEBF7', 'DEFAULT': '#F3F4F6'
};

const STANDARD_CATEGORIES = [
    'VENTA', 'CARPINTERIA', 'MONTAJE', 'MATERIAL', 'TRANSPORTE',
    'GASTOS VIAJE', 'MOB ALQ', 'ELECTRICIDAD', 'SSFF',
    'MOB COMPRA', 'GRAFICA', 'GASTOS GG'
];

interface Client {
    id: string;
    name: string;
    fairId: string;
    fairName: string;
    budget: { income: any[]; expenses: any[]; };
}

// === HELPER COMPONENT: MODERN MULTI-SELECT ===
function MultiSelect({
    options, selected, onChange, label, placeholder
}: {
    options: { id: string, label: string, sub?: string }[],
    selected: Set<string>,
    onChange: (newSet: Set<string>) => void,
    label: string,
    placeholder: string
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onChange(next);
    };

    const handleSelectAll = () => {
        if (selected.size === options.length) onChange(new Set());
        else onChange(new Set(options.map(o => o.id)));
    };

    return (
        <div className="relative group min-w-[300px]" ref={containerRef}>
            <label className="block text-[10px] font-bold text-brand-grey uppercase tracking-widest mb-2">{label}</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left bg-white border-b-2 transition-all p-2 flex justify-between items-center outline-none group-hover:border-brand-black ${isOpen ? 'border-brand-black' : 'border-gray-200'}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selected.size === 0 && <span className="text-gray-400 font-bold uppercase tracking-wide text-xs">{placeholder}</span>}
                    {selected.size > 0 && (
                        <div className="flex flex-wrap gap-1">
                            <span className="bg-brand-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                                {selected.size} seleccionados
                            </span>
                            {selected.size === options.length && <span className="text-[10px] text-green-600 font-bold ml-2 uppercase tracking-widest">(Todos)</span>}
                        </div>
                    )}
                </div>
                <ChevronDown size={16} className={`text-brand-black transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-white shadow-2xl border border-gray-200 mt-0 z-50 overflow-hidden flex flex-col max-h-[400px]">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{options.length} Opciones</span>
                        <button onClick={handleSelectAll} className="text-[10px] font-bold text-brand-black hover:text-gray-600 hover:underline uppercase tracking-widest">
                            {selected.size === options.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                        </button>
                    </div>
                    <div className="overflow-y-auto p-0">
                        {options.map(opt => {
                            const isSelected = selected.has(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleOption(opt.id)}
                                    className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex justify-between items-center ${isSelected ? 'bg-brand-black text-white hover:bg-gray-800' : 'text-gray-600'}`}
                                >
                                    <span className="flex flex-col">
                                        <span>{opt.label}</span>
                                        {opt.sub && <span className={`text-[9px] font-normal ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>{opt.sub}</span>}
                                    </span>
                                    {isSelected && <Check size={14} />}
                                </button>
                            );
                        })}
                        {options.length === 0 && <div className="text-sm text-gray-400 italic p-4 text-center">No hay opciones disponibles</div>}
                    </div>
                </div>
            )}
        </div>
    );
}


export default function ReportsGenerator() {
    const [allFairs, setAllFairs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [reportType, setReportType] = useState<'FAIR' | 'GLOBAL'>('FAIR');

    // Selection State
    const [selectedFairId, setSelectedFairId] = useState<string>('');
    const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());

    // Sorting
    const [sortCol, setSortCol] = useState<string>('CATEGORY');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // Fair Selector State
    const [isFairOpen, setIsFairOpen] = useState(false);

    useEffect(() => {
        getAllFairsAndClients().then(data => {
            setAllFairs(data);
            if (data.length > 0) setSelectedFairId(data[0].id);
            setLoading(false);
        });
    }, []);

    // Derived Data
    const allClientsFlat = useMemo(() => {
        const flat: Client[] = [];
        allFairs.forEach(f => {
            if (f.clients) f.clients.forEach((c: any) => flat.push({ ...c, fairId: f.id, fairName: f.name }));
        });
        return flat;
    }, [allFairs]);

    const availableClients = useMemo(() => {
        if (reportType === 'FAIR') return allClientsFlat.filter(c => c.fairId === selectedFairId);
        return allClientsFlat;
    }, [reportType, selectedFairId, allClientsFlat]);

    // Auto-select clients on fair change
    useEffect(() => {
        if (reportType === 'FAIR' && selectedFairId) {
            const fairClients = allClientsFlat.filter(c => c.fairId === selectedFairId);
            setSelectedClientIds(new Set(fairClients.map(c => c.id)));
        }
    }, [reportType, selectedFairId, allClientsFlat]);

    const handleSort = (colId: string) => {
        if (sortCol === colId) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(colId);
            setSortDir('asc');
        }
    };

    // --- REPORT CALCULATION ---
    const reportData = useMemo(() => {
        const clientsToProcess = allClientsFlat.filter(c => selectedClientIds.has(c.id));

        // 1. Unique Categories
        const capturedCategories = new Set(STANDARD_CATEGORIES);
        clientsToProcess.forEach(c => c.budget?.expenses?.forEach((e: any) => capturedCategories.add(e.category.toUpperCase().trim())));
        let sortedCats = Array.from(capturedCategories);

        // 2. Build Matrix (Initial Pass)
        let matrix: any[] = [];
        const clientTotals: { [key: string]: number } = {};
        const clientIncomes: { [key: string]: number } = {};

        clientsToProcess.forEach(c => {
            const totalExp = c.budget?.expenses?.reduce((sum: number, item: any) => sum + (item.estimated || 0), 0) || 0;
            clientTotals[c.id] = totalExp;

            const totalInc = c.budget?.income?.reduce((sum: number, item: any) => sum + (item.amount || item.estimated || 0), 0) || 0;
            clientIncomes[c.id] = totalInc;
        });

        const grandTotalAllClients = Object.values(clientTotals).reduce((a, b) => a + b, 0);
        const grandTotalIncome = Object.values(clientIncomes).reduce((a, b) => a + b, 0);

        sortedCats.forEach(cat => {
            const row: any = { category: cat, values: {}, total: 0 };
            clientsToProcess.forEach(c => {
                let catSum = 0;
                if (cat === 'VENTA') {
                    catSum = c.budget?.income?.reduce((sum: number, item: any) => sum + (item.amount || item.estimated || 0), 0) || 0;
                } else {
                    catSum = c.budget?.expenses
                        ?.filter((e: any) => e.category.toUpperCase().trim() === cat)
                        .reduce((sum: number, item: any) => sum + (item.estimated || 0), 0) || 0;
                }
                row.values[c.id] = catSum;
                row.total += catSum;
            });
            matrix.push(row);
        });

        // 3. Apply Sorting
        if (sortCol === 'CATEGORY') {
            matrix.sort((a, b) => {
                const idxA = STANDARD_CATEGORIES.indexOf(a.category);
                const idxB = STANDARD_CATEGORIES.indexOf(b.category);
                if (idxA !== -1 && idxB !== -1) return sortDir === 'asc' ? idxA - idxB : idxB - idxA;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return sortDir === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
            });
        } else if (sortCol === 'TOTAL') {
            matrix.sort((a, b) => sortDir === 'asc' ? a.total - b.total : b.total - a.total);
        } else {
            matrix.sort((a, b) => {
                const valA = a.values[sortCol] || 0;
                const valB = b.values[sortCol] || 0;
                return sortDir === 'asc' ? valA - valB : valB - valA;
            });
        }

        return { clients: clientsToProcess, matrix, clientTotals, clientIncomes, grandTotalAllClients, grandTotalIncome };
    }, [selectedClientIds, allClientsFlat, sortCol, sortDir]);


    if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="animate-spin text-brand-black rounded-full h-8 w-8 border-2 border-brand-black border-t-transparent"></div></div>;

    const currentFairName = allFairs.find(f => f.id === selectedFairId)?.name || 'Seleccionar Feria';

    const SortIcon = ({ id }: { id: string }) => {
        if (sortCol !== id) return <ArrowUpDown size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sortDir === 'asc' ? <ArrowUp size={12} className="text-brand-black" /> : <ArrowDown size={12} className="text-brand-black" />;
    };
    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const exportData: any[] = [];
        // Header
        const header: any[] = ['Partida / Concepto'];
        reportData.clients.forEach(c => header.push(`${c.name} (${c.fairName})`));
        if (reportType === 'FAIR') { header.push('TOTAL'); header.push('%'); }
        exportData.push(header);
        // Rows
        reportData.matrix.forEach(row => {
            if (row.total === 0 && !STANDARD_CATEGORIES.includes(row.category)) return;
            const r: any[] = [row.category];
            reportData.clients.forEach(c => r.push(row.values[c.id] || 0));
            if (reportType === 'FAIR') {
                r.push(row.total);
                r.push(reportData.grandTotalAllClients > 0 ? (row.total / reportData.grandTotalAllClients) : 0);
            }
            exportData.push(r);
        });
        // Totals
        const totalRow: any[] = ['TOTAL GENERAL'];
        reportData.clients.forEach(c => totalRow.push(reportData.clientTotals[c.id] || 0));
        if (reportType === 'FAIR') { totalRow.push(reportData.grandTotalAllClients); totalRow.push(1); }
        exportData.push(totalRow);
        // Beneficio
        const beneficioRow: any[] = ['BENEFICIO'];
        reportData.clients.forEach(c => {
            const inc = reportData.clientIncomes[c.id] || 0;
            const exp = reportData.clientTotals[c.id] || 0;
            beneficioRow.push(inc - exp);
        });
        if (reportType === 'FAIR') {
            const totalBen = reportData.grandTotalIncome - reportData.grandTotalAllClients;
            beneficioRow.push(totalBen);
            beneficioRow.push(reportData.grandTotalIncome > 0 ? totalBen / reportData.grandTotalIncome : 0);
        }
        exportData.push(beneficioRow);
        // % Beneficio
        const pctRow: any[] = ['% BENEFICIO'];
        reportData.clients.forEach(c => {
            const inc = reportData.clientIncomes[c.id] || 0;
            const ben = inc - reportData.clientTotals[c.id];
            pctRow.push(inc > 0 ? ben / inc : 0);
        });
        if (reportType === 'FAIR') {
            const totalBen = reportData.grandTotalIncome - reportData.grandTotalAllClients;
            pctRow.push(reportData.grandTotalIncome > 0 ? totalBen / reportData.grandTotalIncome : 0);
            pctRow.push('');
        }
        exportData.push(pctRow);

        const ws = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Informe");
        XLSX.writeFile(wb, `Informe_${reportType}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-brand-light font-sans text-brand-black flex flex-col">

            {/* HEADER */}
            <div className="bg-white px-8 py-6 border-b border-gray-200 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-brand-grey hover:text-brand-black transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-black tracking-tight text-brand-black uppercase flex items-center gap-3">
                        <span className="bg-brand-black text-white p-1 rounded-sm"><FileChartColumn size={20} /></span>
                        Informes
                    </h1>
                </div>
                <button onClick={handleExport} className="btn-primary h-10 px-6 text-xs uppercase tracking-widest flex items-center gap-2">
                    <ArrowDown size={14} /> Exportar
                </button>
            </div>

            <div className="flex-grow p-0 lg:p-0 flex flex-col h-full overflow-hidden">

                {/* CONFIGURATION BAR */}
                <div className="bg-white border-b border-gray-200 px-8 py-6 flex flex-col xl:flex-row gap-8 items-start relative z-40">

                    {/* 1. Report Type */}
                    <div className="flex-shrink-0">
                        <label className="block text-[10px] font-bold text-brand-grey uppercase tracking-widest mb-2">Modo</label>
                        <div className="inline-flex border border-brand-black p-0 bg-transparent">
                            <button
                                onClick={() => setReportType('FAIR')}
                                className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${reportType === 'FAIR' ? 'bg-brand-black text-white' : 'text-brand-gray hover:bg-gray-100'}`}
                            >
                                Por Feria
                            </button>
                            <button
                                onClick={() => setReportType('GLOBAL')}
                                className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${reportType === 'GLOBAL' ? 'bg-brand-black text-white' : 'text-brand-gray hover:bg-gray-100'}`}
                            >
                                Comparativa
                            </button>
                        </div>
                    </div>

                    {/* 2. Fair Dropdown */}
                    {reportType === 'FAIR' && (
                        <div className="flex-shrink-0 min-w-[300px] relative">
                            <label className="block text-[10px] font-bold text-brand-grey uppercase tracking-widest mb-2">Evento / Feria</label>
                            <button
                                onClick={() => setIsFairOpen(!isFairOpen)}
                                className="w-full text-left bg-white border-b-2 border-gray-200 hover:border-brand-black px-0 py-2 flex justify-between items-center transition-all group"
                            >
                                <span className="font-bold text-lg text-brand-black uppercase tracking-tight">{currentFairName}</span>
                                <ChevronDown size={16} className={`text-brand-grey group-hover:text-brand-black transition-transform ${isFairOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isFairOpen && (
                                <div className="absolute top-full left-0 w-full bg-white shadow-2xl border border-gray-200 mt-0 z-50 overflow-y-auto max-h-[300px]">
                                    {allFairs.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => { setSelectedFairId(f.id); setIsFairOpen(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wide border-b border-gray-50 last:border-0 transition-colors ${selectedFairId === f.id ? 'bg-brand-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. Multi-Select */}
                    <div className="flex-grow w-full max-w-2xl">
                        <MultiSelect
                            label={`Clientes (${selectedClientIds.size})`}
                            placeholder="Seleccionar clientes..."
                            options={availableClients.map(c => ({
                                id: c.id,
                                label: c.name,
                                sub: reportType === 'GLOBAL' ? c.fairName : undefined
                            }))}
                            selected={selectedClientIds}
                            onChange={setSelectedClientIds}
                        />
                    </div>
                </div>

                {/* TABLE AREA */}
                <div className="flex-grow overflow-auto bg-white border-t border-gray-100 relative">
                    <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
                        <thead className="sticky top-0 z-30 bg-white">
                            <tr className="border-b-2 border-brand-black">
                                <th className="p-0 sticky left-0 z-30 bg-white w-[250px] border-r border-gray-200">
                                    <button onClick={() => handleSort('CATEGORY')} className="w-full h-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group text-left">
                                        <span className="text-[10px] font-black text-brand-black uppercase tracking-widest">Partida / Concepto</span>
                                        <SortIcon id="CATEGORY" />
                                    </button>
                                </th>
                                {reportData.clients.map(c => (
                                    <th key={c.id} className="p-0 min-w-[90px] border-r border-gray-100 last:border-0">
                                        <button onClick={() => handleSort(c.id)} className="w-full h-full p-4 flex flex-col items-end justify-center hover:bg-gray-50 transition-colors group text-right">
                                            <div className="flex items-center gap-2 mb-1">
                                                <SortIcon id={c.id} />
                                                <span className="text-xs font-bold text-gray-900 uppercase tracking-tight truncate max-w-[140px]" title={c.name}>{c.name}</span>
                                            </div>
                                            {reportType === 'GLOBAL' && <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{c.fairName}</span>}
                                        </button>
                                    </th>
                                ))}
                                {reportType === 'FAIR' && (
                                    <>
                                        <th className="p-0 min-w-[140px] bg-gray-50 border-r border-gray-200">
                                            <button onClick={() => handleSort('TOTAL')} className="w-full h-full p-4 flex items-center justify-end gap-2 hover:bg-gray-100 transition-colors group">
                                                <SortIcon id="TOTAL" />
                                                <span className="text-xs font-black text-brand-black uppercase tracking-widest">TOTAL</span>
                                            </button>
                                        </th>
                                        <th className="p-4 text-right min-w-[80px] bg-gray-50 border-l border-white">
                                            <span className="text-xs font-black text-brand-grey uppercase tracking-widest">%</span>
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.matrix.map((row) => {
                                if (row.total === 0 && !STANDARD_CATEGORIES.includes(row.category)) return null;
                                const catColor = CATEGORY_COLORS[row.category] || '#F3F4F6';

                                return (
                                    <tr key={row.category} className="group hover:bg-gray-50 transition-colors border-b border-gray-100">
                                        <td
                                            style={{ backgroundColor: catColor }}
                                            className="p-3 text-[10px] font-bold text-black uppercase tracking-wider sticky left-0 z-20 border-r border-black/5"
                                        >
                                            {row.category}
                                        </td>
                                        {reportData.clients.map(c => (
                                            <td key={c.id} className="p-3 text-right text-gray-900 font-mono text-sm border-r border-gray-100">
                                                {row.values[c.id] ? row.values[c.id].toLocaleString('es-ES', { minimumFractionDigits: 2 }) : <span className="text-gray-200">-</span>}
                                            </td>
                                        ))}
                                        {reportType === 'FAIR' && (
                                            <>
                                                <td className="p-3 text-right font-bold text-brand-black bg-gray-50 font-mono border-r border-gray-200">
                                                    {row.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-right text-xs font-bold text-gray-400 bg-gray-50">
                                                    {reportData.grandTotalAllClients > 0 ? ((row.total / reportData.grandTotalAllClients) * 100).toFixed(0) + '%' : '-'}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot className="bg-brand-black text-white sticky bottom-0 z-40 border-t-4 border-double border-white shadow-2xl">
                            {/* TOTAL */}
                            <tr>
                                <td className="p-4 font-bold text-xs uppercase tracking-widest sticky left-0 bg-brand-black z-30 border-r border-white/20">TOTAL GENERAL</td>
                                {reportData.clients.map(c => (
                                    <td key={c.id} className="p-4 text-right font-bold font-mono text-sm border-r border-white/10">
                                        {reportData.clientTotals[c.id].toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </td>
                                ))}
                                {reportType === 'FAIR' && (
                                    <>
                                        <td className="p-4 text-right font-black text-lg bg-gray-800 border-r border-white/20">
                                            {reportData.grandTotalAllClients.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-right bg-gray-800 text-gray-400 text-xs">100%</td>
                                    </>
                                )}
                            </tr>
                            {/* BENEFICIO */}
                            <tr className="bg-white text-brand-black border-t border-gray-200">
                                <td className="p-4 font-black text-xs uppercase tracking-widest sticky left-0 bg-white z-30 border-r border-gray-200">BENEFICIO</td>
                                {reportData.clients.map(c => {
                                    const inc = reportData.clientIncomes[c.id] || 0;
                                    const exp = reportData.clientTotals[c.id] || 0;
                                    const ben = inc - exp;
                                    return (
                                        <td key={c.id} className={`p-4 text-right font-black font-mono text-base border-r border-gray-200 ${ben >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ben.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                        </td>
                                    );
                                })}
                                {reportType === 'FAIR' && (
                                    <>
                                        <td className="p-4 text-right font-black text-xl text-green-600 border-r border-gray-200 bg-green-50">
                                            {(reportData.grandTotalIncome - reportData.grandTotalAllClients).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 bg-green-50"></td>
                                    </>
                                )}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
