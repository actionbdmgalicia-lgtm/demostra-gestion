'use server';

import { getDB, saveDB } from '@/lib/api';
import initialData from '@/data/db.json';
import { revalidatePath } from 'next/cache';

export async function getAllFairsAndClients() {
    const db = await getDB();
    return db.fairs.map((f: any) => ({
        id: f.id,
        name: f.name,
        clients: f.clients.filter((c: any) => c.status !== 'Archived').map((c: any) => ({
            id: c.id,
            name: c.name,
            // We imply we might fetch full data later or send it now if small enough
            // Let's send budget overview or full structure? 
            // For copying, we need the full structure.
            budget: c.budget
        }))
    }));
}

export async function getFullBackupData() {
    const db = await getDB();
    return db.fairs;
}

export async function resetDatabase() {
    console.log("Resetting database to initial data...");
    await saveDB(initialData);
    revalidatePath('/');
}
