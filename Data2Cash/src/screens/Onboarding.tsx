import React, { useState, useEffect } from 'react';
import { 
  BackBtn, 
  PrimaryBtn, 
  IconCheck, 
  IconShield, 
  IconPhone, 
  IconLock,
  IconSignal,
  IconBarChart,
  IconDollarSign,
  IconZap,
  IconSmartphone,
  IconEye,
  IconCreditCard,
  IconLoader
} from '@/components';
import { BANKS } from '@/data';
import type { ScreenProps } from '@/types';

// ============================================================================
// SPLASH ("Your Data. Your Cash.")
// ============================================================================
export const Splash: React.FC<ScreenProps> = ({ go }) => {
  return (
    <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] flex flex-col p-6 animate-fade-in">
      {/* Top Logo Header */}
      <div className="flex items-center gap-2.5 pt-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#AAFF45] text-[#030F07] flex items-center justify-center font-black text-[11px] tracking-tight select-none">
          D2C
        </div>
        <span className="font-bold text-[17px] tracking-tight">Data2Cash</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="relative mb-2">
          <div
            className="absolute -top-10 -left-10 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(170,255,69,0.08) 0%, transparent 70%)' }}
          />
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-4 text-[#AAFF45]">
            Multi-Network Telecom Platform
          </p>
          <h1 className="text-[2.75rem] font-extrabold leading-[1.08] mb-5 tracking-tight">
            Your Data.<br />
            <span className="text-[#AAFF45]">Your Cash.</span>
          </h1>
          <p className="text-[16px] leading-relaxed mb-8 text-[#7AAD8A]">
            Convert excess data & airtime to Naira instantly, or buy cheap data & airtime — all in one app.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-col gap-3.5 mb-8">
          {[
            { icon: <IconZap size={18} color="#AAFF45" />, label: 'Instant bank credit — usually seconds' },
            { icon: <IconSignal size={18} color="#AAFF45" />, label: 'Multi-Network (MTN, Glo, Airtel, 9mobile)' },
            { icon: <IconShield size={18} color="#AAFF45" />, label: 'Direct payouts — no middleman ever' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#0C2318] border border-[rgba(170,255,69,0.08)]">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[rgba(170,255,69,0.09)]">
                {icon}
              </div>
              <span className="text-[14px] font-medium text-[#7AAD8A]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-6">
        <PrimaryBtn onClick={() => go('signup')}>
          Get Started →
        </PrimaryBtn>
        <p className="text-center text-[13px] mt-4 text-[#7AAD8A]">
          Already have an account?{' '}
          <button onClick={() => go('login')} className="text-[#AAFF45] font-bold hover:underline">
            Log In
          </button>
        </p>
        <p className="text-center text-[11px] mt-4 tracking-wide text-[#2E6040] flex items-center justify-center gap-1.5">
          <IconShield size={13} color="#2E6040" />
          Multi-Network · 256-bit encrypted
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// HOW IT WORKS
// ============================================================================
export const HowItWorks: React.FC<ScreenProps> = ({ go }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <IconSignal size={36} color="#AAFF45" />,
      title: "We detect your SIM",
      desc: "Data2Cash automatically detects your SIM network details (MTN, Glo, Airtel, 9mobile) using READ_PHONE_STATE.",
      tag: "READ_PHONE_STATE · read-only"
    },
    {
      icon: <IconBarChart size={36} color="#AAFF45" />,
      title: "We check your balance",
      desc: "We securely check your data bundle or airtime balance via quick USSD check to give you instant cash quotes.",
      tag: "CALL_PHONE + Accessibility Service"
    },
    {
      icon: <IconDollarSign size={36} color="#AAFF45" />,
      title: "Cash hits your bank",
      desc: "The moment your transfer is confirmed, your Naira arrives directly in your bank account via Paystack.",
      tag: "Powered by Paystack Transfers API"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      go('permissions');
    }
  };

  const handleBack = () => {
    if (step === 0) {
      go('splash');
    } else {
      setStep(s => s - 1);
    }
  };

  const cur = steps[step];

  return (
    <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] flex flex-col p-6 animate-fade-in">
      <div className="flex items-center justify-between pt-2 pb-6">
        <BackBtn onBack={handleBack} onClick={handleBack} />
        <span className="text-[#5A8870] text-[12px] font-semibold">Step {step + 1} of {steps.length}</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* Step Card */}
        <div className="bg-[#0C2318] border border-[rgba(170,255,69,0.1)] rounded-3xl p-8 text-center mb-8 relative overflow-hidden">
          <div className="w-20 h-20 bg-[rgba(170,255,69,0.08)] border border-[rgba(170,255,69,0.14)] rounded-3xl flex items-center justify-center mx-auto mb-6">
            {cur.icon}
          </div>
          <h2 className="text-[2rem] font-extrabold mb-3 leading-tight tracking-tight">{cur.title}</h2>
          <p className="text-[#7AAD8A] text-[15px] leading-relaxed mb-6">{cur.desc}</p>
          <div className="inline-flex items-center gap-2 bg-[#030F07] border border-[rgba(170,255,69,0.1)] rounded-xl py-2 px-3.5 text-[12px] text-[#5A8870]" style={{ fontFamily: 'DM Mono, monospace' }}>
            <IconLock size={13} color="#5A8870" />
            {cur.tag}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '28px' : '8px',
                background: i === step ? '#AAFF45' : i < step ? 'rgba(170,255,69,0.4)' : 'rgba(170,255,69,0.14)'
              }}
            />
          ))}
        </div>
      </div>

      <div className="pb-6">
        <PrimaryBtn onClick={handleNext}>
          {step === steps.length - 1 ? 'Set Up Permissions →' : 'Next →'}
        </PrimaryBtn>
      </div>
    </div>
  );
};

