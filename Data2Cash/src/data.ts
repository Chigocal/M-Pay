import type {
  Transaction,
  DataPlan,
  Network,
  Beneficiary,
  AppState,
} from "./types";

// ─── Network metadata ────────────────────────────────────────────────────────

export const NETWORKS: { name: Network; color: string; bg: string }[] = [
  { name: "MTN", color: "#FFCC00", bg: "rgba(255,204,0,0.12)" },
  { name: "Glo", color: "#50B651", bg: "rgba(80,182,81,0.12)" },
  { name: "Airtel", color: "#FF0000", bg: "rgba(255,0,0,0.10)" },
  { name: "9mobile", color: "#006B53", bg: "rgba(0,107,83,0.14)" },
];

export const BANKS = [
  "GTBank",
  "Access Bank",
  "First Bank",
  "UBA",
  "Zenith Bank",
  "Fidelity Bank",
  "Polaris Bank",
  "Sterling Bank",
  "Wema Bank",
  "Kuda",
  "Opay",
  "Palmpay",
  "Moniepoint",
];

// ─── Data plans ──────────────────────────────────────────────────────────────

export const DATA_PLANS: DataPlan[] = [
  // MTN
  {
    id: "mtn-500m",
    name: "500MB",
    gb: 0.5,
    price: 150,
    validity: "30 days",
    type: "SME",
    network: "MTN",
  },
  {
    id: "mtn-1g",
    name: "1GB",
    gb: 1,
    price: 300,
    validity: "30 days",
    type: "SME",
    network: "MTN",
  },
  {
    id: "mtn-2g",
    name: "2GB",
    gb: 2,
    price: 600,
    validity: "30 days",
    type: "SME",
    network: "MTN",
  },
  {
    id: "mtn-3g",
    name: "3GB",
    gb: 3,
    price: 900,
    validity: "30 days",
    type: "SME",
    network: "MTN",
  },
  {
    id: "mtn-5g",
    name: "5GB",
    gb: 5,
    price: 1500,
    validity: "30 days",
    type: "SME",
    network: "MTN",
  },
  {
    id: "mtn-10g",
    name: "10GB",
    gb: 10,
    price: 3000,
    validity: "30 days",
    type: "SME",
    network: "MTN",
  },
  // Glo
  {
    id: "glo-1g",
    name: "1GB",
    gb: 1,
    price: 300,
    validity: "30 days",
    type: "Regular",
    network: "Glo",
  },
  {
    id: "glo-2g",
    name: "2GB",
    gb: 2,
    price: 600,
    validity: "30 days",
    type: "Regular",
    network: "Glo",
  },
  {
    id: "glo-5g",
    name: "5GB",
    gb: 5,
    price: 1500,
    validity: "30 days",
    type: "Regular",
    network: "Glo",
  },
  {
    id: "glo-10g",
    name: "10GB",
    gb: 10,
    price: 3000,
    validity: "30 days",
    type: "Regular",
    network: "Glo",
  },
  // Airtel
  {
    id: "air-1g",
    name: "1GB",
    gb: 1,
    price: 300,
    validity: "30 days",
    type: "Regular",
    network: "Airtel",
  },
  {
    id: "air-2g",
    name: "2GB",
    gb: 2,
    price: 600,
    validity: "30 days",
    type: "Regular",
    network: "Airtel",
  },
  {
    id: "air-5g",
    name: "5GB",
    gb: 5,
    price: 1500,
    validity: "30 days",
    type: "Regular",
    network: "Airtel",
  },
  {
    id: "air-10g",
    name: "10GB",
    gb: 10,
    price: 3000,
    validity: "30 days",
    type: "Regular",
    network: "Airtel",
  },
  // 9mobile
  {
    id: "9m-1g",
    name: "1GB",
    gb: 1,
    price: 300,
    validity: "30 days",
    type: "Regular",
    network: "9mobile",
  },
  {
    id: "9m-2g",
    name: "2GB",
    gb: 2,
    price: 600,
    validity: "30 days",
    type: "Regular",
    network: "9mobile",
  },
  {
    id: "9m-5g",
    name: "5GB",
    gb: 5,
    price: 1500,
    validity: "30 days",
    type: "Regular",
    network: "9mobile",
  },
];

