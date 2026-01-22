'use server';

import { getDB, saveDB } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function saveExpenseImputation(fairId: string, expenseData: any) {
    const db = await getDB();
    const fair = db.fairs.find((f: any) => f.id === fairId);

    if (fair) {
        if (!fair.realExpenses) {
            fair.realExpenses = [];
        }

        const existingIndex = expenseData.id
            ? fair.realExpenses.findIndex((e: any) => e.id === expenseData.id)
            : -1;

        let savedExpense;

        if (existingIndex >= 0) {
            // Update existing
            savedExpense = {
                ...fair.realExpenses[existingIndex],
                ...expenseData,
                updatedAt: new Date().toISOString()
            };
            fair.realExpenses[existingIndex] = savedExpense;
        } else {
            // Create New
            savedExpense = {
                ...expenseData,
                id: expenseData.id || `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString()
            };
            fair.realExpenses.push(savedExpense);
        }

        await saveDB(db);
        revalidatePath('/gastos');
        revalidatePath('/informes');
        // We probably also need to revalidate the fair page
        revalidatePath(`/ferias/${fairId}`);
        return { success: true, expense: savedExpense };
    }
    return { success: false, error: 'Fair not found' };
}

export async function getFairExpenses(fairId: string) {
    const db = await getDB();
    const fair = db.fairs.find((f: any) => f.id === fairId);
    return fair?.realExpenses || [];
}
