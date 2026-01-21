'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, Loader2 } from 'lucide-react';
import { getFullBackupData } from '@/app/actions_data';

export default function FullExportButton() {
    const [loading, setLoading] = useState(false);

    const handleExportAll = async () => {
        setLoading(true);
        try {
            // 1. Fetch all fairs with FULL DATA
            const fairs = await getFullBackupData();

            const wb = XLSX.utils.book_new();
            const allExpenses: any[] = [];

            for (const fair of fairs) {
                const expenses = fair.realExpenses || [];

                expenses.forEach((exp: any) => {
                    allExpenses.push({
                        'Feria': fair.name,
                        'Fecha': exp.date,
                        'Proveedor': exp.provider,
                        'Concepto': exp.concept,
                        'Partida': exp.category,
                        'Importe Total': exp.totalAmount,
                        'Modo Distribución': exp.distributionMode,
                        // To add distribution details, we would need to map client IDs to names.
                        // For now, raw export is good.
                    });
                });
            }

            const ws = XLSX.utils.json_to_sheet(allExpenses);
            XLSX.utils.book_append_sheet(wb, ws, "Gastos Consolidado");
            XLSX.writeFile(wb, `Backup_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (e) {
            console.error(e);
            alert("Error al exportar");
        }
        setLoading(false);
    };

    return (
        <button
            onClick={handleExportAll}
            disabled={loading}
            className="btn-secondary text-[10px] uppercase tracking-widest flex items-center gap-2 h-10 px-4"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Backup Total
        </button>
    );
}
