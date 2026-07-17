/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#00A8E8',
                    50: '#E6F7FF',
                    100: '#B3E5FF',
                    200: '#80D3FF',
                    300: '#4DC1FF',
                    400: '#1AAFFF',
                    500: '#00A8E8',
                    600: '#0086BA',
                    700: '#00648C',
                    800: '#00425E',
                    900: '#002030',
                },
                accent: {
                    red: '#E63946',
                    gray: '#F8F9FA',
                    dark: '#1A1A1A',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 2px 10px rgba(0, 168, 232, 0.12), 0 1px 3px rgba(0, 100, 140, 0.06)',
                'card-hover': '0 8px 26px rgba(0, 168, 232, 0.18), 0 2px 6px rgba(0, 100, 140, 0.08)',
                'float': '0 4px 22px rgba(0, 168, 232, 0.14)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeDown: {
                    '0%': { opacity: '0', transform: 'translateY(-12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                blobFloat: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(20px, -20px) scale(1.08)' },
                    '66%': { transform: 'translate(-15px, 15px) scale(0.95)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '20%': { transform: 'translateX(-6px)' },
                    '40%': { transform: 'translateX(6px)' },
                    '60%': { transform: 'translateX(-4px)' },
                    '80%': { transform: 'translateX(4px)' },
                },
                popIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9) rotate(-8deg)' },
                    '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
                },
                logoFloat: {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '25%': { transform: 'translateY(-8px) rotate(-4deg)' },
                    '50%': { transform: 'translateY(0) rotate(0deg)' },
                    '75%': { transform: 'translateY(-4px) rotate(4deg)' },
                },
                glowPulse: {
                    '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
                    '50%': { opacity: '0.9', transform: 'scale(1.12)' },
                },
            },
            animation: {
                fadeIn: 'fadeIn 0.5s ease-out both',
                fadeDown: 'fadeDown 0.5s ease-out both',
                blobFloat: 'blobFloat 10s ease-in-out infinite',
                shake: 'shake 0.4s ease-in-out',
                popIn: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
                logoFloat: 'logoFloat 3.5s ease-in-out infinite',
                glowPulse: 'glowPulse 2.5s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
