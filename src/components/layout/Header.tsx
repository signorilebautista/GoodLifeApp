import React from 'react';
import logo from '../../assets/logo.png';

export const Header: React.FC = () => {
    return (
        <header className="bg-primary h-16 flex items-center px-6 shadow-md">
            <div className="flex items-center gap-4">
                <img src={logo} alt="Good Life Center" className="h-10 w-10" />
                <h1 className="text-white text-xl font-semibold tracking-wide">
                    GOOD LIFE CENTER
                </h1>
            </div>
        </header>
    );
};
