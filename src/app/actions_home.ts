'use server';

import { getDB, saveDB } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createFair(formData: FormData) {
    const name = formData.get('name') as string;
    const sourceFairId = formData.get('sourceFairId') as string;

    if (!name) return;

    try {
        const db = await getDB();

        // Ensure fairs array exists
        if (!db.fairs) db.fairs = [];

        const newId = name.replace(/\s+/g, '-').toUpperCase() + '-' + new Date().getFullYear();

        if (db.fairs.find((f: any) => f.id === newId)) {
            redirect(`/ferias/${newId}`);
        }

        // Base structure
        let newFair: any = {
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
    } catch (error) {
        console.error("Error creating fair:", error);
        // Note: In server actions, redirect should be outside try/catch usually if it throws, 
        // but here we want to catch other errors. Redirect throws a specific error type NEXT_REDIRECT
        // so we must re-throw if it's a redirect.
        if ((error as any).message === 'NEXT_REDIRECT') throw error;
        throw new Error("Failed to create fair");
    }

    // Redirect after success (outside try/catch to avoid catching the redirect error)
    const newId = name.replace(/\s+/g, '-').toUpperCase() + '-' + new Date().getFullYear();
    redirect(`/ferias/${newId}`);
}
