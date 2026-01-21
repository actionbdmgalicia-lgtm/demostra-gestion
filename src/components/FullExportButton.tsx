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
            const fairs = await getFullBackupData();

            const wb = XLSX.utils.book_new();

            // --- SHEET 1: PRESUPUESTOS ---
            const budgetsData: any[] = [];

            fairs.forEach((fair: any) => {
                const fairDate = fair.date;
                const fairName = fair.name;

                fair.clients?.forEach((client: any) => {
                    // Income (Ventas Presupuestadas)
                    client.budget?.income?.forEach((inc: any) => {
                        budgetsData.push({
                            'Fecha Feria': fairDate,
                            'Feria': fairName,
                            'Cliente': client.name,
                            'Tipo': 'INGRESO (P)',
                            'Categoría': inc.category || 'VENTA',
                            'Detalle': inc.description,
                            'Cantidad': inc.amount
                        });
                    });

                    // Expenses (Gastos Presupuestados)
                    client.budget?.expenses?.forEach((exp: any) => {
                        budgetsData.push({
                            'Fecha Feria': fairDate,
                            'Feria': fairName,
                            'Cliente': client.name,
                            'Tipo': 'GASTO (P)',
                            'Categoría': exp.category,
                            'Detalle': exp.description,
                            'Cantidad': exp.estimated
                        });
                    });
                });
            });

            const wsBudgets = XLSX.utils.json_to_sheet(budgetsData);
            XLSX.utils.book_append_sheet(wb, wsBudgets, "Presupuestos");

            // --- SHEET 2: MOVIMIENTOS (GASTOS/INGRESOS REALES) ---
            const movementsData: any[] = [];

            fairs.forEach((fair: any) => {
                const fairDate = fair.date;
                const fairName = fair.name;
                const expenses = fair.realExpenses || [];

                // Map helper for client IDs
                const clientMap = new Map();
                fair.clients?.forEach((c: any) => clientMap.set(c.id, c.name));

                expenses.forEach((exp: any) => {
                    const isIncome = exp.type === 'INCOME';
                    const typeLabel = isIncome ? 'INGRESO REAL' : 'GASTO REAL';
                    // Concept: For Income use concept or 'Venta'. For Expense use Provider + - + Concept
                    const concept = isIncome ? (exp.concept || 'Venta') : (exp.provider + (exp.concept ? ` - ${exp.concept}` : ''));
                    const moveDate = exp.date; // Transaction date

                    // Handle distribution to list specific clients
                    const dist = exp.distribution || {};
                    const distKeys = Object.keys(dist);

                    if (distKeys.length > 0) {
                        distKeys.forEach(clientId => {
                            movementsData.push({
                                'Fecha Feria': fairDate,
                                'Feria': fairName,
                                'Cliente': clientMap.get(clientId) || 'Desconocido',
                                'Tipo': typeLabel,
                                'Categoría': exp.category,
                                'Detalle': concept,
                                'Cantidad': dist[clientId], // Amount for this specific client
                                'Fecha Movimiento': moveDate
                            });
                        });
                    } else {
                        // fallback if no distribution (shouldn't happen for properly saved items in new logic)
                        movementsData.push({
                            'Fecha Feria': fairDate,
                            'Feria': fairName,
                            'Cliente': 'Sin Asignar',
                            'Tipo': typeLabel,
                            'Categoría': exp.category,
                            'Detalle': concept,
                            'Cantidad': exp.totalAmount,
                            'Fecha Movimiento': moveDate
                        });
                    }
                });
            });

            const wsMovements = XLSX.utils.json_to_sheet(movementsData);
            XLSX.utils.book_append_sheet(wb, wsMovements, "Movimientos");

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
