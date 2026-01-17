import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, Sparkles } from 'lucide-react';

export default function Header() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <span className="font-bold text-gray-900">PDF Font Fixer</span>
                            <span className="text-xs text-gray-500 block -mt-0.5">by worktool.dev</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            to="/"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/') ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {t('nav.home')}
                        </Link>
                        <Link
                            to="/pricing"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/pricing') ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {t('nav.pricing')}
                        </Link>
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="hidden sm:inline">{i18n.language === 'en' ? '中文' : 'EN'}</span>
                        </button>

                        {/* CTA Button */}
                        <Link
                            to="/app"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-primary-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {t('nav.app')}
                        </Link>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
                        <nav className="flex flex-col gap-1">
                            <Link
                                to="/"
                                onClick={() => setIsMenuOpen(false)}
                                className={`px-4 py-3 rounded-lg text-sm font-medium ${isActive('/') ? 'bg-primary-50 text-primary-600' : 'text-gray-600'
                                    }`}
                            >
                                {t('nav.home')}
                            </Link>
                            <Link
                                to="/pricing"
                                onClick={() => setIsMenuOpen(false)}
                                className={`px-4 py-3 rounded-lg text-sm font-medium ${isActive('/pricing') ? 'bg-primary-50 text-primary-600' : 'text-gray-600'
                                    }`}
                            >
                                {t('nav.pricing')}
                            </Link>
                            <Link
                                to="/app"
                                onClick={() => setIsMenuOpen(false)}
                                className="mt-2 px-4 py-3 bg-primary-600 text-white text-sm font-semibold rounded-lg text-center"
                            >
                                {t('nav.app')}
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
