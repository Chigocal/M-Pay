import { useState, useCallback, useEffect } from 'react'
import type { Screen, Network } from './types'
import { NETWORKS } from './data'

// ─── SVG Icon Components ─────────────────────────────────────────────────────

type IP = { size?: number; color?: string }

export function IconSignal({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/></svg>)
}
export function IconZap({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>)
}
export function IconWifi({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>)
}
export function IconShield({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>)
}
export function IconPhone({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/></svg>)
}
export function IconSmartphone({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>)
}
export function IconEye({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)
}
export function IconBarChart({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>)
}
export function IconDollarSign({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>)
}
export function IconSend({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>)
}
export function IconCheck({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>)
}
export function IconCheckCircle({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>)
}
export function IconCreditCard({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>)
}
export function IconClock({ size = 20, color = '#5A8870' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>)
}
export function IconLogOut({ size = 14, color = '#FF6B35' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>)
}
export function IconSettings({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>)
}
export function IconUser({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)
}
export function IconArrowRight({ size = 16, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>)
}
export function IconRefresh({ size = 14, color = '#FF9F6B' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>)
}
export function IconLock({ size = 16, color = '#5A8870' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>)
}
export function IconTrendingUp({ size = 16, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>)
}
export function IconLoader({ size = 14, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>)
}
export function IconInbox({ size = 20, color = '#5A8870' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>)
}

// ─── New icons ───────────────────────────────────────────────────────────────

export function IconHome({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>)
}
export function IconRepeat({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>)
}
export function IconShoppingBag({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>)
}
export function IconPlus({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)
}
export function IconWallet({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="16" rx="2" ry="2"/><path d="M1 10h22"/><circle cx="18" cy="15" r="1"/></svg>)
}
export function IconX({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>)
}
export function IconCopy({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>)
}
export function IconChevronDown({ size = 16, color = '#5A8870' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>)
}
export function IconDelete({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>)
}
export function IconStar({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)
}
export function IconTrash({ size = 20, color = '#FF6B35' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>)
}
export function IconGift({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>)
}
export function IconHelpCircle({ size = 20, color = '#AAFF45' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>)
}
export function IconBell({ size = 20, color = '#AAFF45', className = '' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>)
}
export function IconHash({ size = 20, color = '#AAFF45', className = '' }: IP) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>)
}

// ─── Shared UI Components ────────────────────────────────────────────────────

