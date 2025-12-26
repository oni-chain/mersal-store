"use client";
import React, { useEffect, useState } from 'react';
import { ShoppingCart, Menu, Globe } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { items, toggleCart } = useCartStore();
    const { t, toggleLanguage, language } = useLanguage();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0 cursor-pointer">
                        <span className="text-3xl font-bold tracking-tighter text-white font-cairo">
                            {t('hero.title')}<span className="text-secondary">.</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {/* Links removed as requested */}
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleLanguage}
                            className="text-gray-300 hover:text-white transition-colors text-sm font-bold flex items-center gap-1"
                        >
                            <Globe className="w-4 h-4" />
                            {language === 'en' ? 'AR' : 'EN'}
                        </button>

                        <button
                            onClick={toggleCart}
                            className="relative p-2 text-gray-300 hover:text-white transition-colors"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-primary text-white text-xs font-bold rounded-full">
                                    {itemCount}
                                </span>
                            )}
                        </button>

                        <div className="md:hidden">
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:text-secondary transition-colors">
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div id="mobile-menu" className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 absolute top-20 left-0 right-0 p-4 shadow-xl`}>
                <div className="flex flex-col space-y-4 font-bold text-center">
                    {/* Links removed as requested */}
                    <button onClick={toggleCart} className="py-2 text-red-600 uppercase tracking-widest text-sm border border-red-900 rounded-lg bg-red-900/10">
                        {t('nav.cart')} ({itemCount})
                    </button>
                </div>
            </div>
        </nav>
    );
}
