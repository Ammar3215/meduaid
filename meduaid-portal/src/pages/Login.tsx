import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormInputs) => {
    setAuthError('');
    const success = await login(data.email, data.password);
    if (!success) {
      setAuthError('Invalid credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-accent-light">
      <div className="flex flex-col items-center w-full">
        <img src="/meduaid-logo.svg" alt="MeduAid Logo" className="h-24 mb-8" />
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-primary">Login</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                {...register('email')}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                {...register('password')}
                autoComplete="current-password"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              <div className="text-right mt-1">
                <a href="/forgot-password" className="text-sm text-primary hover:underline">Forgot Password?</a>
              </div>
            </div>
            {authError && <p className="text-red-600 text-center">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="text-gray-600">Don't have an account?</span>{' '}
            <a href="/signup" className="text-primary hover:underline">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 