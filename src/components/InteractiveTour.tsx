
'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

export type TourStep = {
    target: string; // Query selector
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
};

interface InteractiveTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onClose: () => void;
}

export default function InteractiveTour({ steps, isOpen, onClose }: InteractiveTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const updateRect = () => {
            const step = steps[currentStep];
            if (!step) return;

            // If target is center, we don't need an element
            if (step.position === 'center') {
                setRect(null);
                return;
            }

            const element = document.querySelector(step.target);
            if (element) {
                const r = element.getBoundingClientRect();
                setRect(r);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Return to center if element not found
                setRect(null);
            }
        };

        // Delay to allow rendering/animation
        const timer = setTimeout(updateRect, 300);
        window.addEventListener('resize', updateRect);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateRect);
        };
    }, [currentStep, isOpen, steps]);

    if (!isOpen) return null;

    const step = steps[currentStep];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
            setCurrentStep(0);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Calculate Popover Position
    let popoverStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 99999,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    };

    if (rect) {
        // Calculate position relative to rect
        // Simple logic for Top/Bottom (can be improved)
        const isBottom = rect.top < window.innerHeight / 2;

        popoverStyle = {
            position: 'fixed',
            zIndex: 99999,
            top: isBottom ? rect.bottom + 20 : 'auto',
            bottom: !isBottom ? window.innerHeight - rect.top + 20 : 'auto',
            left: rect.left + (rect.width / 2) - 160, // Center horizontally relative to target
            transform: 'none',
        };

        // Clamp to screen edges
        if (popoverStyle.left && (popoverStyle.left as number) < 20) popoverStyle.left = 20;
    }

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Backdrop with Hole using mix-blend-mode or simple overlay logic */}
            {/* Note: True SVG mask hole is complex. We'll use a semi-transparent dimmer for now and highlight the target with a border box */}

            <div className="absolute inset-0 bg-black/50 transition-all duration-500" onClick={onClose}></div>

            {/* Spotlight Box */}
            {rect && (
                <div
                    className="absolute border-4 border-brand-accent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-500 ease-in-out"
                    style={{
                        top: rect.top - 4,
                        left: rect.left - 4,
                        width: rect.width + 8,
                        height: rect.height + 8,
                    }}
                >
                    <div className="absolute -top-10 left-0 bg-brand-accent text-white text-xs font-bold px-2 py-1 uppercase tracking-widest rounded-t-md">
                        Paso {currentStep + 1} / {steps.length}
                    </div>
                </div>
            )}

            {/* Content Card */}
            <div
                className="bg-white p-6 rounded-xl shadow-2xl w-[320px] max-w-[90vw] flex flex-col gap-4 transition-all duration-500"
                style={popoverStyle}
            >
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-brand-black mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === currentStep ? 'bg-brand-black' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className="btn-primary flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest"
                    >
                        {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'} <ChevronRight size={14} />
                    </button>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-brand-black">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
