import React from 'react';

const VerifyEmail: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Thank You!</h2>
        <p className="mb-6 text-gray-700">Thank you for signing up with MeduAid. We appreciate your registration and look forward to working together!</p>
        <a href="/login" className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition">Back to Login</a>
      </div>
    </div>
  );
};

export default VerifyEmail; 