export function BackBtn({ onBack, onClick }: { onBack?: () => void; onClick?: () => void }) {
  const handleClick = onBack || onClick || (() => {})
  return (
    <button
      onClick={handleClick}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer"
      style={{ background: 'rgba(170,255,69,0.07)', border: '1px solid rgba(170,255,69,0.12)' }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M11 5L7 9L11 13" stroke="#AAFF45" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

export function PrimaryBtn({
  label, children, onClick, disabled = false, danger = false, className = '', style = {}
}: { label?: React.ReactNode; children?: React.ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full font-bold text-[15px] py-4 rounded-2xl transition-all active:scale-95 select-none cursor-pointer ${className}`}
      style={{
        background: disabled ? '#112A1A' : danger ? '#FF6B35' : '#AAFF45',
        color:      disabled ? '#2E6040' : danger ? '#fff'    : '#030F07',
        cursor:     disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
    >
      {label || children}
    </button>
  )
}

export function GhostBtn({
  label, children, onClick, disabled = false, className = '', style = {}
}: { label?: React.ReactNode; children?: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 cursor-pointer ${className}`}
      style={{ border: '1px solid rgba(170,255,69,0.15)', color: '#7AAD8A', cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {label || children}
    </button>
  )
}

// ─── Network selector ────────────────────────────────────────────────────────

export function NetworkSelector({
  selected, onSelect,
}: { selected: Network | null; onSelect: (n: Network) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {NETWORKS.map(n => {
        const active = selected === n.name
        return (
          <button
            key={n.name}
            onClick={() => onSelect(n.name)}
            className="py-3 rounded-xl text-[12px] font-bold transition-all active:scale-95"
            style={{
              background: active ? n.bg : '#0C2318',
              border: `1.5px solid ${active ? n.color : 'rgba(170,255,69,0.07)'}`,
              color: active ? n.color : '#5A8870',
            }}
          >
            {n.name}
          </button>
        )
      })}
    </div>
  )
}

// ─── Bottom Navigation ───────────────────────────────────────────────────────

const NAV_ITEMS: { key: string; label: string; screen: Screen; Icon: (p: IP) => JSX.Element }[] = [
  { key: 'home',    label: 'Home',    screen: 'dashboard',   Icon: IconHome },
  { key: 'convert', label: 'Convert', screen: 'convert-hub', Icon: IconRepeat },
  { key: 'buy',     label: 'Buy',     screen: 'buy-hub',     Icon: IconShoppingBag },
  { key: 'history', label: 'History', screen: 'history',     Icon: IconClock },
  { key: 'profile', label: 'Profile', screen: 'settings',    Icon: IconUser },
]

function getActiveTab(screen: Screen): string {
  if (screen === 'dashboard') return 'home'
  if (screen.startsWith('convert')) return 'convert'
  if (screen.startsWith('buy')) return 'buy'
  if (screen === 'history') return 'history'
  return 'profile'
}

export function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const active = getActiveTab(screen)

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full flex items-end justify-around px-2 pb-2 pt-2"
      style={{
        maxWidth: '520px',
        background: 'linear-gradient(to top, #030F07 60%, rgba(3,15,7,0.92) 80%, transparent)',
        zIndex: 50,
      }}
    >
      <div
        className="w-full flex items-center justify-around rounded-2xl py-2"
        style={{
          background: 'rgba(12,35,24,0.95)',
          border: '1px solid rgba(170,255,69,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {NAV_ITEMS.map(({ key, label, screen: target, Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => go(target)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 transition-all active:scale-90"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: isActive ? 'rgba(170,255,69,0.12)' : 'transparent',
                }}
              >
                <Icon size={20} color={isActive ? '#AAFF45' : '#3A6B50'} />
              </div>
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{ color: isActive ? '#AAFF45' : '#3A6B50' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── PIN Modal ───────────────────────────────────────────────────────────────

export function PinModal({
  visible, correctPin, onSuccess, onCancel, title = 'Enter Transaction PIN',
}: {
  visible: boolean
  correctPin: string
  onSuccess: () => void
  onCancel: () => void
  title?: string
}) {
  const [digits, setDigits] = useState('')
  const [error, setError]   = useState(false)
  const [shaking, setShaking] = useState(false)

  const reset = useCallback(() => { setDigits(''); setError(false); }, [])

  useEffect(() => { if (visible) reset() }, [visible, reset])

  const handleDigit = useCallback((d: string) => {
    if (digits.length >= 4) return
    const next = digits + d
    setDigits(next)
    setError(false)

    if (next.length === 4) {
      if (next === correctPin) {
        setTimeout(() => { onSuccess(); reset() }, 200)
      } else {
        setError(true)
        setShaking(true)
        setTimeout(() => { setShaking(false); setDigits('') }, 500)
      }
    }
  }, [digits, correctPin, onSuccess, reset])

  const handleDelete = useCallback(() => {
    setDigits(d => d.slice(0, -1))
    setError(false)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center modal-overlay"
      style={{ background: 'rgba(3,15,7,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full modal-content px-6 pt-8 pb-8 rounded-t-3xl"
        style={{ maxWidth: '520px', background: '#0A1E14', border: '1px solid rgba(170,255,69,0.08)', borderBottom: 'none' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-[20px] font-extrabold">{title}</h3>
            {error && <p className="text-[12px] mt-1" style={{ color: '#FF6B35' }}>Incorrect PIN. Try again.</p>}
          </div>
          <button onClick={() => { reset(); onCancel() }} className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90" style={{ background: 'rgba(255,107,53,0.08)' }}>
            <IconX size={16} color="#FF6B35" />
          </button>
        </div>

        {/* Dots */}
        <div className={`flex justify-center gap-4 mb-10 ${shaking ? 'shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-4 h-4 rounded-full transition-all duration-200"
              style={{
                background: error
                  ? '#FF6B35'
                  : i < digits.length ? '#AAFF45' : 'rgba(170,255,69,0.1)',
                border: i < digits.length ? 'none' : '1.5px solid rgba(170,255,69,0.2)',
                boxShadow: i < digits.length && !error ? '0 0 12px rgba(170,255,69,0.3)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map(k => {
            if (k === '') return <div key="empty" />
            if (k === 'del') {
              return (
                <button key="del" onClick={handleDelete} className="h-14 rounded-xl flex items-center justify-center active:scale-90 transition-all" style={{ background: 'rgba(255,107,53,0.06)' }}>
                  <IconDelete size={20} color="#FF6B35" />
                </button>
              )
            }
            return (
              <button
                key={k}
                onClick={() => handleDigit(k)}
                className="h-14 rounded-xl text-[20px] font-bold transition-all active:scale-90"
                style={{ background: 'rgba(170,255,69,0.05)', color: '#F0FAF0', border: '1px solid rgba(170,255,69,0.06)' }}
              >
                {k}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── PIN Setup Component ─────────────────────────────────────────────────────

export function PinSetup({
  go, onPinSet,
}: { go: (s: Screen) => void; onPinSet: (pin: string) => void }) {
  const [step, setStep]       = useState<'create' | 'confirm'>('create')
  const [pin, setPin]         = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError]     = useState(false)
  const [shaking, setShaking] = useState(false)

  const current  = step === 'create' ? pin : confirmPin
  const setCurrent = step === 'create' ? setPin : setConfirmPin

  const handleDigit = (d: string) => {
    if (current.length >= 4) return
    const next = current + d
    setCurrent(next)
    setError(false)

    if (next.length === 4) {
      if (step === 'create') {
        setTimeout(() => setStep('confirm'), 300)
      } else {
        if (next === pin) {
          onPinSet(pin)
          go('dashboard')
        } else {
          setError(true)
          setShaking(true)
          setTimeout(() => { setShaking(false); setConfirmPin('') }, 500)
        }
      }
    }
  }

  const handleDelete = () => {
    setCurrent(c => c.slice(0, -1))
    setError(false)
  }

  return (
    <div className="flex flex-col min-h-screen animate-fade-in" style={{ background: '#030F07', color: '#F0FAF0' }}>
      <div className="px-6 pt-3 pb-4">
        <BackBtn onBack={() => step === 'confirm' ? (setStep('create'), setConfirmPin(''), setPin('')) : go('permissions')} />
      </div>

      <div className="flex-1 px-6 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(170,255,69,0.08)', border: '1px solid rgba(170,255,69,0.14)' }}>
          <IconLock size={28} color="#AAFF45" />
        </div>

        <h2 className="text-[24px] font-extrabold mb-2 text-center">
          {step === 'create' ? 'Create Transaction PIN' : 'Confirm Your PIN'}
        </h2>
        <p className="text-[14px] mb-8 text-center" style={{ color: '#7AAD8A' }}>
          {step === 'create'
            ? 'Set a 4-digit PIN to authorize transactions'
            : 'Enter the same PIN again to confirm'}
        </p>
        {error && <p className="text-[12px] mb-4" style={{ color: '#FF6B35' }}>PINs don't match. Try again.</p>}

        {/* Dots */}
        <div className={`flex gap-4 mb-10 ${shaking ? 'shake' : ''}`}>
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className="w-4 h-4 rounded-full transition-all duration-200"
              style={{
                background: error ? '#FF6B35' : i < current.length ? '#AAFF45' : 'rgba(170,255,69,0.1)',
                border: i < current.length ? 'none' : '1.5px solid rgba(170,255,69,0.2)',
                boxShadow: i < current.length && !error ? '0 0 12px rgba(170,255,69,0.3)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full" style={{ maxWidth: '280px' }}>
          {['1','2','3','4','5','6','7','8','9','','0','del'].map(k => {
            if (k === '') return <div key="empty" />
            if (k === 'del') {
              return (
                <button key="del" onClick={handleDelete} className="h-14 rounded-xl flex items-center justify-center active:scale-90 transition-all" style={{ background: 'rgba(255,107,53,0.06)' }}>
                  <IconDelete size={20} color="#FF6B35" />
                </button>
              )
            }
            return (
              <button key={k} onClick={() => handleDigit(k)} className="h-14 rounded-xl text-[20px] font-bold transition-all active:scale-90" style={{ background: 'rgba(170,255,69,0.05)', color: '#F0FAF0', border: '1px solid rgba(170,255,69,0.06)' }}>
                {k}
              </button>
            )
          })}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="px-6 pb-10 flex justify-center gap-2">
        <div className="h-1.5 rounded-full transition-all" style={{ width: '28px', background: '#AAFF45' }} />
        <div className="h-1.5 rounded-full transition-all" style={{ width: step === 'confirm' ? '28px' : '8px', background: step === 'confirm' ? '#AAFF45' : 'rgba(170,255,69,0.14)' }} />
      </div>
    </div>
  )
}
