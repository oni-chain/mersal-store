"use client";
import React, { useEffect, useState } from 'react';
import { ShoppingCart, Menu, Globe, Facebook, Instagram } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { SOCIAL_LINKS } from '@/lib/constants';

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

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
                    <Link href="/" className="flex-shrink-0 cursor-pointer">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tighter text-white font-cairo">
                            {t('hero.title')}<span className="text-secondary">.</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {/* Links removed as requested */}
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden md:flex items-center gap-4">
                            <a 
                                href={SOCIAL_LINKS.facebook} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-[#1877F2] transition-all duration-300 hover:scale-110"
                                title={t('nav.facebook')}
                            >
                                <Facebook className="w-6 h-6" />
                            </a>
                            <a 
                                href={SOCIAL_LINKS.instagram} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-[#E4405F] transition-all duration-300 hover:scale-110"
                                title={t('nav.instagram')}
                            >
                                <Instagram className="w-6 h-6" />
                            </a>
                            <a 
                                href={SOCIAL_LINKS.tiktok} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                                title={t('nav.tiktok')}
                            >
                                <TikTokIcon className="w-6 h-6" />
                            </a>
                        </div>

                        <button
                            onClick={toggleLanguage}
                            className="text-gray-300 hover:text-white transition-colors text-xs md:text-sm font-bold flex items-center gap-1"
                        >
                            <Globe className="w-4 h-4" />
                            {language === 'en' ? 'AR' : 'EN'}
                        </button>

                        <button
                            onClick={toggleCart}
                            className="relative p-2 text-gray-300 hover:text-white transition-colors"
                        >
                            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-primary text-white text-[10px] md:text-xs font-bold rounded-full">
                                    {itemCount}
                                </span>
                            )}
                        </button>

                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                            className="md:hidden flex items-center gap-2 text-white hover:text-secondary transition-all bg-white/10 border-2 border-white/20 px-4 py-2 rounded-full active:scale-95 active:bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        >
                            <Menu className="w-5 h-5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t('nav.socialLinks')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div id="mobile-menu" className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 absolute top-20 left-0 right-0 p-4 shadow-xl`}>
                <div className="flex flex-col space-y-4 font-bold text-center">
                    {/* Links removed as requested */}
                    <div className="grid grid-cols-3 gap-2">
                        <a 
                            href={SOCIAL_LINKS.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:bg-[#1877F2]/10 active:text-[#1877F2] transition-colors"
                        >
                            <Facebook className="w-7 h-7" />
                            <span className="text-[10px] font-bold">{t('nav.facebook')}</span>
                        </a>
                        <a 
                            href={SOCIAL_LINKS.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:bg-[#E4405F]/10 active:text-[#E4405F] transition-colors"
                        >
                            <Instagram className="w-7 h-7" />
                            <span className="text-[10px] font-bold">{t('nav.instagram')}</span>
                        </a>
                        <a 
                            href={SOCIAL_LINKS.tiktok} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:bg-white/10 active:text-white transition-colors"
                        >
                            <TikTokIcon className="w-7 h-7" />
                            <span className="text-[10px] font-bold">{t('nav.tiktok')}</span>
                        </a>
                    </div>
                    <button onClick={toggleCart} className="py-2 text-red-600 uppercase tracking-widest text-sm border border-red-900 rounded-lg bg-red-900/10">
                        {t('nav.cart')} ({itemCount})
                    </button>
                </div>
            </div>
        </nav>
    );
}
