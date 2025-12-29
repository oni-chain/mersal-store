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
    t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('ar');

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

    const t = (key: string, params?: Record<string, any>): string => {
        const keys = key.split('.');
        let value: any = dictionary;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Fallback to key if not found
            }
        }

        if (typeof value !== 'string') return key;

        if (params) {
            Object.keys(params).forEach(param => {
                value = value.replace(`{${param}}`, params[param]);
            });
        }

        return value;
    };

    // Update HTML dir attribute and font
    useEffect(() => {
        document.documentElement.dir = direction;
        document.documentElement.lang = language;

        // Apply Cairo font for Arabic
        if (language === 'ar') {
            document.body.classList.add('font-cairo');
        } else {
            document.body.classList.remove('font-cairo');
        }
    }, [direction, language]);

    return (
        <LanguageContext.Provider value={{ language, dictionary, toggleLanguage, direction, t }}>
            <div key={language} className="animate-lang-switch">
                {children}
            </div>
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
