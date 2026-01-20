'use server';

import { getDB, saveDB } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createBudget(formData: FormData) {
    const db = await getDB();

    const fairName = formData.get('fairName') as string;
    const clientName = formData.get('clientName') as string;
    const date = formData.get('date') as string;

    // Create or Find Fair
    let fair = db.fairs.find((f: any) => f.name.toLowerCase() === fairName.toLowerCase());

    if (!fair) {
        fair = {
            id: fairName.replace(/\s+/g, '-').toUpperCase(),
            name: fairName.toUpperCase(),
            status: 'Planning', // Default status
            date: date,
            clients: []
        };
        db.fairs.push(fair);
    }

    // Create Client Entry
    const newClient = {
        id: clientName.replace(/\s+/g, '-').toUpperCase(),
        name: clientName.toUpperCase(),
        status: 'Pending',
        budget: {
            income: [] as any[],
            expenses: [] as any[]
        },
        costs: []
    };

    // Process Multiple Estimates (Income)
    const incomeDescs = formData.getAll('incomeDesc[]');
    const incomeAmounts = formData.getAll('incomeAmount[]');

    incomeDescs.forEach((desc, index) => {
        if (desc && incomeAmounts[index]) {
            newClient.budget.income.push({
                id: Math.random().toString(36).substr(2, 9),
                category: 'VENTA',
                description: desc.toString(),
                amount: Number(incomeAmounts[index])
            });
        }
    });

    // Process Multiple Costs (Expenses)
    const expenseCats = formData.getAll('expenseCat[]');
    const expenseDescs = formData.getAll('expenseDesc[]');
    const expenseAmounts = formData.getAll('expenseAmount[]');

    expenseDescs.forEach((desc, index) => {
        // Allow empty desc if category is set? Let's require desc or amount at least.
        if (expenseAmounts[index]) {
            newClient.budget.expenses.push({
                id: Math.random().toString(36).substr(2, 9),
                category: expenseCats[index]?.toString() || 'OTROS',
                description: desc.toString() || 'Varios',
                type: 'Previsión',
                estimated: Number(expenseAmounts[index])
            });
        }
    });

    fair.clients.push(newClient);

    await saveDB(db);
    revalidatePath('/');
    revalidatePath('/presupuestos');
    redirect('/presupuestos');
}
