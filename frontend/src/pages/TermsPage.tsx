import { useTranslation } from 'react-i18next';

export default function TermsPage() {
    const { t, i18n } = useTranslation();
    const isZh = i18n.language === 'zh';

    return (
        <div className="py-16 lg:py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-black text-gray-900 mb-4">{t('terms.title')}</h1>
                <p className="text-gray-500 mb-8">{t('terms.lastUpdated')}</p>

                <div className="prose prose-gray max-w-none">
                    {isZh ? (
                        <>
                            <h2>1. 接受条款</h2>
                            <p>通过访问和使用 worktool.dev（以下简称"本服务"），您同意受这些服务条款的约束。如果您不同意这些条款，请不要使用本服务。</p>

                            <h2>2. 服务描述</h2>
                            <p>本服务提供基于 AI 的 PDF 中文字体修复功能。我们使用 Google Gemini AI 技术处理和优化您上传的 PDF 文档中的中文字符。</p>

                            <h2>3. 用户账户</h2>
                            <p>您可以通过 Google 账户登录使用本服务。您有责任保护您的账户安全，并对账户下的所有活动负责。</p>

                            <h2>4. 付款和退款</h2>
                            <p>本服务采用按量付费模式，每页收费 $0.50。新用户可免费试用 1 页。已使用的积分不可退款。未使用的余额可在购买后 7 天内申请退款（扣除手续费）。</p>

                            <h2>5. 知识产权</h2>
                            <p>您上传的文档仍归您所有。处理后的输出文件属于您的财产。我们不会保留或使用您上传的内容用于除服务目的以外的任何用途。</p>

                            <h2>6. 使用限制</h2>
                            <p>您同意不会：</p>
                            <ul>
                                <li>上传违法内容</li>
                                <li>滥用或试图破坏服务</li>
                                <li>转售或重新分发服务</li>
                            </ul>

                            <h2>7. 免责声明</h2>
                            <p>本服务按"现状"提供，不提供任何形式的保证。我们不保证服务的准确性、可靠性或持续可用性。</p>

                            <h2>8. 责任限制</h2>
                            <p>在法律允许的最大范围内，我们对因使用本服务而导致的任何损失不承担责任。</p>

                            <h2>9. 条款变更</h2>
                            <p>我们保留随时修改这些条款的权利。重大更改将通过电子邮件或网站公告通知。</p>

                            <h2>10. 联系我们</h2>
                            <p>如有任何问题，请联系：support@worktool.dev</p>
                        </>
                    ) : (
                        <>
                            <h2>1. Acceptance of Terms</h2>
                            <p>By accessing and using worktool.dev (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>

                            <h2>2. Description of Service</h2>
                            <p>The Service provides AI-powered PDF Chinese font repair capabilities. We use Google Gemini AI technology to process and optimize Chinese characters in your uploaded PDF documents.</p>

                            <h2>3. User Accounts</h2>
                            <p>You may log in using your Google account. You are responsible for maintaining the security of your account and are liable for all activities under your account.</p>

                            <h2>4. Payment and Refunds</h2>
                            <p>The Service uses a pay-per-page model at $0.50 per page. New users get 1 free page. Used credits are non-refundable. Unused balance can be refunded within 7 days of purchase (minus processing fees).</p>

                            <h2>5. Intellectual Property</h2>
                            <p>Documents you upload remain your property. Processed output files are your property. We do not retain or use your uploaded content for any purpose other than providing the Service.</p>

                            <h2>6. Prohibited Uses</h2>
                            <p>You agree not to:</p>
                            <ul>
                                <li>Upload illegal content</li>
                                <li>Abuse or attempt to disrupt the Service</li>
                                <li>Resell or redistribute the Service</li>
                            </ul>

                            <h2>7. Disclaimer</h2>
                            <p>The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, reliability, or continuous availability of the Service.</p>

                            <h2>8. Limitation of Liability</h2>
                            <p>To the maximum extent permitted by law, we shall not be liable for any damages arising from the use of this Service.</p>

                            <h2>9. Changes to Terms</h2>
                            <p>We reserve the right to modify these terms at any time. Significant changes will be notified via email or website announcement.</p>

                            <h2>10. Contact Us</h2>
                            <p>For any questions, please contact: support@worktool.dev</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
