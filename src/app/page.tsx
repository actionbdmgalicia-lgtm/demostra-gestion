import { getFairs } from '@/lib/api';
import { createFair } from '@/app/actions_home';
import FairList from '@/components/FairList';
import FullExportButton from '@/components/FullExportButton';
import LogoutButton from '@/components/LogoutButton'; // Added
import ResetButton from '@/components/ResetButton'; // Added
import { Plus, Copy, LayoutGrid, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const fairs = await getFairs();

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-20 gap-8">
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-black text-brand-black mb-2 tracking-tighter uppercase leading-none">
            Demostra Gestión
          </h1>
          <p className="text-lg text-brand-grey font-light tracking-widest uppercase text-xs">
            Panel de Control & Presupuestos
          </p>
        </div>

        <div className="flex gap-4 items-center">
          <FullExportButton />
          <a href="/gastos" className="btn-secondary text-[10px] uppercase tracking-widest flex items-center gap-2 h-10 px-4">
            <Plus size={14} /> Imputar
          </a>
          <a href="/comparativo" className="btn-secondary text-[10px] uppercase tracking-widest flex items-center gap-2 h-10 px-4">
            <TrendingUp size={14} /> Control
          </a>
          <a href="/informes" className="btn-secondary text-[10px] uppercase tracking-widest flex items-center gap-2 h-10 px-4">
            <LayoutGrid size={14} /> Informes
          </a>
          <div className="h-6 w-px bg-gray-200 mx-2"></div>
          <ResetButton />
          <div className="h-6 w-px bg-gray-200 mx-2"></div>
          <LogoutButton />
        </div>
      </div>

      <div className="bg-white p-10 border border-gray-200 shadow-sm mb-16 relative overflow-hidden group hover:border-brand-black transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-black transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

        <h2 className="text-xs font-bold tracking-[0.2em] text-brand-grey uppercase mb-8 flex items-center gap-2">
          <Plus size={16} className="text-brand-accent" /> Nueva Feria
        </h2>

        <form action={createFair} className="grid md:grid-cols-3 gap-8 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-black mb-3">Nombre del Evento</label>
            <input
              name="name"
              type="text"
              placeholder="Ej. HIP 2027"
              required
              className="input-field"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-black mb-3">Copiar datos de...</label>
            <div className="relative">
              <select name="sourceFairId" className="input-field appearance-none cursor-pointer">
                <option value="none">-- Empezar de cero --</option>
                {fairs.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <Copy size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-grey pointer-events-none" />
            </div>
          </div>
          <div className="md:col-span-1">
            <button type="submit" className="btn-primary w-full h-[50px] text-sm uppercase tracking-widest">
              Crear Feria
            </button>
          </div>
        </form>
      </div>

      <FairList fairs={fairs} />
    </div>
  );
}
