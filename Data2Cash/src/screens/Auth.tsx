import React, { useState } from 'react';
import type { ScreenProps } from '@/types';
import { PrimaryBtn, BackBtn, IconLock, IconPhone, IconShield } from '@/components';

const API_BASE = 'http://127.0.0.1:8000';

export const SignUp: React.FC<ScreenProps> = ({ go, setState }) => {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. Call Register
      const regRes = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone_number: phone, password }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.detail || 'Registration failed');
      }

      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification OTP');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. Verify OTP
      const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.detail || 'OTP verification failed');
      }

      // 2. Call Login automatically to get token
      const logRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const logData = await logRes.json();
      if (!logRes.ok) {
        throw new Error(logData.detail || 'Auto-login failed');
      }

      // 3. Save token
      localStorage.setItem('token', logData.access_token);

      // 4. Update AppState with user data
      setState(s => ({
        ...s,
        userName: email.split('@')[0],
        userPhone: phone,
        walletBalance: 0,
        isVerified: logData.user?.is_verified || false,
        verifiedLegalName: logData.user?.verified_legal_name || '',
        pinSet: false,
      }));

      // 5. Navigate to permissions onboarding
      go('permissions');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] flex flex-col p-6 animate-fade-in">
        <div className="pt-2 pb-6">
          <BackBtn onBack={() => setStep('form')} />
        </div>

        <div className="mb-8">
          <h2 className="text-[2rem] font-extrabold mb-1.5 leading-tight tracking-tight">Verify Email</h2>
          <p className="text-[#7AAD8A] text-[14px]">We sent a 6-digit verification code to <span className="text-[#AAFF45] font-semibold">{email}</span>.</p>
        </div>

        <form onSubmit={handleVerifyOTP} className="flex-1 flex flex-col gap-4">
          {error && (
            <div className="bg-[rgba(255,107,53,0.1)] border border-[#FF6B35] text-[#FF6B35] rounded-xl p-4 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase text-[#5A8870]">Verification Code</label>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#0C2318] border border-[rgba(170,255,69,0.09)] rounded-xl p-3.5 text-[#F0FAF0] text-[24px] font-bold text-center tracking-[0.25em] focus:outline-none focus:border-[#AAFF45] placeholder-[#5A8870]"
            />
          </div>

          <div className="mt-auto pb-6">
            <PrimaryBtn type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP →'}
            </PrimaryBtn>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] flex flex-col p-6 animate-fade-in">
      <div className="pt-2 pb-6">
        <BackBtn onBack={() => go('splash')} />
      </div>

      <div className="mb-8">
        <h2 className="text-[2rem] font-extrabold mb-1.5 leading-tight tracking-tight">Create Account</h2>
        <p className="text-[#7AAD8A] text-[14px]">Start converting excess airtime and data instantly.</p>
      </div>

      <form onSubmit={handleSignUp} className="flex-1 flex flex-col gap-4">
        {error && (
          <div className="bg-[rgba(255,107,53,0.1)] border border-[#FF6B35] text-[#FF6B35] rounded-xl p-4 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase text-[#5A8870]">Email Address</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0C2318] border border-[rgba(170,255,69,0.09)] rounded-xl p-3.5 text-[#F0FAF0] text-[14px] focus:outline-none focus:border-[#AAFF45]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase text-[#5A8870]">Phone Number</label>
          <input
            type="tel"
            placeholder="08012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-[#0C2318] border border-[rgba(170,255,69,0.09)] rounded-xl p-3.5 text-[#F0FAF0] text-[14px] focus:outline-none focus:border-[#AAFF45]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase text-[#5A8870]">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0C2318] border border-[rgba(170,255,69,0.09)] rounded-xl p-3.5 text-[#F0FAF0] text-[14px] focus:outline-none focus:border-[#AAFF45]"
          />
        </div>

        <div className="mt-auto pb-6">
          <PrimaryBtn type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up →'}
          </PrimaryBtn>

          <p className="text-center text-[13px] mt-5 text-[#7AAD8A]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => go('login')}
              className="text-[#AAFF45] font-bold hover:underline"
            >
              Log In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export const LogIn: React.FC<ScreenProps> = ({ go, setState }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Save token
      localStorage.setItem('token', data.access_token);

      // Update AppState with user data
      setState(s => ({
        ...s,
        userName: data.user?.email ? data.user.email.split('@')[0] : email.split('@')[0],
        userPhone: data.user?.phone_number || s.userPhone,
        walletBalance: data.user?.wallet_balance || 0,
        isVerified: data.user?.is_verified || false,
        verifiedLegalName: data.user?.verified_legal_name || '',
        pinSet: true, // We assume true for simplicity in login flow
      }));

      // Navigate to dashboard
      go('dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] flex flex-col p-6 animate-fade-in">
      <div className="pt-2 pb-6">
        <BackBtn onBack={() => go('splash')} />
      </div>

      <div className="mb-8">
        <h2 className="text-[2rem] font-extrabold mb-1.5 leading-tight tracking-tight">Welcome Back</h2>
        <p className="text-[#7AAD8A] text-[14px]">Log in to access your wallet and cash conversions.</p>
      </div>

      <form onSubmit={handleLogin} className="flex-1 flex flex-col gap-4">
        {error && (
          <div className="bg-[rgba(255,107,53,0.1)] border border-[#FF6B35] text-[#FF6B35] rounded-xl p-4 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase text-[#5A8870]">Email Address</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0C2318] border border-[rgba(170,255,69,0.09)] rounded-xl p-3.5 text-[#F0FAF0] text-[14px] focus:outline-none focus:border-[#AAFF45]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase text-[#5A8870]">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0C2318] border border-[rgba(170,255,69,0.09)] rounded-xl p-3.5 text-[#F0FAF0] text-[14px] focus:outline-none focus:border-[#AAFF45]"
          />
        </div>

        <div className="mt-auto pb-6">
          <PrimaryBtn type="submit" disabled={loading}>
            {loading ? 'Logging In...' : 'Log In →'}
          </PrimaryBtn>

          <p className="text-center text-[13px] mt-5 text-[#7AAD8A]">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => go('signup')}
              className="text-[#AAFF45] font-bold hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
