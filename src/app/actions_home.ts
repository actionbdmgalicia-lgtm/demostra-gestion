'use server';

import { getDB, saveDB } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createFair(formData: FormData) {
    const name = formData.get('name') as string;
    const sourceFairId = formData.get('sourceFairId') as string;

    if (!name) return;

    const db = await getDB();
    const newId = name.replace(/\s+/g, '-').toUpperCase() + '-' + new Date().getFullYear();

    if (db.fairs.find((f: any) => f.id === newId)) {
        redirect(`/ferias/${newId}`);
    }

    // Base structure
    let newFair = {
        id: newId,
        name,
        status: 'Active',
        date: new Date().toISOString().split('T')[0],
        clients: []
    };

    // Logic to Clone from existing fair
    if (sourceFairId && sourceFairId !== 'none') {
        const sourceFair = db.fairs.find((f: any) => f.id === sourceFairId);
        if (sourceFair) {
            // Deep clone clients and generate new IDs to avoid conflicts
            const clonedClients = sourceFair.clients.map((client: any) => ({
                ...client,
                id: `${client.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                // Keep budget/costs data
                budget: JSON.parse(JSON.stringify(client.budget))
            }));
            newFair.clients = clonedClients;
        }
    }

    db.fairs.push(newFair);
    await saveDB(db);

    revalidatePath('/');
    redirect(`/ferias/${newId}`);
}
