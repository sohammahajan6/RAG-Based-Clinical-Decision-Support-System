import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

interface GoogleCallbackProps {
    onLogin: (token: string) => void;
}

const GoogleCallback: React.FC<GoogleCallbackProps> = ({ onLogin }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const token = searchParams.get('access_token');
                if (!token) {
                    throw new Error('No token received');
                }

                await onLogin(token);
                toast.success('Successfully logged in with Google!');
                navigate('/dashboard');
            } catch (error) {
                console.error('Google login error:', error);
                toast.error('Failed to log in with Google');
                navigate('/login');
            }
        };

        handleCallback();
    }, [searchParams, navigate, onLogin]);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-white text-xl">
                Processing Google login...
            </div>
        </div>
    );
};

export default GoogleCallback;