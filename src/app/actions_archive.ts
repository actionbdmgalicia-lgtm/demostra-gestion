'use server';

import { getDB, saveDB } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function toggleFairArchive(fairId: string) {
    const db = await getDB();
    const fair = db.fairs.find((f: any) => f.id === fairId);

    if (fair) {
        fair.status = fair.status === 'Archived' ? 'Active' : 'Archived';
        await saveDB(db);
        revalidatePath('/');
    }
}
