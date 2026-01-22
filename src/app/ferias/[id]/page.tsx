'use client';
import { useEffect, useState } from 'react';
import { getFairs } from '@/lib/api';
import FairDetail from '@/components/FairDetail';

export const dynamic = 'force-dynamic';

export default function FeriaDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [feria, setFeria] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const fairs = await getFairs();
            const found = fairs.find((f: any) => f.id === id);
            setFeria(found);
        })();
    }, [id]);

    if (!feria) return <div>Feria no encontrada</div>;

    return <FairDetail feria={feria} />;
}
