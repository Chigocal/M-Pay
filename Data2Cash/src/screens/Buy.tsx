import { useState, useEffect } from 'react'
import type { ScreenProps, Network, DataPlan } from '@/types'
import {
  BackBtn, PrimaryBtn, GhostBtn, NetworkSelector,
  IconWifi, IconZap, IconCheckCircle, IconSend,
  IconArrowRight, IconWallet, IconLoader, IconCheck,
} from '@/components'
import { DATA_PLANS, AIRTIME_PRESETS, fmt, genTxId, getNetworkMeta } from '@/data'

// ─── Module-level draft state (shared between sub-screens) ──────────────────

let _buyDraft = {
  network: null as Network | null,
  phone: '',
  plan: null as DataPlan | null,
  amount: 0,
}

// ─── BuyHub ──────────────────────────────────────────────────────────────────

export function BuyHub({ go, state }: ScreenProps) {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px] font-extrabold">Buy</h2>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(170,255,69,0.06)', border: '1px solid rgba(170,255,69,0.1)' }}>
            <IconWallet size={13} color="#AAFF45" />
            <span className="text-[12px] font-bold" style={{ color: '#AAFF45' }}>{fmt(state.walletBalance)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Buy Data */}
          <button
            onClick={() => go('buy-data')}
            className="w-full p-5 rounded-2xl text-left transition-all active:scale-[0.98]"
            style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.09)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(170,255,69,0.09)' }}>
                  <IconWifi size={26} />
                </div>
                <div>
                  <p className="text-[16px] font-bold mb-1">Buy Data</p>
                  <p className="text-[13px]" style={{ color: '#7AAD8A' }}>Instant data bundles for all networks</p>
                </div>
              </div>
              <IconArrowRight size={18} color="#2E6040" />
            </div>
          </button>

          {/* Buy Airtime */}
          <button
            onClick={() => go('buy-airtime')}
            className="w-full p-5 rounded-2xl text-left transition-all active:scale-[0.98]"
            style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.09)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(170,255,69,0.09)' }}>
                  <IconZap size={26} />
                </div>
                <div>
                  <p className="text-[16px] font-bold mb-1">Buy Airtime</p>
                  <p className="text-[13px]" style={{ color: '#7AAD8A' }}>Send airtime to any network instantly</p>
                </div>
              </div>
              <IconArrowRight size={18} color="#2E6040" />
            </div>
          </button>
        </div>
      </div>
      <div className="bottom-nav-spacer" />
    </div>
  )
}

// ─── BuyData ─────────────────────────────────────────────────────────────────

