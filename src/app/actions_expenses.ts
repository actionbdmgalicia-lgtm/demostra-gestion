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

        // Add unique ID
        const newExpense = {
            ...expenseData,
            id: expenseData.id || `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
        };

        fair.realExpenses.push(newExpense);

        await saveDB(db);
        revalidatePath('/gastos');
        revalidatePath('/informes');
        return { success: true, expense: newExpense };
    }
    return { success: false, error: 'Fair not found' };
}

export async function getFairExpenses(fairId: string) {
    const db = await getDB();
    const fair = db.fairs.find((f: any) => f.id === fairId);
    return fair?.realExpenses || [];
}
