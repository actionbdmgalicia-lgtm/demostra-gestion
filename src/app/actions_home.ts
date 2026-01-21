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

        // Base structure
        let newFair: any = {
            id: '',
            name: '',
            status: 'Active',
            date: new Date().toISOString().split('T')[0],
            clients: []
        };

        try {
            const db = await getDB();

            // Ensure fairs array exists
            if (!db.fairs) db.fairs = [];

            const newId = name.replace(/\s+/g, '-').toUpperCase() + '-' + new Date().getFullYear();

            // Check if exists
            if (db.fairs.find((f: any) => f.id === newId)) {
                // If it exists, we just want to go there.
                // We can return the ID to redirect outside, or throw a specific error, 
                // but simpler: just set the ID and don't push.
                newFair.id = newId;
                // Do NOT push.
            } else {
                newFair.id = newId;
                newFair.name = name; // Update name just in case

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

        } catch (error) {
            console.error("Error creating fair:", error);
            // If it's a critical error, we might want to return it to the form (if this was useFormState),
            // but since it's a server action called via valid form action, we throw.
            throw new Error("Failed to create fair");
        }

        // Redirect after success (outside try/catch)
        redirect(`/ferias/${newFair.id}`);
    }
