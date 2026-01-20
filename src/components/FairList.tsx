'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Box, Calendar, LayoutGrid, Archive } from 'lucide-react';
import { toggleFairArchive } from '@/app/actions_archive';

export default function FairList({ fairs }: { fairs: any[] }) {
    const [showArchived, setShowArchived] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const [selectedYear, setSelectedYear] = useState('ALL');
    const [selectedMonth, setSelectedMonth] = useState('ALL');

    // Extract unique years from fairs
    const availableYears = Array.from(new Set(fairs.map(f => f.date ? f.date.split('-')[0] : '').filter(Boolean))).sort().reverse();
    const availableMonths = [
        { value: '01', label: 'ENERO' }, { value: '02', label: 'FEBRERO' }, { value: '03', label: 'MARZO' },
        { value: '04', label: 'ABRIL' }, { value: '05', label: 'MAYO' }, { value: '06', label: 'JUNIO' },
        { value: '07', label: 'JULIO' }, { value: '08', label: 'AGOSTO' }, { value: '09', label: 'SEPTIEMBRE' },
        { value: '10', label: 'OCTUBRE' }, { value: '11', label: 'NOVIEMBRE' }, { value: '12', label: 'DICIEMBRE' }
    ];

    const displayedFairs = fairs.filter((f: any) => {
        const matchesStatus = showArchived ? f.status === 'Archived' : f.status !== 'Archived';

        const fDate = f.date || '';
        const fYear = fDate.split('-')[0] || '';
        const fMonth = fDate.split('-')[1] || '';

        const matchesYear = selectedYear === 'ALL' || fYear === selectedYear;
        const matchesMonth = selectedMonth === 'ALL' || fMonth === selectedMonth;

        return matchesStatus && matchesYear && matchesMonth;
    });

    const handleArchive = async (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Prevent navigation link
        if (!confirm('¿Cambiar estado de archivo de esta feria?')) return;

        setLoadingId(id);
        await toggleFairArchive(id);
        setLoadingId(null);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-100 pb-4 gap-4">
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <h2 className="text-xs font-bold tracking-[0.2em] text-brand-black uppercase flex items-center gap-2">
                        <LayoutGrid size={16} />
                        {showArchived ? 'Ferias Archivadas' : 'Ferias Activas'}
                    </h2>
                    <div className="flex gap-2">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider p-2 w-24 focus:border-brand-black outline-none cursor-pointer"
                        >
                            <option value="ALL">AÑO</option>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider p-2 w-32 focus:border-brand-black outline-none cursor-pointer"
                        >
                            <option value="ALL">MES</option>
                            {availableMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="text-[10px] font-bold tracking-widest text-brand-grey hover:text-brand-black uppercase flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                    <Archive size={12} />
                    {showArchived ? 'Ver Activas' : 'Ver Archivadas'}
                </button>
            </div>

            {displayedFairs.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-gray-200 bg-gray-50 text-brand-grey font-light tracking-wide">
                    {showArchived ? 'No hay ferias archivadas.' : 'No hay ferias activas. Crea una nueva.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayedFairs.map((f: any) => (
                        <Link key={f.id} href={`/ferias/${f.id}`} className="group relative bg-white border border-gray-100 p-8 hover:border-brand-black transition-all duration-300">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className={`w-12 h-12 flex items-center justify-center bg-gray-50 text-brand-black mb-6 transition-colors ${loadingId === f.id ? 'opacity-50' : 'group-hover:bg-brand-black group-hover:text-white'}`}>
                                        <Box size={24} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-bold text-brand-black mb-2 uppercase tracking-tight group-hover:text-brand-accent transition-colors">
                                        {f.name}
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs font-semibold text-brand-grey uppercase tracking-wider">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {f.date || 'Sin fecha'}</span>
                                        <span className="w-px h-3 bg-gray-300"></span>
                                        <span>{f.clients?.length || 0} Clientes</span>
                                    </div>
                                </div>
                                {f.status === 'Archived' && (
                                    <span className="text-[10px] uppercase tracking-widest bg-gray-100 px-2 py-1 text-brand-grey">Archivada</span>
                                )}
                            </div>

                            {/* Archive Action - Absolute bottom right */}
                            <div className="absolute right-6 bottom-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={(e) => handleArchive(e, f.id)}
                                    className="p-2 text-gray-300 hover:text-brand-black transition-colors"
                                    title={f.status === 'Archived' ? "Desarchivar" : "Archivar"}
                                >
                                    <Archive size={16} />
                                </button>
                                <ArrowRight size={20} className="text-brand-accent transform -translate-x-2 group-hover:translate-x-0 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
