import React from 'react';
import logo from '../assets/logo.png';

const LoadingScreen: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden animate-fadeIn">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-400/30 rounded-full blur-3xl animate-blobFloat" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-blobFloat [animation-delay:2s]" />

            <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary-300/50 blur-xl animate-glowPulse" />
                    <img
                        src={logo}
                        alt="Good Life Center"
                        className="relative h-24 w-24 rounded-full shadow-lg ring-4 ring-white/30 animate-logoFloat"
                    />
                </div>

                <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-white animate-bounce [animation-delay:0ms]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white animate-bounce [animation-delay:150ms]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white animate-bounce [animation-delay:300ms]" />
                    </div>
                    <p className="text-white/80 text-sm tracking-wide">Preparando todo para vos...</p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
