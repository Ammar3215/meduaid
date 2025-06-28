import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const { user, verifyEmail } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    if (user) {
      const result = await verifyEmail(user.email);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError('Verification failed.');
      }
    } else {
      setError('No user found.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Verify Your Email</h2>
        <p className="mb-6 text-gray-700">Please verify your email address to continue.</p>
        {success ? (
          <div className="text-green-600 font-semibold mb-2">Email verified! Redirecting...</div>
        ) : (
          <button
            onClick={handleVerify}
            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition mb-2"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        )}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default VerifyEmail; 