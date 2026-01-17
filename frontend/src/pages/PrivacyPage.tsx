import { useTranslation } from 'react-i18next';

export default function PrivacyPage() {
    const { t, i18n } = useTranslation();
    const isZh = i18n.language === 'zh';

    return (
        <div className="py-16 lg:py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-black text-gray-900 mb-4">{t('privacy.title')}</h1>
                <p className="text-gray-500 mb-8">{t('privacy.lastUpdated')}</p>

                <div className="prose prose-gray max-w-none">
                    {isZh ? (
                        <>
                            <h2>1. 信息收集</h2>
                            <p>我们收集以下类型的信息：</p>
                            <ul>
                                <li><strong>账户信息</strong>：通过 Google OAuth 登录时，我们收集您的电子邮件地址和姓名</li>
                                <li><strong>使用数据</strong>：处理的页面数量、购买记录</li>
                                <li><strong>上传内容</strong>：您上传的 PDF 文件（仅用于处理）</li>
                            </ul>

                            <h2>2. 信息使用</h2>
                            <p>我们使用收集的信息用于：</p>
                            <ul>
                                <li>提供和维护服务</li>
                                <li>处理付款和管理账户</li>
                                <li>发送服务相关通知</li>
                                <li>改进服务质量</li>
                            </ul>

                            <h2>3. 数据存储</h2>
                            <p>您上传的文件在处理完成后会在 24 小时内从我们的服务器删除。我们不会永久存储您的文档内容。</p>

                            <h2>4. 第三方服务</h2>
                            <p>我们使用以下第三方服务：</p>
                            <ul>
                                <li><strong>Google Gemini AI</strong>：用于图像处理</li>
                                <li><strong>Lemon Squeezy</strong>：用于支付处理</li>
                                <li><strong>Google OAuth</strong>：用于用户认证</li>
                            </ul>

                            <h2>5. 数据安全</h2>
                            <p>我们采用行业标准的安全措施保护您的数据，包括 HTTPS 加密传输和安全的数据存储。</p>

                            <h2>6. Cookie 使用</h2>
                            <p>我们使用 Cookie 来维护登录状态和保存用户偏好设置。</p>

                            <h2>7. 您的权利</h2>
                            <p>您有权：</p>
                            <ul>
                                <li>访问您的个人数据</li>
                                <li>要求删除您的账户和数据</li>
                                <li>撤回同意</li>
                            </ul>

                            <h2>8. 联系我们</h2>
                            <p>如对隐私政策有任何疑问，请联系：support@worktool.dev</p>
                        </>
                    ) : (
                        <>
                            <h2>1. Information We Collect</h2>
                            <p>We collect the following types of information:</p>
                            <ul>
                                <li><strong>Account Information</strong>: Your email address and name when logging in via Google OAuth</li>
                                <li><strong>Usage Data</strong>: Number of pages processed, purchase history</li>
                                <li><strong>Uploaded Content</strong>: PDF files you upload (for processing only)</li>
                            </ul>

                            <h2>2. How We Use Information</h2>
                            <p>We use the collected information to:</p>
                            <ul>
                                <li>Provide and maintain the Service</li>
                                <li>Process payments and manage accounts</li>
                                <li>Send service-related notifications</li>
                                <li>Improve service quality</li>
                            </ul>

                            <h2>3. Data Storage</h2>
                            <p>Files you upload are deleted from our servers within 24 hours after processing. We do not permanently store your document content.</p>

                            <h2>4. Third-Party Services</h2>
                            <p>We use the following third-party services:</p>
                            <ul>
                                <li><strong>Google Gemini AI</strong>: For image processing</li>
                                <li><strong>Lemon Squeezy</strong>: For payment processing</li>
                                <li><strong>Google OAuth</strong>: For user authentication</li>
                            </ul>

                            <h2>5. Data Security</h2>
                            <p>We employ industry-standard security measures to protect your data, including HTTPS encryption and secure data storage.</p>

                            <h2>6. Cookie Usage</h2>
                            <p>We use cookies to maintain login status and save user preferences.</p>

                            <h2>7. Your Rights</h2>
                            <p>You have the right to:</p>
                            <ul>
                                <li>Access your personal data</li>
                                <li>Request deletion of your account and data</li>
                                <li>Withdraw consent</li>
                            </ul>

                            <h2>8. Contact Us</h2>
                            <p>For any privacy-related questions, please contact: support@worktool.dev</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
