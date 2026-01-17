import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Clock, Mail } from 'lucide-react';

export default function RefundPage() {
    const { t, i18n } = useTranslation();
    const isZh = i18n.language === 'zh';

    return (
        <div className="py-16 lg:py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-black text-gray-900 mb-4">{t('refund.title')}</h1>
                <p className="text-gray-500 mb-8">{t('refund.lastUpdated')}</p>

                <div className="space-y-8">
                    {/* Introduction */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                        <p className="text-blue-800">
                            {t('refund.content.intro')}
                        </p>
                    </div>

                    {/* Used Credits - Non-refundable */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    {t('refund.content.used.title')}
                                </h2>
                                <p className="text-gray-600">
                                    {t('refund.content.used.description')}
                                </p>
                                <div className="mt-4 bg-red-50 rounded-lg p-4">
                                    <p className="text-sm text-red-700 font-medium">
                                        {isZh
                                            ? '⚠️ 已使用积分（已处理的页面）不可退款'
                                            : '⚠️ Used credits (processed pages) are non-refundable'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Unused Balance - Refundable */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    {t('refund.content.unused.title')}
                                </h2>
                                <p className="text-gray-600">
                                    {t('refund.content.unused.description')}
                                </p>
                                <div className="mt-4 bg-green-50 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-green-700">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium">
                                            {isZh ? '7 天退款期限' : '7-day refund window'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-green-700">
                                        {isZh
                                            ? '• 退款金额 = 未使用余额 - 支付网关手续费（约 3-5%）'
                                            : '• Refund amount = Unused balance - Payment gateway fees (~3-5%)'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* How to Request */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Mail className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    {t('refund.content.howTo.title')}
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    {t('refund.content.howTo.description')}
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-700 mb-2">
                                        {isZh ? '请在邮件中包含以下信息：' : 'Please include in your email:'}
                                    </p>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• {isZh ? '您的账户邮箱' : 'Your account email'}</li>
                                        <li>• {isZh ? '购买日期' : 'Purchase date'}</li>
                                        <li>• {isZh ? '退款原因（可选）' : 'Reason for refund (optional)'}</li>
                                    </ul>
                                </div>
                                <a
                                    href="mailto:support@worktool.dev?subject=Refund Request"
                                    className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                    {isZh ? '发送退款请求' : 'Send Refund Request'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
