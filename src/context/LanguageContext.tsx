"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/dictionaries/en.json';
import ar from '@/dictionaries/ar.json';

type Language = 'en' | 'ar';
type Dictionary = typeof en;

interface LanguageContextType {
    language: Language;
    dictionary: Dictionary;
    toggleLanguage: () => void;
    direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        // Load saved preference
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang) {
            setLanguage(savedLang);
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ar' : 'en';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const dictionary = language === 'en' ? en : ar;
    const direction = language === 'en' ? 'ltr' : 'rtl';

    // Update HTML dir attribute
    useEffect(() => {
        document.documentElement.dir = direction;
        document.documentElement.lang = language;
    }, [direction, language]);

    return (
        <LanguageContext.Provider value={{ language, dictionary, toggleLanguage, direction }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
