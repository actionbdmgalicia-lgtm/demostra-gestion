
import { getFairs } from '@/lib/api';
import MatrixEditor from '@/components/MatrixEditor';

export async function generateStaticParams() {
    const fairs = await getFairs();
    return fairs.map((f: any) => ({ id: f.id }));
}

export default async function FeriaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const fairs = await getFairs();
    const feria = fairs.find((f: any) => f.id === id);

    if (!feria) return <div>Feria no encontrada</div>;

    return <MatrixEditor initialFair={feria} />;
}
