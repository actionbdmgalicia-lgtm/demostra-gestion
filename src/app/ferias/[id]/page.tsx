import { getFairs } from '@/lib/api';
import FairDetail from '@/components/FairDetail';

export const dynamic = 'force-dynamic';

export default async function FeriaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const fairs = await getFairs();
    const feria = fairs.find((f: any) => f.id === id);

    if (!feria) return <div>Feria no encontrada</div>;

    return <FairDetail feria={feria} />;
}
