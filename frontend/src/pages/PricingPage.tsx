import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

export default function PricingPage() {
    const { t } = useTranslation();

    const packages = [
        { pages: 10, price: 4.5, discount: 10 },
        { pages: 50, price: 20, discount: 20, popular: true },
        { pages: 200, price: 70, discount: 30 },
    ];

    return (
        <div className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
                        {t('pricing.title')}
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        {t('pricing.subtitle')}
                    </p>
                </div>

                {/* Main Pricing Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                    {/* Free Trial */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{t('pricing.free.title')}</h2>
                                <p className="text-sm text-gray-600">No credit card required</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <span className="text-5xl font-black text-gray-900">$0</span>
                        </div>
                        <p className="text-gray-600 mb-6">{t('pricing.free.description')}</p>
                        <Link
                            to="/app"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            {t('pricing.free.cta')}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    {/* Pay as you go */}
                    <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 text-white shadow-2xl shadow-primary-200">
                        <div className="absolute -top-4 right-8 px-4 py-1.5 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-full shadow-lg">
                            Most Popular
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{t('pricing.payg.title')}</h2>
                                <p className="text-sm text-primary-200">Simple usage-based billing</p>
                            </div>
                        </div>
                        <div className="mb-2">
                            <span className="text-5xl font-black">{t('pricing.payg.price')}</span>
                            <span className="text-xl text-primary-200 ml-2">/ page</span>
                        </div>
                        <p className="text-primary-200 text-sm mb-6">≈ ¥3.5 per page</p>
                        <ul className="space-y-3 mb-6">
                            {(t('pricing.payg.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm">
                                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <Link
                            to="/app"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-primary-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            {t('pricing.payg.cta')}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Bulk Packages */}
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t('pricing.bulk.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {packages.map((pkg) => (
                            <div
                                key={pkg.pages}
                                className={`relative bg-white rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${pkg.popular ? 'border-primary-500 shadow-lg' : 'border-gray-200'
                                    }`}
                            >
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-full">
                                        Best Value
                                    </div>
                                )}
                                <div className="text-center">
                                    <div className="text-3xl font-black text-gray-900 mb-1">{pkg.pages}</div>
                                    <div className="text-sm text-gray-500 mb-4">pages</div>
                                    <div className="text-2xl font-bold text-primary-600 mb-1">${pkg.price}</div>
                                    <div className="text-sm text-green-600 font-medium mb-4">Save {pkg.discount}%</div>
                                    <div className="text-xs text-gray-500 mb-4">
                                        ${(pkg.price / pkg.pages).toFixed(2)} per page
                                    </div>
                                    <Link
                                        to="/app"
                                        className={`block w-full py-3 font-semibold rounded-xl transition-colors ${pkg.popular
                                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                    >
                                        Buy Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
