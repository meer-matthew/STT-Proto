import React, { createContext, useContext, ReactNode } from 'react';

export type Theme = {
    colors: {
        primary: string;
        primaryDark: string;
        primaryLight: string;
        secondary: string;
        background: string;
        backgroundGradient: string[];
        surface: string;
        text: string;
        textSecondary: string;
        border: string;
        borderLight: string;
        error: string;
        errorLight: string;
        warning: string;
        success: string;
        white: string;
        black: string;
        disabled: string;
        disabledBorder: string;
    };
    spacing: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
    };
    fontSize: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        xxl: number;
    };
    borderRadius: {
        sm: number;
        md: number;
        lg: number;
        xl: number;
        round: number;
    };
    borderWidth: {
        thin: number;
        medium: number;
        thick: number;
    };
    fonts: {
        regular: string;
        medium: string;
        bold: string;
        light: string;
    };
};

const defaultTheme: Theme = {
    colors: {
        primary: '#6661ff',
        primaryDark: '#5551dd',
        primaryLight: '#8885ff',
        secondary: '#5a6470',
        background: '#fff',
        backgroundGradient: ['#f8f9ff', '#fff5f7'],
        surface: '#f5f5f5',
        text: '#000',
        textSecondary: '#555',
        border: '#d0d0d0',
        borderLight: '#e0e0e0',
        error: '#e74c3c',
        errorLight: '#ffe5e5',
        warning: '#f39c12',
        success: '#27ae60',
        white: '#fff',
        black: '#000',
        disabled: '#ccc',
        disabledBorder: '#aaa',
    },
    spacing: {
        xs: 8,
        sm: 12,
        md: 16,
        lg: 20,
        xl: 24,
    },
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        round: 28,
    },
    borderWidth: {
        thin: 1,
        medium: 2,
        thick: 3,
    },
    fonts: {
        regular: 'Segoe UI, system-ui, -apple-system, Roboto, sans-serif',
        medium: 'Segoe UI, system-ui, -apple-system, Roboto, sans-serif',
        bold: 'Segoe UI, system-ui, -apple-system, Roboto, sans-serif',
        light: 'Segoe UI, system-ui, -apple-system, Roboto, sans-serif',
    },
};

const ThemeContext = createContext<Theme>(defaultTheme);

type ThemeProviderProps = {
    children: ReactNode;
    theme?: Theme;
};

export function ThemeProvider({ children, theme = defaultTheme }: ThemeProviderProps) {
    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): Theme {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
