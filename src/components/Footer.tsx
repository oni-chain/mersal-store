"use client";
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-neutral-900 border-t border-neutral-800 text-gray-500 py-12 text-center">
            <div className="max-w-7xl mx-auto px-4">
                <p className="mb-4 text-white font-bold tracking-widest text-sm uppercase font-cairo">
                    {t('hero.title')}
                </p>
                <p>© {new Date().getFullYear()} {t('footer.rights')}</p>
            </div>
        </footer>
    );
}
