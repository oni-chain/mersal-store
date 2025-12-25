"use client";
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
    const { dictionary } = useLanguage();

    return (
        <footer className="bg-neutral-900 border-t border-neutral-800 text-gray-500 py-12 text-center">
            <div className="max-w-7xl mx-auto px-4">
                <p className="mb-4 text-white font-bold tracking-widest text-sm uppercase font-cairo">
                    {dictionary.hero.title}
                </p>
                <p>© {new Date().getFullYear()} {dictionary.footer.rights}</p>
            </div>
        </footer>
    );
}
