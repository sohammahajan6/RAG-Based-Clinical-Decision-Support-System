import React, { useState, useEffect } from "react";
import Helmet from './Helemt/Helmet';
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signInWithEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "An error occurred during login.");
      }

      // Call the onLogin prop with the token
      onLogin(data.access_token);

      setLoading(false);
      toast.success("Login successful!");
      navigate('/dashboard');
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google";
  };

  return (
    <Helmet title='Login'>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">AIsculapius</h1>
            <p className="text-slate-500 mt-1">Clinical Decision Support System</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-600 text-sm">Signing you in...</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-800 mb-1">Welcome back</h2>
                <p className="text-slate-500 text-sm mb-6">Sign in to your account</p>

                <form onSubmit={signInWithEmail}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium"
                  >
                    Sign In
                  </button>

                  <div className="mt-5">
                    <div className="relative flex items-center py-3">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-3 text-slate-400 text-xs uppercase">Or continue with</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full bg-white text-slate-700 py-2.5 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google Logo"
                        className="w-4 h-4"
                      />
                      Google
                    </button>
                  </div>

                  <p className="mt-5 text-slate-500 text-center text-sm">
                    Don't have an account?{' '}
                    <Link to='/register' className="text-blue-600 hover:text-blue-700 font-medium">
                      Sign Up
                    </Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </Helmet>
  );
};

export default Login;