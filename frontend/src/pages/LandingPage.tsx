import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, FileText, Image, Clock, Check, Sparkles } from 'lucide-react';

export default function LandingPage() {
    const { t } = useTranslation();

    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative gradient-hero text-white py-20 lg:py-32">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-8 border border-white/20">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            {t('hero.badge')}
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                            {t('hero.title')}{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                {t('hero.titleHighlight')}
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            {t('hero.subtitle')}
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/app"
                                className="group flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                            >
                                {t('hero.cta')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/pricing"
                                className="flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                            >
                                {t('hero.ctaSecondary')}
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                            <div className="text-center">
                                <div className="text-3xl font-black">10K+</div>
                                <div className="text-sm text-gray-400">{t('hero.stats.pages')}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black">500+</div>
                                <div className="text-sm text-gray-400">{t('hero.stats.users')}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black">4K</div>
                                <div className="text-sm text-gray-400">{t('hero.stats.quality')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 lg:py-32 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
                            {t('features.title')}
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            {t('features.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Zap, key: 'ai', color: 'from-blue-500 to-cyan-500' },
                            { icon: Image, key: 'quality', color: 'from-purple-500 to-pink-500' },
                            { icon: FileText, key: 'formats', color: 'from-orange-500 to-red-500' },
                            { icon: Clock, key: 'fast', color: 'from-green-500 to-emerald-500' },
                        ].map(({ icon: Icon, key, color }) => (
                            <div
                                key={key}
                                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
                            >
                                <div className={`w-12 h-12 bg-gradient-to-tr ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">
                                    {t(`features.items.${key}.title`)}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {t(`features.items.${key}.description`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Preview Section */}
            <section className="py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
                            {t('pricing.title')}
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            {t('pricing.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free Trial */}
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('pricing.free.title')}</h3>
                                <div className="text-4xl font-black text-gray-900 mb-2">$0</div>
                                <p className="text-gray-600 mb-6">{t('pricing.free.description')}</p>
                                <Link
                                    to="/app"
                                    className="block w-full py-3 px-6 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    {t('pricing.free.cta')}
                                </Link>
                            </div>
                        </div>

                        {/* Pay as you go */}
                        <div className="relative bg-white rounded-2xl p-8 border-2 border-primary-500 shadow-xl scale-105">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 text-white text-sm font-bold rounded-full">
                                Most Popular
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('pricing.payg.title')}</h3>
                                <div className="text-4xl font-black text-primary-600 mb-1">{t('pricing.payg.price')}</div>
                                <p className="text-gray-600 mb-6">{t('pricing.payg.unit')}</p>
                                <ul className="space-y-3 mb-6 text-left">
                                    {(t('pricing.payg.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/app"
                                    className="block w-full py-3 px-6 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
                                >
                                    {t('pricing.payg.cta')}
                                </Link>
                            </div>
                        </div>

                        {/* Bulk */}
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('pricing.bulk.title')}</h3>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>10 pages</span>
                                        <span className="font-bold">$4.50 <span className="text-green-600 text-xs">(-10%)</span></span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-medium text-primary-600">
                                        <span>50 pages</span>
                                        <span className="font-bold">$20 <span className="text-green-600 text-xs">(-20%)</span></span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>200 pages</span>
                                        <span className="font-bold">$70 <span className="text-green-600 text-xs">(-30%)</span></span>
                                    </div>
                                </div>
                                <Link
                                    to="/pricing"
                                    className="block w-full py-3 px-6 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    {t('common.learnMore')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
