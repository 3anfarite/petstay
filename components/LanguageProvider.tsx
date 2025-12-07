import i18n from '@/i18n';
import React, { createContext, useContext, useState } from 'react';

type LanguageContextType = {
    locale: string;
    setLocale: (locale: string) => void;
};

const LanguageContext = createContext<LanguageContextType>({
    locale: i18n.locale,
    setLocale: () => { },
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [locale, setLocaleState] = useState(i18n.locale);

    const setLocale = (newLocale: string) => {
        i18n.locale = newLocale;
        setLocaleState(newLocale);
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale }}>
            {children}
        </LanguageContext.Provider>
    );
};
