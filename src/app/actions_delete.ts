'use server';

import { getDB, saveDB } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function deleteClient(fairId: string, clientId: string) {
    const db = await getDB();
    const fair = db.fairs.find((f: any) => f.id === fairId);

    if (fair) {
        fair.clients = fair.clients.filter((c: any) => c.id !== clientId);
        await saveDB(db);
        revalidatePath(`/ferias/${fairId}`);
    }
}
