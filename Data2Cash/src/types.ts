import type { Dispatch, SetStateAction } from "react";

// ─── Screen routing ──────────────────────────────────────────────────────────

export type Screen =
  // Auth
  | "login"
  | "signup"
  // Onboarding
  | "splash"
  | "how-it-works"
  | "permissions"
  | "bank-link"
  | "pin-setup"
  // Main (bottom nav visible)
  | "dashboard"
  | "convert-hub"
  | "buy-hub"
  | "history"
  | "settings"
  // Convert sub-flows
  | "convert-data-detect"
  | "convert-data-confirm"
  | "convert-data-processing"
  | "convert-data-success"
  | "convert-airtime"
  | "convert-airtime-confirm"
  | "convert-airtime-processing"
  | "convert-airtime-success"
  // Buy sub-flows
  | "buy-data"
  | "buy-data-confirm"
  | "buy-data-processing"
  | "buy-data-success"
  | "buy-airtime"
  | "buy-airtime-confirm"
  | "buy-airtime-processing"
  | "buy-airtime-success"
  // Fund wallet sub-flows
  | "fund-wallet"
  | "fund-wallet-bank"
  | "fund-wallet-card"
  | "fund-wallet-success"
  | "withdraw"
  | "withdraw-success"
  // Misc
  | "beneficiaries";

// ─── Domain types ────────────────────────────────────────────────────────────

export type Network = "MTN" | "Glo" | "Airtel" | "9mobile";

export type TxType =
  | "data-to-cash"
  | "airtime-to-cash"
  | "buy-data"
  | "buy-airtime"
  | "fund-wallet"
  | "withdraw";

export type TxStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  date: string;
  type: TxType;
  status: TxStatus;
  amount: number; // Naira value (always positive)
  network?: Network;
  // Data conversion
  bundle?: string;
  gb?: number;
  // Airtime conversion
  airtimeAmount?: number;
  // Purchases
  recipientPhone?: string;
  plan?: string;
  // Funding
  fundingMethod?: "bank" | "card";
  // Bank details
  bank?: string;
  last4?: string;
}

export interface DataPlan {
  id: string;
  name: string;
  gb: number;
  price: number;
  validity: string;
  type: "SME" | "Corporate" | "Regular";
  network: Network;
}

export interface Beneficiary {
  id: string;
  name: string;
  phone: string;
  network: Network;
}

// ─── App state ───────────────────────────────────────────────────────────────

export interface AppState {
  walletBalance: number;
  pin: string;
  pinSet: boolean;
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  linkedBank: {
    name: string;
    bank: string;
    last4: string;
    acctNumber: string;
  };
  userPhone: string;
  userName: string;
  isVerified: boolean;
  verifiedLegalName: string;
  lastWithdrawal?: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    reference: string;
  };
}

// ─── Component props ─────────────────────────────────────────────────────────

export interface ScreenProps {
  go: (s: Screen) => void;
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  requestPin: (onSuccess: () => void) => void;
}
