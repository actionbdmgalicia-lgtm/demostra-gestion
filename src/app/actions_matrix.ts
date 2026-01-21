'use server';

import { getDB, saveDB } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function saveFairData(fairId: string, clients: any[]) {
    try {
        const db = await getDB();
        const fairIndex = db.fairs.findIndex((f: any) => f.id === fairId);

        if (fairIndex === -1) {
            throw new Error('Fair not found');
        }

        // Reconstruct the clients structure based on the matrix data
        // The clients array passed here is expected to be the full state of clients for that fair
        db.fairs[fairIndex].clients = clients;

        await saveDB(db);
        revalidatePath(`/ferias/${fairId}`);
        revalidatePath('/'); // Update home page counters
        return { success: true };
    } catch (error) {
        console.error("Save error:", error);
        return { success: false, error: 'Failed to save' };
    }
}
