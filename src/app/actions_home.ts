'use server';

import { getDB, saveDB } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createFair(formData: FormData) {
    const name = formData.get('name') as string;
    const sourceFairId = formData.get('sourceFairId') as string;

    if (!name) return;

    // Determine the ID we will redirect to
    let targetId = '';

    try {
        const db = await getDB();

        // Ensure fairs array exists
        if (!db.fairs) db.fairs = [];

        const newId = name.replace(/\s+/g, '-').toUpperCase() + '-' + new Date().getFullYear();
        targetId = newId;

        // Check if exists
        const existingFair = db.fairs.find((f: any) => f.id === newId);

        if (!existingFair) {
            // Create new fair
            const newFair: any = {
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
        }
        // If existingFair found, we just redirect to it (targetId is set)

    } catch (error) {
        console.error("Error creating fair:", error);
        // We throw so the server action reports failure (Error: Failed to create fair)
        // But we avoid "NEXT_REDIRECT" issues because we don't redirect here.
        throw new Error("Failed to create fair");
    }

    // Redirect MUST be outside try/catch
    if (targetId) {
        redirect(`/ferias/${targetId}`);
    }
}