// ============================================================================
// PERMISSIONS
// ============================================================================
export const Permissions: React.FC<ScreenProps> = ({ go }) => {
  const [perms, setPerms] = useState({
    callPhone: false,
    readPhoneState: false,
    accessibility: false
  });

  const allGranted = perms.callPhone && perms.readPhoneState && perms.accessibility;
  const grantedCount = Object.values(perms).filter(Boolean).length;

  const togglePerm = (key: keyof typeof perms) => {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleButtonClick = () => {
    if (allGranted) {
      go('pin-setup');
    } else {
      // Grant all 3 permissions
      setPerms({ callPhone: true, readPhoneState: true, accessibility: true });
    }
  };

  const cards = [
    {
      id: 'callPhone' as const,
      icon: <IconPhone size={18} color="#AAFF45" />,
      name: 'CALL_PHONE',
      desc: 'To automatically dial USSD codes for data and airtime transfers.'
    },
    {
      id: 'readPhoneState' as const,
      icon: <IconSmartphone size={18} color="#AAFF45" />,
      name: 'READ_PHONE_STATE',
      desc: 'To detect your active SIM and network operator.'
    },
    {
      id: 'accessibility' as const,
      icon: <IconEye size={18} color="#AAFF45" />,
      name: 'Accessibility Service',
      desc: 'To read the USSD pop-up response and extract balance details.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] flex flex-col p-6 animate-fade-in">
      <div className="flex justify-between items-center pt-2 pb-6">
        <BackBtn onBack={() => go('how-it-works')} onClick={() => go('how-it-works')} />
        <button onClick={() => go('pin-setup')} className="text-[#5A8870] text-[13px] font-semibold px-3 py-1.5 rounded-xl border border-[rgba(170,255,69,0.1)]">
          Skip for Demo
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-[2rem] font-extrabold mb-1.5 leading-tight tracking-tight">3 permissions needed</h2>
        <p className="text-[#7AAD8A] text-[14px]">Tap each one to grant. We've explained why each is needed.</p>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {cards.map(c => {
          const granted = perms[c.id];
          return (
            <button 
              key={c.id}
              onClick={() => togglePerm(c.id)}
              className="w-full text-left bg-[#0C2318] rounded-2xl p-4 transition-all cursor-pointer select-none"
              style={{
                background: granted ? 'rgba(170,255,69,0.07)' : '#0C2318',
                border: `1px solid ${granted ? 'rgba(170,255,69,0.28)' : 'rgba(170,255,69,0.07)'}`
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {c.icon}
                    <span className="text-[13px] font-semibold" style={{ fontFamily: 'DM Mono, monospace', color: granted ? '#AAFF45' : '#F0FAF0' }}>
                      {c.name}
                    </span>
                  </div>
                  <p className="text-[#5A8870] text-[12px] leading-relaxed">{c.desc}</p>
                </div>
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 transition-all"
                  style={{
                    background: granted ? '#AAFF45' : 'transparent',
                    border: granted ? 'none' : '1.5px solid rgba(170,255,69,0.25)'
                  }}
                >
                  {granted && <IconCheck size={12} color="#030F07" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pb-6 pt-4">
        <PrimaryBtn onClick={handleButtonClick}>
          {allGranted ? 'Set Up Security PIN →' : `Grant permissions (${grantedCount}/3)`}
        </PrimaryBtn>
      </div>
    </div>
  );
};

// ============================================================================
// BANK LINK
// ============================================================================
export const BankLink: React.FC<ScreenProps> = ({ go }) => {
  const [bank, setBank] = useState('');
  const [accNum, setAccNum] = useState('');
  const [bvn, setBvn] = useState('');
  const [accName, setAccName] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (accNum.length === 10 && bank) {
      setIsResolving(true);
      setAccName('');
      const timer = setTimeout(() => {
        setAccName('ADAEZE OKONKWO');
        setIsResolving(false);
      }, 900);
      return () => clearTimeout(timer);
    } else {
      setAccName('');
      setIsResolving(false);
    }
  }, [accNum, bank]);

  const isValid = bank && accNum.length === 10 && bvn.length === 11 && accName;

  return (
    <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] flex flex-col p-6 animate-fade-in">
      <div className="pt-2 pb-6">
        <BackBtn onBack={() => go('permissions')} onClick={() => go('permissions')} />
      </div>

      <div className="mb-6">
        <h2 className="text-[2rem] font-extrabold mb-1.5 leading-tight tracking-tight">Link your bank account</h2>
        <p className="text-[#7AAD8A] text-[14px]">This is where your Naira lands. Encrypted and safe.</p>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <div>
          <label className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase text-[#5A8870]">Bank</label>
          <select 
            className="w-full bg-[#0C2318] border border-[rgba(170,255,69,0.09)] rounded-xl p-3.5 text-[#F0FAF0] text-[14px] focus:outline-none focus:border-[rgba(170,255,69,0.3)] appearance-none"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          >
            <option value="">Select your bank…</option>
            {BANKS?.map((b: string) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase text-[#5A8870]">Account Number</label>
          <input 
            type="tel"
            maxLength={10}
            className="w-full bg-[#0C2318] border border-[rgba(170,255,69,0.09)] rounded-xl p-3.5 text-[#F0FAF0] text-[14px] focus:outline-none focus:border-[rgba(170,255,69,0.3)]"
            placeholder="0123456789"
            value={accNum}
            onChange={(e) => setAccNum(e.target.value.replace(/\D/g, ''))}
            style={{ fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}
          />
          {isResolving && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-[rgba(170,255,69,0.05)] flex items-center gap-2">
              <IconLoader size={13} color="#AAFF45" />
              <span className="text-[#5A8870] text-[12px] animate-pulse">Verifying account name…</span>
            </div>
          )}
          {accName && !isResolving && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-[rgba(170,255,69,0.07)] border border-[rgba(170,255,69,0.2)] flex items-center gap-2">
              <IconCheck size={14} color="#AAFF45" />
              <span className="text-[#AAFF45] text-[13px] font-bold tracking-wider">{accName}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase text-[#5A8870]">BVN — for KYC verification</label>
          <input 
            type="tel"
            maxLength={11}
            className="w-full bg-[#0C2318] border border-[rgba(170,255,69,0.09)] rounded-xl p-3.5 text-[#F0FAF0] text-[14px] focus:outline-none focus:border-[rgba(170,255,69,0.3)]"
            placeholder="22345678901"
            value={bvn}
            onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
            style={{ fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}
          />
        </div>

        <div className="p-3.5 rounded-xl bg-[#0C2318] border border-[rgba(170,255,69,0.06)] flex items-start gap-3 mt-1">
          <IconCreditCard size={18} color="#7AAD8A" />
          <div>
            <p className="text-[12px] font-semibold mb-0.5 text-[#F0FAF0]">Paystack-secured transfers</p>
            <p className="text-[11px] leading-relaxed text-[#5A8870]">
              Your payout goes via Paystack Transfers API directly to your account.
            </p>
          </div>
        </div>
      </div>

      <div className="pb-6 pt-4">
        <PrimaryBtn 
          onClick={() => isValid && go('pin-setup')}
          disabled={!isValid}
        >
          Continue to Set PIN →
        </PrimaryBtn>
      </div>
    </div>
  );
};
