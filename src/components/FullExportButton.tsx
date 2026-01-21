'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, Loader2 } from 'lucide-react';
import { getAllFairsAndClients } from '@/app/actions_data';
import { getFairExpenses } from '@/app/actions_expenses';

export default function FullExportButton() {
    const [loading, setLoading] = useState(false);

    const handleExportAll = async () => {
        setLoading(true);
        try {
            // 1. Fetch all fairs
            const fairs = await getAllFairsAndClients();

            const wb = XLSX.utils.book_new();

            // 2. Iterate each fair to create a sheet or fetch expenses
            // The user wants "TODAS las ferias (en un unico EXCEL, TODOS los Gastos"
            // Let's create one big sheet or one sheet per fair?
            // "descargar un fichero unico con: Todas las ferias ... TODOS los Gastos"
            // Usually means a consolidated list of expenses.

            const allExpenses: any[] = [];

            for (const fair of fairs) {
                // Fetch expenses for this fair
                // Note: getAllFairsAndClients might not return realExpenses depending on implementation, 
                // but usually it returns clients. Structure check:
                // actions_data.ts returns "db.fairs" (so it includes realExpenses).

                // Let's rely on getAllFairsAndClients returning the full DB object effectively for fairs.
                // But better to be safe, get expenses explicitly or check if they are in fair object.
                // Based on previous reads, db.json structure has `realExpenses` inside fair.
                // So fairs variable likely has them.

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
                        // Add client distribution details?
                        // If it's "TODOS los Gastos", raw list is best.
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
