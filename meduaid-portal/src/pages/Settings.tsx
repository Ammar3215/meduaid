import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [email, setEmail] = useState('writer@example.com');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setMessage('Please enter a valid email.');
      return;
    }
    setEmail(newEmail);
    setNewEmail('');
    setMessage('Email updated successfully!');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setMessage('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    // Here you would check currentPassword against the real password in a real app
    setPassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setMessage('Password updated successfully!');
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Settings</h2>
      {message && <div className="mb-4 text-center text-green-600">{message}</div>}
      <form onSubmit={handleEmailChange} className="mb-8">
        <div className="mb-4">
          <label className="block mb-1 font-medium">Current Email</label>
          <input value={email} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">New Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter new email"
          />
        </div>
        <button type="submit" className="bg-primary text-white py-2 px-6 rounded-lg font-semibold hover:bg-primary-dark transition">Change Email</button>
      </form>
      <form onSubmit={handlePasswordChange} className="mb-8">
        <div className="mb-4">
          <label className="block mb-1 font-medium">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter current password"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter new password"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Confirm new password"
          />
        </div>
        <button type="submit" className="bg-primary text-white py-2 px-6 rounded-lg font-semibold hover:bg-primary-dark transition">Change Password</button>
      </form>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Other Settings</h3>
        <div className="flex items-center mb-2">
          <input type="checkbox" id="notifications" className="mr-2" />
          <label htmlFor="notifications">Enable email notifications</label>
        </div>
      </div>
    </div>
  );
};

export default Settings; 