import { useGoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/services/api';
import { useState } from 'react';

interface LoginButtonProps {
    onLoginSuccess?: (user: any) => void;
    className?: string;
}

export default function LoginButton({ onLoginSuccess, className }: LoginButtonProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const login = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            setIsLoading(true);
            try {
                const user = await authApi.googleLogin(codeResponse.code);
                if (onLoginSuccess) {
                    onLoginSuccess(user);
                }
            } catch (error) {
                console.error('Login failed:', error);
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            console.error('Login Failed');
            setIsLoading(false);
        },
        flow: 'auth-code',
    });

    return (
        <button
            onClick={() => login()}
            disabled={isLoading}
            className={className || "px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"}
        >
            {isLoading ? '...' : t('common.login', 'Login')}
        </button>
    );
}
