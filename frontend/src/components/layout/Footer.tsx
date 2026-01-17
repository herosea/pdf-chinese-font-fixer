import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Mail } from 'lucide-react';

export default function Footer() {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-white">PDF Font Fixer</span>
                                <span className="text-xs text-gray-500 block">worktool.dev</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4 max-w-md">
                            {t('footer.tagline')}
                        </p>
                        <a
                            href="mailto:support@worktool.dev"
                            className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            support@worktool.dev
                        </a>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">{t('footer.legal')}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    {t('nav.terms')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    {t('nav.privacy')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/refund" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    {t('nav.refund')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">{t('footer.support')}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    {t('nav.contact')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    {t('nav.pricing')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-gray-800">
                    <p className="text-sm text-gray-500 text-center">
                        {t('footer.copyright').replace('2026', String(currentYear))}
                    </p>
                </div>
            </div>
        </footer>
    );
}
