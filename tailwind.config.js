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
                'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
                'card-hover': '0 4px 16px rgba(0, 0, 0, 0.15)',
            },
        },
    },
    plugins: [],
}