// ─── Airtime presets & rates ─────────────────────────────────────────────────

export const AIRTIME_PRESETS = [100, 200, 500, 1000, 2000, 5000];

/** Rate = cash per ₦100 airtime (e.g. 85 means ₦85 cash per ₦100 airtime) */
export const AIRTIME_RATES: Record<Network, number> = {
  MTN: 80,
  Glo: 70,
  Airtel: 75,
  "9mobile": 75,
};

/** Rate = Naira per GB for data-to-cash conversion */
export const DATA_RATES: Record<string, number> = {
  SME: 650,
  Corporate: 550,
  Regular: 500,
  Promo: 350,
};

// ─── Mock transactions ───────────────────────────────────────────────────────

export const MOCK_TXS: Transaction[] = [
  {
    id: "TXN-2848",
    date: "Jul 18, 2026",
    type: "data-to-cash",
    bundle: "SME",
    gb: 5,
    amount: 3250,
    status: "completed",
    bank: "GTBank",
    last4: "4521",
    network: "MTN",
  },
  {
    id: "TXN-2780",
    date: "Jul 16, 2026",
    type: "buy-data",
    plan: "2GB SME",
    amount: 600,
    status: "completed",
    network: "MTN",
    recipientPhone: "08034567890",
  },
  {
    id: "TXN-2651",
    date: "Jul 14, 2026",
    type: "airtime-to-cash",
    airtimeAmount: 2000,
    amount: 1700,
    status: "completed",
    bank: "GTBank",
    last4: "4521",
    network: "MTN",
  },
  {
    id: "TXN-2550",
    date: "Jul 12, 2026",
    type: "withdraw",
    amount: 5000,
    status: "completed",
    bank: "GTBank",
  },
  {
    id: "TXN-2432",
    date: "Jul 09, 2026",
    type: "data-to-cash",
    bundle: "SME",
    gb: 10,
    amount: 6200,
    status: "completed",
    bank: "GTBank",
    last4: "4521",
    network: "MTN",
  },
  {
    id: "TXN-2350",
    date: "Jul 07, 2026",
    type: "buy-airtime",
    amount: 1000,
    status: "completed",
    network: "Airtel",
    recipientPhone: "08098765432",
  },
  {
    id: "TXN-2198",
    date: "Jul 01, 2026",
    type: "data-to-cash",
    bundle: "Promo",
    gb: 3,
    amount: 1050,
    status: "completed",
    bank: "GTBank",
    last4: "4521",
    network: "MTN",
  },
  {
    id: "TXN-2011",
    date: "Jun 25, 2026",
    type: "buy-data",
    plan: "5GB SME",
    amount: 1500,
    status: "pending",
    network: "Glo",
    recipientPhone: "07012345678",
  },
];

export const MOCK_BENEFICIARIES: Beneficiary[] = [
  { id: "b1", name: "Chidi", phone: "08034567890", network: "MTN" },
  { id: "b2", name: "Ngozi", phone: "08098765432", network: "Airtel" },
  { id: "b3", name: "Emeka", phone: "07012345678", network: "Glo" },
];

// ─── Default state ───────────────────────────────────────────────────────────

export const DEFAULT_STATE: AppState = {
  walletBalance: 12750,
  pin: "",
  pinSet: false,
  transactions: MOCK_TXS,
  beneficiaries: MOCK_BENEFICIARIES,
  linkedBank: {
    name: "ADAEZE OKONKWO",
    bank: "GTBank",
    last4: "4521",
    acctNumber: "0123454521",
  },
  userPhone: "08031234567",
  userName: "Adaeze",
  isVerified: false,
  verifiedLegalName: "",
};

// ─── Utilities ───────────────────────────────────────────────────────────────

export const fmt = (n: number) => "₦" + n.toLocaleString("en-NG");

export const genTxId = () => "TXN-" + Math.floor(1000 + Math.random() * 9000);

export const getNetworkMeta = (network: Network) =>
  NETWORKS.find((n) => n.name === network) ?? NETWORKS[0];

export const NAV_SCREENS = [
  "dashboard",
  "convert-hub",
  "buy-hub",
  "history",
  "settings",
] as const;
