import { useTranslation } from 'react-i18next';
import { Mail, MessageCircle, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { contactApi } from '../services/api';

export default function ContactPage() {
    const { t, i18n } = useTranslation();
    const isZh = i18n.language === 'zh';
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await contactApi.submitMessage(formData);
            setSuccess(true);
            setFormData({ email: '', subject: '', message: '' });
        } catch (err: any) {
            console.error(err);
            setError(isZh ? '发送失败，请稍后重试' : 'Failed to send message. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-16 lg:py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-gray-900 mb-4">{t('contact.title')}</h1>
                    <p className="text-xl text-gray-600">{t('contact.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Email Card */}
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Email</h2>
                        <a
                            href="mailto:support@worktool.dev"
                            className="text-primary-600 font-medium text-lg hover:text-primary-700 transition-colors"
                        >
                            support@worktool.dev
                        </a>
                    </div>

                    {/* Response Time Card */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {isZh ? '响应时间' : 'Response Time'}
                        </h2>
                        <p className="text-green-700 font-medium text-lg">
                            {isZh ? '24 小时内回复' : 'Within 24 hours'}
                        </p>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <MessageCircle className="w-6 h-6 text-primary-600" />
                        {isZh ? '发送消息' : 'Send a Message'}
                    </h2>

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            {isZh ? '消息已发送，我们会尽快回复您！' : 'Message sent successfully! We will get back to you soon.'}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isZh ? '您的邮箱' : 'Your Email'}
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none transition-all"
                                placeholder={isZh ? '输入您的邮箱地址' : 'Enter your email address'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isZh ? '主题' : 'Subject'}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none transition-all"
                                placeholder={isZh ? '简要描述您的问题' : 'Brief description of your issue'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isZh ? '消息内容' : 'Message'}
                            </label>
                            <textarea
                                rows={5}
                                required
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none transition-all resize-none"
                                placeholder={isZh ? '详细描述您遇到的问题或疑问...' : 'Describe your issue or question in detail...'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            {isZh ? (loading ? '正在发送...' : '发送消息') : (loading ? 'Sending...' : 'Send Message')}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        {t('contact.description')}
                    </p>
                </div>
            </div>
        </div>
    );
}