export function BuyData({ go, state }: ScreenProps) {
  const [network, setNetwork] = useState<Network | null>(null)
  const [phone, setPhone]     = useState('')
  const [useMyNum, setUseMyNum] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null)

  const plans = network ? DATA_PLANS.filter(p => p.network === network) : []
  const beneficiaries = network ? state.beneficiaries.filter(b => b.network === network) : []
  const ready = network && phone.length === 11 && selectedPlan && state.walletBalance >= (selectedPlan?.price ?? 0)
  const insufficient = selectedPlan && state.walletBalance < selectedPlan.price

  const handleMyNum = () => {
    setUseMyNum(!useMyNum)
    setPhone(!useMyNum ? state.userPhone : '')
  }

  const handleContinue = () => {
    if (!ready || !selectedPlan || !network) return
    _buyDraft = { network, phone, plan: selectedPlan, amount: selectedPlan.price }
    go('buy-data-confirm')
  }

  return (
    <div className="flex flex-col min-h-screen animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="px-6 pt-3 pb-4 flex items-center gap-3">
        <BackBtn onBack={() => go('buy-hub')} />
        <h2 className="text-[18px] font-extrabold">Buy Data</h2>
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        {/* Network */}
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2" style={{ color: '#5A8870' }}>Select Network</p>
        <NetworkSelector selected={network} onSelect={n => { setNetwork(n); setSelectedPlan(null) }} />

        {/* Phone */}
        <div className="mt-5 mb-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: '#5A8870' }}>Phone Number</p>
            <button onClick={handleMyNum} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all" style={{ background: useMyNum ? 'rgba(170,255,69,0.12)' : 'rgba(170,255,69,0.04)', color: useMyNum ? '#AAFF45' : '#5A8870' }}>
              My Number
            </button>
          </div>
          <input
            type="tel" maxLength={11} placeholder="08012345678" value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setUseMyNum(false) }}
            className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
            style={{ background: '#0C2318', border: `1px solid ${phone.length === 11 ? 'rgba(170,255,69,0.3)' : 'rgba(170,255,69,0.09)'}`, color: '#F0FAF0', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}
          />
        </div>

        {/* Beneficiaries */}
        {beneficiaries.length > 0 && (
          <div className="flex gap-2 mt-2 mb-4 overflow-x-auto">
            {beneficiaries.map(b => (
              <button key={b.id} onClick={() => setPhone(b.phone)} className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 transition-all" style={{ background: phone === b.phone ? 'rgba(170,255,69,0.1)' : '#0C2318', border: `1px solid ${phone === b.phone ? 'rgba(170,255,69,0.25)' : 'rgba(170,255,69,0.06)'}` }}>
                <span className="text-[12px] font-semibold">{b.name}</span>
                <span className="text-[11px]" style={{ color: '#5A8870' }}>{b.phone.slice(-4)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Data plans */}
        {network && (
          <>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2 mt-4" style={{ color: '#5A8870' }}>Select Plan</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {plans.map(plan => {
                const active = selectedPlan?.id === plan.id
                return (
                  <button key={plan.id} onClick={() => setSelectedPlan(plan)} className="p-3.5 rounded-xl text-left transition-all" style={{ background: active ? 'rgba(170,255,69,0.08)' : '#0C2318', border: `1.5px solid ${active ? '#AAFF45' : 'rgba(170,255,69,0.07)'}` }}>
                    <p className="text-[16px] font-bold mb-0.5">{plan.name}</p>
                    <p className="text-[14px] font-bold mb-1" style={{ color: active ? '#AAFF45' : '#7AAD8A' }}>{fmt(plan.price)}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(170,255,69,0.08)', color: '#5A8870' }}>{plan.type}</span>
                      <span className="text-[10px]" style={{ color: '#2E6040' }}>{plan.validity}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Balance info */}
        {selectedPlan && (
          <div className="p-3.5 rounded-xl mb-4" style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px]" style={{ color: '#5A8870' }}>Wallet balance</span>
              <span className="text-[12px] font-semibold">{fmt(state.walletBalance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: '#5A8870' }}>Plan cost</span>
              <span className="text-[12px] font-semibold" style={{ color: '#AAFF45' }}>{fmt(selectedPlan.price)}</span>
            </div>
            {insufficient && (
              <p className="text-[11px] mt-2" style={{ color: '#FF6B35' }}>Insufficient wallet balance. Fund your wallet to continue.</p>
            )}
          </div>
        )}
      </div>

      <div className="px-6 pb-10 pt-4">
        <PrimaryBtn label={`Continue → ${selectedPlan ? fmt(selectedPlan.price) : ''}`} onClick={handleContinue} disabled={!ready} />
      </div>
    </div>
  )
}

// ─── BuyDataConfirm ──────────────────────────────────────────────────────────

export function BuyDataConfirm({ go, state, requestPin }: ScreenProps) {
  const { network, phone, plan } = _buyDraft
  if (!plan || !network) return null

  const netMeta = getNetworkMeta(network)
  const balanceAfter = state.walletBalance - plan.price

  return (
    <div className="flex flex-col min-h-screen animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="px-6 pt-3 pb-4">
        <BackBtn onBack={() => go('buy-data')} />
      </div>

      <div className="flex-1 px-6">
        <h2 className="text-[2rem] font-extrabold mb-1.5">Confirm Purchase</h2>
        <p className="text-[14px] mb-6" style={{ color: '#7AAD8A' }}>Review the details before we purchase your data plan.</p>

        <div className="p-5 rounded-2xl mb-4" style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.09)' }}>
          {[
            { label: 'Network',  value: network, color: netMeta.color },
            { label: 'Recipient', value: phone },
            { label: 'Plan',     value: `${plan.name} ${plan.type}` },
            { label: 'Validity', value: plan.validity },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between mb-3.5">
              <span className="text-[13px]" style={{ color: '#5A8870' }}>{label}</span>
              <span className="text-[13px] font-semibold" style={{ color: color || '#F0FAF0', fontFamily: label === 'Recipient' ? 'DM Mono, monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}
          <div className="my-1" style={{ borderTop: '1px solid rgba(170,255,69,0.08)' }} />
          <div className="flex items-center justify-between pt-3.5">
            <span className="text-[16px] font-bold">Amount</span>
            <span className="text-[28px] font-extrabold" style={{ color: '#AAFF45' }}>{fmt(plan.price)}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl mb-4" style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.07)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: '#5A8870' }}>Wallet after purchase</span>
            <span className="text-[13px] font-bold" style={{ fontFamily: 'DM Mono, monospace' }}>{fmt(balanceAfter)}</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-10 pt-4 flex flex-col gap-3">
        <PrimaryBtn label={`Confirm Purchase ${fmt(plan.price)}`} onClick={() => requestPin(() => go('buy-data-processing'))} />
        <GhostBtn label="Cancel" onClick={() => go('buy-hub')} />
      </div>
    </div>
  )
}

// ─── BuyDataProcessing ───────────────────────────────────────────────────────

export function BuyDataProcessing({ go }: ScreenProps) {
  const [phase, setPhase] = useState(0)
  const phases = [
    { label: 'Verifying wallet balance',  detail: 'Checking available funds…' },
    { label: 'Purchasing data plan',      detail: 'Contacting network…' },
    { label: 'Delivering to recipient',   detail: `Sending to ${_buyDraft.phone}…` },
    { label: 'Confirming delivery',       detail: 'Verifying activation…' },
  ]

  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 2700),
      setTimeout(() => setPhase(3), 4100),
      setTimeout(() => go('buy-data-success'), 5600),
    ]
    return () => ts.forEach(clearTimeout)
  }, [go])

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="relative flex items-center justify-center mb-10">
        <div className="absolute w-36 h-36 rounded-full animate-pulse-ring" style={{ background: 'rgba(170,255,69,0.12)' }} />
        <div className="absolute w-28 h-28 rounded-full animate-pulse-ring" style={{ background: 'rgba(170,255,69,0.08)', animationDelay: '0.4s' }} />
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(170,255,69,0.12)', border: '1.5px solid rgba(170,255,69,0.28)', boxShadow: '0 0 40px rgba(170,255,69,0.15)' }}>
          <IconSend size={32} />
        </div>
      </div>
      <h2 className="text-[28px] font-extrabold mb-1.5 text-center">Purchasing…</h2>
      <p className="text-[14px] mb-10 text-center" style={{ color: '#7AAD8A' }}>Processing your data purchase</p>
      <div className="w-full flex flex-col gap-3">
        {phases.map((p, i) => {
          const isDone = i < phase, isActive = i === phase
          return (
            <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl transition-all duration-300" style={{ background: isDone ? 'rgba(170,255,69,0.05)' : isActive ? 'rgba(170,255,69,0.03)' : 'transparent', border: `1px solid ${isDone ? 'rgba(170,255,69,0.15)' : isActive ? 'rgba(170,255,69,0.1)' : 'transparent'}` }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all" style={{ background: isDone ? '#AAFF45' : isActive ? 'rgba(170,255,69,0.15)' : 'transparent', border: isDone ? 'none' : isActive ? '1px solid rgba(170,255,69,0.3)' : '1px solid rgba(170,255,69,0.1)' }}>
                {isDone && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 7L9 1" stroke="#030F07" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {isActive && <span className="animate-pulse text-[6px]" style={{ color: '#AAFF45' }}>●</span>}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: isDone ? '#F0FAF0' : isActive ? '#AAFF45' : '#2E6040' }}>{p.label}</p>
                {isActive && <p className="text-[11px] mt-0.5 animate-pulse" style={{ color: '#5A8870' }}>{p.detail}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── BuyDataSuccess ──────────────────────────────────────────────────────────

export function BuyDataSuccess({ go, state, setState }: ScreenProps) {
  const { plan, phone, network } = _buyDraft
  const txId = genTxId()

  useEffect(() => {
    if (!plan) return
    setState(s => ({
      ...s,
      walletBalance: s.walletBalance - plan.price,
      transactions: [
        { id: txId, date: new Date().toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }), type: 'buy-data' as const, status: 'completed' as const, amount: plan.price, network: network!, recipientPhone: phone, plan: `${plan.name} ${plan.type}` },
        ...s.transactions,
      ],
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col min-h-screen animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-36 h-36 rounded-full animate-pulse-ring" style={{ background: 'rgba(170,255,69,0.1)' }} />
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'rgba(170,255,69,0.1)', border: '1.5px solid rgba(170,255,69,0.3)', boxShadow: '0 0 60px rgba(170,255,69,0.12)' }}>
            <IconCheckCircle size={44} />
          </div>
        </div>
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#AAFF45' }}>Data Delivered</p>
        <p className="text-[40px] font-extrabold leading-none mb-2 shimmer-text">{plan?.name}</p>
        <p className="text-[15px] mb-1" style={{ color: '#7AAD8A' }}>sent to {phone}</p>
        <p className="text-[13px] mb-8" style={{ color: '#5A8870' }}>{network} · {plan?.type}</p>

        <div className="w-full p-4 rounded-2xl text-left" style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.09)' }}>
          {[
            { label: 'Transaction ID', value: txId, mono: true, lime: true },
            { label: 'Date & time', value: new Date().toLocaleString('en-NG'), mono: true },
            { label: 'Amount deducted', value: fmt(plan?.price ?? 0), mono: true },
            { label: 'Wallet balance', value: fmt(state.walletBalance - (plan?.price ?? 0)), mono: true },
          ].map(({ label, value, mono, lime }, i, arr) => (
            <div key={label} className="flex items-center justify-between" style={{ paddingBottom: i < arr.length - 1 ? '10px' : 0, marginBottom: i < arr.length - 1 ? '10px' : 0, borderBottom: i < arr.length - 1 ? '1px solid rgba(170,255,69,0.06)' : 'none' }}>
              <span className="text-[12px]" style={{ color: '#5A8870' }}>{label}</span>
              <span className="text-[12px] font-semibold" style={{ fontFamily: mono ? 'DM Mono, monospace' : 'inherit', color: lime ? '#AAFF45' : '#F0FAF0' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 pb-10 flex flex-col gap-3">
        <PrimaryBtn label="Buy More Data" onClick={() => go('buy-data')} />
        <GhostBtn label="Back to Dashboard" onClick={() => go('dashboard')} />
      </div>
    </div>
  )
}

// ─── BuyAirtime ──────────────────────────────────────────────────────────────

export function BuyAirtime({ go, state }: ScreenProps) {
  const [network, setNetwork]   = useState<Network | null>(null)
  const [phone, setPhone]       = useState('')
  const [useMyNum, setUseMyNum] = useState(false)
  const [amount, setAmount]     = useState(0)
  const [custom, setCustom]     = useState('')

  const beneficiaries = network ? state.beneficiaries.filter(b => b.network === network) : []
  const effectiveAmt = amount || (parseInt(custom) || 0)
  const ready = network && phone.length === 11 && effectiveAmt >= 50 && state.walletBalance >= effectiveAmt
  const insufficient = effectiveAmt > 0 && state.walletBalance < effectiveAmt

  const handleMyNum = () => {
    setUseMyNum(!useMyNum)
    setPhone(!useMyNum ? state.userPhone : '')
  }

  const handleContinue = () => {
    if (!ready || !network) return
    _buyDraft = { network, phone, plan: null, amount: effectiveAmt }
    go('buy-airtime-confirm')
  }

  return (
    <div className="flex flex-col min-h-screen animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="px-6 pt-3 pb-4 flex items-center gap-3">
        <BackBtn onBack={() => go('buy-hub')} />
        <h2 className="text-[18px] font-extrabold">Buy Airtime</h2>
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        {/* Network */}
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2" style={{ color: '#5A8870' }}>Select Network</p>
        <NetworkSelector selected={network} onSelect={setNetwork} />

        {/* Phone */}
        <div className="mt-5 mb-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: '#5A8870' }}>Phone Number</p>
            <button onClick={handleMyNum} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all" style={{ background: useMyNum ? 'rgba(170,255,69,0.12)' : 'rgba(170,255,69,0.04)', color: useMyNum ? '#AAFF45' : '#5A8870' }}>
              My Number
            </button>
          </div>
          <input
            type="tel" maxLength={11} placeholder="08012345678" value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setUseMyNum(false) }}
            className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
            style={{ background: '#0C2318', border: `1px solid ${phone.length === 11 ? 'rgba(170,255,69,0.3)' : 'rgba(170,255,69,0.09)'}`, color: '#F0FAF0', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}
          />
        </div>

        {/* Beneficiaries */}
        {beneficiaries.length > 0 && (
          <div className="flex gap-2 mt-2 mb-4 overflow-x-auto">
            {beneficiaries.map(b => (
              <button key={b.id} onClick={() => setPhone(b.phone)} className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 transition-all" style={{ background: phone === b.phone ? 'rgba(170,255,69,0.1)' : '#0C2318', border: `1px solid ${phone === b.phone ? 'rgba(170,255,69,0.25)' : 'rgba(170,255,69,0.06)'}` }}>
                <span className="text-[12px] font-semibold">{b.name}</span>
                <span className="text-[11px]" style={{ color: '#5A8870' }}>{b.phone.slice(-4)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Preset amounts */}
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2 mt-4" style={{ color: '#5A8870' }}>Select Amount</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {AIRTIME_PRESETS.map(a => (
            <button key={a} onClick={() => { setAmount(a); setCustom('') }} className="py-3 rounded-xl text-[14px] font-bold transition-all active:scale-95" style={{ background: amount === a ? 'rgba(170,255,69,0.1)' : '#0C2318', border: `1.5px solid ${amount === a ? '#AAFF45' : 'rgba(170,255,69,0.07)'}`, color: amount === a ? '#AAFF45' : '#F0FAF0' }}>
              {fmt(a)}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="mb-4">
          <p className="text-[11px] mb-2" style={{ color: '#5A8870' }}>Or enter custom amount</p>
          <input
            type="tel" placeholder="Enter amount" value={custom}
            onChange={e => { setCustom(e.target.value.replace(/\D/g, '')); setAmount(0) }}
            className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
            style={{ background: '#0C2318', border: `1px solid ${custom ? 'rgba(170,255,69,0.3)' : 'rgba(170,255,69,0.09)'}`, color: '#F0FAF0', fontFamily: 'DM Mono, monospace' }}
          />
        </div>

        {/* Balance */}
        {effectiveAmt > 0 && (
          <div className="p-3.5 rounded-xl mb-4" style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px]" style={{ color: '#5A8870' }}>Wallet balance</span>
              <span className="text-[12px] font-semibold">{fmt(state.walletBalance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: '#5A8870' }}>Airtime amount</span>
              <span className="text-[12px] font-semibold" style={{ color: '#AAFF45' }}>{fmt(effectiveAmt)}</span>
            </div>
            {insufficient && <p className="text-[11px] mt-2" style={{ color: '#FF6B35' }}>Insufficient balance.</p>}
          </div>
        )}
      </div>

      <div className="px-6 pb-10 pt-4">
        <PrimaryBtn label={`Continue → ${effectiveAmt ? fmt(effectiveAmt) : ''}`} onClick={handleContinue} disabled={!ready} />
      </div>
    </div>
  )
}

// ─── BuyAirtimeConfirm ───────────────────────────────────────────────────────

export function BuyAirtimeConfirm({ go, state, requestPin }: ScreenProps) {
  const { network, phone, amount } = _buyDraft
  if (!network) return null

  const netMeta = getNetworkMeta(network)
  const balanceAfter = state.walletBalance - amount

  return (
    <div className="flex flex-col min-h-screen animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="px-6 pt-3 pb-4"><BackBtn onBack={() => go('buy-airtime')} /></div>
      <div className="flex-1 px-6">
        <h2 className="text-[2rem] font-extrabold mb-1.5">Confirm Purchase</h2>
        <p className="text-[14px] mb-6" style={{ color: '#7AAD8A' }}>Review the details before sending airtime.</p>

        <div className="p-5 rounded-2xl mb-4" style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.09)' }}>
          {[
            { label: 'Network', value: network, color: netMeta.color },
            { label: 'Recipient', value: phone },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between mb-3.5">
              <span className="text-[13px]" style={{ color: '#5A8870' }}>{label}</span>
              <span className="text-[13px] font-semibold" style={{ color: color || '#F0FAF0', fontFamily: label === 'Recipient' ? 'DM Mono, monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}
          <div className="my-1" style={{ borderTop: '1px solid rgba(170,255,69,0.08)' }} />
          <div className="flex items-center justify-between pt-3.5">
            <span className="text-[16px] font-bold">Amount</span>
            <span className="text-[28px] font-extrabold" style={{ color: '#AAFF45' }}>{fmt(amount)}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl" style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.07)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: '#5A8870' }}>Wallet after purchase</span>
            <span className="text-[13px] font-bold" style={{ fontFamily: 'DM Mono, monospace' }}>{fmt(balanceAfter)}</span>
          </div>
        </div>
      </div>
      <div className="px-6 pb-10 pt-6 flex flex-col gap-3">
        <PrimaryBtn label={`Confirm ${fmt(amount)}`} onClick={() => requestPin(() => go('buy-airtime-processing'))} />
        <GhostBtn label="Cancel" onClick={() => go('buy-hub')} />
      </div>
    </div>
  )
}

// ─── BuyAirtimeProcessing ────────────────────────────────────────────────────

export function BuyAirtimeProcessing({ go }: ScreenProps) {
  const [phase, setPhase] = useState(0)
  const phases = [
    { label: 'Deducting from wallet', detail: 'Checking funds…' },
    { label: 'Sending airtime',       detail: `Delivering to ${_buyDraft.phone}…` },
    { label: 'Confirming delivery',   detail: 'Verifying with network…' },
  ]

  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 2700),
      setTimeout(() => go('buy-airtime-success'), 4200),
    ]
    return () => ts.forEach(clearTimeout)
  }, [go])

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="relative flex items-center justify-center mb-10">
        <div className="absolute w-36 h-36 rounded-full animate-pulse-ring" style={{ background: 'rgba(170,255,69,0.12)' }} />
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(170,255,69,0.12)', border: '1.5px solid rgba(170,255,69,0.28)' }}>
          <IconZap size={32} />
        </div>
      </div>
      <h2 className="text-[28px] font-extrabold mb-1.5 text-center">Sending Airtime…</h2>
      <p className="text-[14px] mb-10 text-center" style={{ color: '#7AAD8A' }}>Almost done</p>
      <div className="w-full flex flex-col gap-3">
        {phases.map((p, i) => {
          const isDone = i < phase, isActive = i === phase
          return (
            <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl transition-all duration-300" style={{ background: isDone ? 'rgba(170,255,69,0.05)' : isActive ? 'rgba(170,255,69,0.03)' : 'transparent', border: `1px solid ${isDone ? 'rgba(170,255,69,0.15)' : isActive ? 'rgba(170,255,69,0.1)' : 'transparent'}` }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: isDone ? '#AAFF45' : 'transparent', border: isDone ? 'none' : '1px solid rgba(170,255,69,0.15)' }}>
                {isDone && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 7L9 1" stroke="#030F07" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {isActive && <span className="animate-pulse text-[6px]" style={{ color: '#AAFF45' }}>●</span>}
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: isDone ? '#F0FAF0' : isActive ? '#AAFF45' : '#2E6040' }}>{p.label}</p>
                {isActive && <p className="text-[11px] mt-0.5 animate-pulse" style={{ color: '#5A8870' }}>{p.detail}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── BuyAirtimeSuccess ───────────────────────────────────────────────────────

export function BuyAirtimeSuccess({ go, state, setState }: ScreenProps) {
  const { network, phone, amount } = _buyDraft
  const txId = genTxId()

  useEffect(() => {
    setState(s => ({
      ...s,
      walletBalance: s.walletBalance - amount,
      transactions: [
        { id: txId, date: new Date().toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }), type: 'buy-airtime' as const, status: 'completed' as const, amount, network: network!, recipientPhone: phone },
        ...s.transactions,
      ],
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col min-h-screen animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-36 h-36 rounded-full animate-pulse-ring" style={{ background: 'rgba(170,255,69,0.1)' }} />
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'rgba(170,255,69,0.1)', border: '1.5px solid rgba(170,255,69,0.3)' }}>
            <IconCheckCircle size={44} />
          </div>
        </div>
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#AAFF45' }}>Airtime Sent</p>
        <p className="text-[48px] font-extrabold leading-none mb-2 shimmer-text">{fmt(amount)}</p>
        <p className="text-[15px] mb-1" style={{ color: '#7AAD8A' }}>sent to {phone}</p>
        <p className="text-[13px] mb-8" style={{ color: '#5A8870' }}>{network}</p>

        <div className="w-full p-4 rounded-2xl text-left" style={{ background: '#0C2318', border: '1px solid rgba(170,255,69,0.09)' }}>
          {[
            { label: 'Transaction ID', value: txId, lime: true },
            { label: 'Date & time', value: new Date().toLocaleString('en-NG') },
            { label: 'Wallet balance', value: fmt(state.walletBalance - amount) },
          ].map(({ label, value, lime }, i, arr) => (
            <div key={label} className="flex items-center justify-between" style={{ paddingBottom: i < arr.length - 1 ? '10px' : 0, marginBottom: i < arr.length - 1 ? '10px' : 0, borderBottom: i < arr.length - 1 ? '1px solid rgba(170,255,69,0.06)' : 'none' }}>
              <span className="text-[12px]" style={{ color: '#5A8870' }}>{label}</span>
              <span className="text-[12px] font-semibold" style={{ fontFamily: 'DM Mono, monospace', color: lime ? '#AAFF45' : '#F0FAF0' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 pb-10 flex flex-col gap-3">
        <PrimaryBtn label="Buy More Airtime" onClick={() => go('buy-airtime')} />
        <GhostBtn label="Back to Dashboard" onClick={() => go('dashboard')} />
      </div>
    </div>
  )
}
