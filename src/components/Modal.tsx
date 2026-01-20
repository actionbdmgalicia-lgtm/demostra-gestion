import { X } from 'lucide-react';

export default function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-brand-black/10">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="font-bold text-sm tracking-widest uppercase text-brand-black">{title}</h3>
                    <button onClick={onClose} className="text-brand-grey hover:text-brand-black transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
