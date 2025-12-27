"use client";
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function Hero() {
    const { dictionary } = useLanguage();

    return (
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
            {/* Background with Grid and Gradient */}
            <div className="absolute inset-0 bg-black">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8">
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {dictionary.hero.title}
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                    {dictionary.hero.subtitle}
                </p>
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <button
                        onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-primary text-white font-bold py-4 px-12 rounded-full hover:bg-blue-600 hover:scale-105 transition-all shadow-lg hover:shadow-primary/25"
                    >
                        {dictionary.hero.cta}
                    </button>
                </div>
            </div>
        </section>
    );
}
