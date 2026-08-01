import React, { createContext, useContext, useEffect, useState } from 'react';
import { appUsers } from '../utils/mockData';

export type FontSize = 'small' | 'medium' | 'large';
export type FontWeight = 'normal' | 'semibold' | 'bold';
export type Theme = 'light' | 'dark';

interface SettingsContextValue {
    theme: Theme;
    fontSize: FontSize;
    fontWeight: FontWeight;
    highContrast: boolean;
    setTheme: (t: Theme) => void;
    setFontSize: (s: FontSize) => void;
    setFontWeight: (w: FontWeight) => void;
    setHighContrast: (v: boolean) => void;
    changePassword: (username: string, oldPass: string, newPass: string) => string | null;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const fontSizeValues: Record<FontSize, string> = {
    small:  '16px',
    medium: '22px',
    large:  '28px',
};

const fontWeightClasses: Record<FontWeight, string> = {
    normal:  'app-weight-normal',
    semibold:'app-weight-semibold',
    bold:    'app-weight-bold',
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(
        () => (localStorage.getItem('cfg_theme') as Theme) ?? 'light'
    );
    const [fontSize, setFontSizeState] = useState<FontSize>(
        () => (localStorage.getItem('cfg_fontSize') as FontSize) ?? 'medium'
    );
    const [fontWeight, setFontWeightState] = useState<FontWeight>(
        () => (localStorage.getItem('cfg_fontWeight') as FontWeight) ?? 'normal'
    );
    const [highContrast, setHighContrastState] = useState<boolean>(
        () => localStorage.getItem('cfg_highContrast') === 'true'
    );

    useEffect(() => {
        const html = document.documentElement;
        html.classList.toggle('dark', theme === 'dark');
        html.classList.toggle('high-contrast', highContrast);
        // Font size: cambia la base rem del html (escala todo lo que usa rem)
        html.style.fontSize = fontSizeValues[fontSize];
        // Font weight: clase en html para overrides CSS
        Object.values(fontWeightClasses).forEach(c => html.classList.remove(c));
        html.classList.add(fontWeightClasses[fontWeight]);
    }, [theme, fontSize, fontWeight, highContrast]);

    const setTheme = (t: Theme) => { localStorage.setItem('cfg_theme', t); setThemeState(t); };
    const setFontSize = (s: FontSize) => { localStorage.setItem('cfg_fontSize', s); setFontSizeState(s); };
    const setFontWeight = (w: FontWeight) => { localStorage.setItem('cfg_fontWeight', w); setFontWeightState(w); };
    const setHighContrast = (v: boolean) => { localStorage.setItem('cfg_highContrast', String(v)); setHighContrastState(v); };

    const changePassword = (username: string, oldPass: string, newPass: string): string | null => {
        const user = appUsers.find(u => u.username === username);
        if (!user) return 'Usuario no encontrado.';
        if (user.password !== oldPass) return 'La contraseña actual es incorrecta.';
        if (newPass.trim().length < 4) return 'La nueva contraseña debe tener al menos 4 caracteres.';
        user.password = newPass;
        return null;
    };

    return (
        <SettingsContext.Provider value={{
            theme, fontSize, fontWeight, highContrast,
            setTheme, setFontSize, setFontWeight, setHighContrast,
            changePassword,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
    return ctx;
};
