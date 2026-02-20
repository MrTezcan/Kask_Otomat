'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/translations';

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('tr');

    useEffect(() => {
        const savedLang = localStorage.getItem('app_language') as Language;
        if (savedLang && (savedLang === 'tr' || savedLang === 'en')) {
            setLanguageState(savedLang);
        } else {
            // Default to Turkish or browser language
            const browserLang = navigator.language.split('-')[0];
            if (browserLang === 'en') setLanguageState('en');
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app_language', lang);
    };

    const t = (key: string) => {
        const keys = key.split('.');
        let result: any = translations[language];

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                // Fallback to Turkish if key is missing in chosen language
                let fallback: any = translations['tr'];
                for (const fk of keys) {
                    if (fallback && fallback[fk]) fallback = fallback[fk];
                    else break;
                }
                return typeof fallback === 'string' ? fallback : key;
            }
        }

        return typeof result === 'string' ? result : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
