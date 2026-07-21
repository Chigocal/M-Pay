import { useState, useEffect } from "react";
import type { ScreenProps } from "@/types";
import {
  BackBtn,
  PrimaryBtn,
  GhostBtn,
  IconCreditCard,
  IconWallet,
  IconCheckCircle,
  IconCopy,
  IconX,
} from "@/components";
import { fmt, genTxId } from "@/data";

// ─── Module-level draft ──────────────────────────────────────────────────────

let _fundDraft = { amount: 0, method: "" as "bank" | "card" | "" };

// ─── WithdrawFlow ──────────────────────────────────────────────────────────

export function WithdrawFlow({ go, state, setState }: ScreenProps) {
  const [amount, setAmount] = useState("");
  const [banks, setBanks] = useState<
    Array<{ bankCode: string; bankName: string }>
  >([]);
  const [selectedBank, setSelectedBank] = useState<{
    bankCode: string;
    bankName: string;
  } | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState(state.userName || "");
  const [narration, setNarration] = useState("M-Pay withdrawal");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [reference, setReference] = useState("");
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    const loadBanks = async () => {
      setBankLoading(true);
      setBankError("");
      try {
        const res = await fetch(`${API_BASE}/payouts/banks`, {
          headers: getHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.detail || "Unable to load banks");
        }
        const loadedBanks = Array.isArray(data.banks) ? data.banks : [];
        setBanks(loadedBanks);
        setSelectedBank(loadedBanks[0] ?? null);
      } catch (err: any) {
        setBankError(err.message || "Failed to fetch supported banks");
      } finally {
        setBankLoading(false);
      }
    };

    loadBanks();
  }, []);

  const resetState = () => {
    setError("");
    setMessage("");
    setRequiresOtp(false);
    setReference("");
    setOtp("");
  };

  const handleInitiate = async () => {
    if (!amount || Number(amount) < 100) {
      setError("Enter a withdrawal amount of at least ₦100");
      return;
    }
    if (!accountNumber || !accountName || !selectedBank?.bankCode) {
      setError("Please complete the bank details before requesting a payout");
      return;
    }

    resetState();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/payouts/initiate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          amount: Number(amount),
          bank_code: selectedBank.bankCode,
          bank_name: selectedBank.bankName,
          account_number: accountNumber,
          account_name: accountName,
          narration: narration || "M-Pay withdrawal",
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || "Unable to start withdrawal");
      }

      if (data.requires_otp) {
        setRequiresOtp(true);
        setReference(data.reference || "");
        setMessage(
          data.message ||
            "Monnify sent an OTP request; enter it to finalize the payout.",
        );
      } else {
        setState((s) => ({
          ...s,
          walletBalance: Number(data.new_wallet_balance ?? s.walletBalance),
          lastWithdrawal: {
            amount: Number(amount),
            bankName: selectedBank.bankName,
            accountNumber,
            accountName,
            reference: data.reference || "",
          },
        }));
        go("withdraw-success");
      }
    } catch (err: any) {
      setError(err.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!reference || otp.length < 4) {
      setError("Enter the OTP sent to your phone or email");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/payouts/authorize`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ reference, otp }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || "Unable to authorize withdrawal");
      }

      setMessage("Withdrawal completed successfully.");
      setState((s) => ({
        ...s,
        walletBalance: Number(data.new_wallet_balance ?? s.walletBalance),
        lastWithdrawal: {
          amount: Number(amount),
          bankName: selectedBank.bankName,
          accountNumber,
          accountName,
          reference,
        },
      }));
      go("withdraw-success");
    } catch (err: any) {
      setError(err.message || "Withdrawal authorization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen animate-fade-in"
      style={{ background: "#030F07", color: "#F0FAF0" }}
    >
      <div className="px-6 pt-3 pb-4 flex items-center gap-3">
        <BackBtn onBack={() => go("dashboard")} />
        <h2 className="text-[18px] font-extrabold">Withdraw</h2>
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        <div
          className="p-5 rounded-2xl mb-6"
          style={{
            background: "#0C2318",
            border: "1px solid rgba(170,255,69,0.09)",
          }}
        >
          <p className="text-[11px] mb-1" style={{ color: "#5A8870" }}>
            Available balance
          </p>
          <p
            className="text-[28px] font-extrabold"
            style={{ color: "#AAFF45" }}
          >
            {fmt(state.walletBalance)}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2 block"
              style={{ color: "#5A8870" }}
            >
              Amount
            </label>
            <input
              type="tel"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter amount"
              className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
              style={{
                background: "#0C2318",
                border: "1px solid rgba(170,255,69,0.09)",
                color: "#F0FAF0",
              }}
            />
          </div>

          <div>
            <label
              className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2 block"
              style={{ color: "#5A8870" }}
            >
              Bank
            </label>
            {bankLoading ? (
              <div className="px-4 py-3.5 rounded-xl bg-[#0C2318] text-[#7AAD8A]">
                Loading banks…
              </div>
            ) : (
              <select
                value={selectedBank?.bankCode ?? ""}
                onChange={(e) => {
                  const chosen = banks.find((bank) => bank.bankCode === e.target.value);
                  setSelectedBank(chosen ?? null);
                }}
                className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
                style={{
                  background: "#0C2318",
                  border: "1px solid rgba(170,255,69,0.09)",
                  color: "#F0FAF0",
                }}
              >
                <option value="" disabled>
                  Select a bank
                </option>
                {banks.map((bank) => (
                  <option key={bank.bankCode} value={bank.bankCode}>
                    {bank.bankName}
                  </option>
                ))}
              </select>
            )}
            {bankError && (
              <p className="text-[12px] mt-2" style={{ color: "#FF9F6B" }}>
                {bankError}
              </p>
            )}
          </div>

          <div>
            <label
              className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2 block"
              style={{ color: "#5A8870" }}
            >
              Account Number
            </label>
            <input
              type="tel"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit account number"
              className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
              style={{
                background: "#0C2318",
                border: "1px solid rgba(170,255,69,0.09)",
                color: "#F0FAF0",
              }}
            />
          </div>

          <div>
            <label
              className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2 block"
              style={{ color: "#5A8870" }}
            >
              Account Name
            </label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Name on bank account"
              className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
              style={{
                background: "#0C2318",
                border: "1px solid rgba(170,255,69,0.09)",
                color: "#F0FAF0",
              }}
            />
          </div>

          <div>
            <label
              className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2 block"
              style={{ color: "#5A8870" }}
            >
              Narration
            </label>
            <input
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Optional narration"
              className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
              style={{
                background: "#0C2318",
                border: "1px solid rgba(170,255,69,0.09)",
                color: "#F0FAF0",
              }}
            />
          </div>

          {requiresOtp && (
            <div>
              <label
                className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2 block"
                style={{ color: "#5A8870" }}
              >
                OTP
              </label>
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter Monnify OTP"
                className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
                style={{
                  background: "#0C2318",
                  border: "1px solid rgba(170,255,69,0.09)",
                  color: "#F0FAF0",
                }}
              />
            </div>
          )}

          {error && (
            <p className="text-[12px]" style={{ color: "#FF9F6B" }}>
              {error}
            </p>
          )}
          {message && (
            <p className="text-[12px]" style={{ color: "#AAFF45" }}>
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-10 pt-6 flex flex-col gap-3">
        {!requiresOtp ? (
          <PrimaryBtn
            label={loading ? "Processing…" : "Request Withdrawal"}
            onClick={handleInitiate}
            disabled={loading}
          />
        ) : (
          <PrimaryBtn
            label={loading ? "Authorizing…" : "Submit OTP"}
            onClick={handleAuthorize}
            disabled={loading}
          />
        )}
        <GhostBtn label="Cancel" onClick={() => go("dashboard")} />
      </div>
    </div>
  );
}

// ─── FundWallet ──────────────────────────────────────────────────────────────

export function FundWallet({ go, state }: ScreenProps) {
  const [amount, setAmount] = useState(_fundDraft.amount || 0);
  const [custom, setCustom] = useState("");
  const presets = [1000, 2000, 5000, 10000, 20000];

  const effectiveAmt = amount || parseInt(custom) || 0;

  const handleMethod = (method: "bank" | "card") => {
    if (effectiveAmt < 100) return;
    _fundDraft = { amount: effectiveAmt, method };
    go(method === "bank" ? "fund-wallet-bank" : "fund-wallet-card");
  };

  return (
    <div
      className="flex flex-col min-h-screen animate-fade-in"
      style={{ background: "#030F07", color: "#F0FAF0" }}
    >
      <div className="px-6 pt-3 pb-4 flex items-center gap-3">
        <BackBtn onBack={() => go("dashboard")} />
        <h2 className="text-[18px] font-extrabold">Fund Wallet</h2>
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        {/* Balance */}
        <div
          className="p-5 rounded-2xl mb-6 text-center"
          style={{
            background: "#0C2318",
            border: "1px solid rgba(170,255,69,0.09)",
          }}
        >
          <p className="text-[11px] mb-1" style={{ color: "#5A8870" }}>
            Current Balance
          </p>
          <p
            className="text-[32px] font-extrabold"
            style={{ color: "#AAFF45" }}
          >
            {fmt(state.walletBalance)}
          </p>
        </div>

        {/* Amount */}
        <p
          className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2"
          style={{ color: "#5A8870" }}
        >
          Select Amount
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {presets.map((a) => (
            <button
              key={a}
              onClick={() => {
                setAmount(a);
                setCustom("");
              }}
              className="py-3 rounded-xl text-[13px] font-bold transition-all active:scale-95"
              style={{
                background: amount === a ? "rgba(170,255,69,0.1)" : "#0C2318",
                border: `1.5px solid ${amount === a ? "#AAFF45" : "rgba(170,255,69,0.07)"}`,
                color: amount === a ? "#AAFF45" : "#F0FAF0",
              }}
            >
              {fmt(a)}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-[11px] mb-2" style={{ color: "#5A8870" }}>
            Or enter custom amount
          </p>
          <input
            type="tel"
            placeholder="Enter amount"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value.replace(/\D/g, ""));
              setAmount(0);
            }}
            className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
            style={{
              background: "#0C2318",
              border: `1px solid ${custom ? "rgba(170,255,69,0.3)" : "rgba(170,255,69,0.09)"}`,
              color: "#F0FAF0",
              fontFamily: "DM Mono, monospace",
            }}
          />
        </div>

        {/* Payment methods */}
        <p
          className="text-[11px] font-bold tracking-[0.14em] uppercase mb-3"
          style={{ color: "#5A8870" }}
        >
          Choose Payment Method
        </p>

        <button
          onClick={() => handleMethod("bank")}
          className="w-full p-4 rounded-2xl text-left mb-3 transition-all active:scale-[0.98]"
          style={{
            background: "#0C2318",
            border: "1px solid rgba(170,255,69,0.09)",
            opacity: effectiveAmt < 100 ? 0.5 : 1,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(170,255,69,0.09)" }}
            >
              <IconCreditCard size={20} color="#7AAD8A" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold">Bank Transfer</p>
              <p className="text-[12px]" style={{ color: "#7AAD8A" }}>
                Transfer to your unique account number
              </p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{ background: "rgba(170,255,69,0.08)", color: "#AAFF45" }}
            >
              FREE
            </span>
          </div>
        </button>

        <button
          onClick={() => handleMethod("card")}
          className="w-full p-4 rounded-2xl text-left mb-4 transition-all active:scale-[0.98]"
          style={{
            background: "#0C2318",
            border: "1px solid rgba(170,255,69,0.09)",
            opacity: effectiveAmt < 100 ? 0.5 : 1,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(170,255,69,0.09)" }}
            >
              <IconWallet size={20} color="#7AAD8A" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold">Card Payment</p>
              <p className="text-[12px]" style={{ color: "#7AAD8A" }}>
                Pay with debit card via Paystack
              </p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{ background: "rgba(255,107,53,0.08)", color: "#FF9F6B" }}
            >
              1.5% fee
            </span>
          </div>
        </button>

        {effectiveAmt < 100 && effectiveAmt > 0 && (
          <p className="text-[11px]" style={{ color: "#FF6B35" }}>
            Minimum deposit is ₦100
          </p>
        )}
      </div>
    </div>
  );
}

// ─── FundWalletBank ──────────────────────────────────────────────────────────

export function FundWalletBank({ go, state }: ScreenProps) {
  const [copied, setCopied] = useState(false);

  const acctNumber = "7821234567";
  const amount = _fundDraft.amount;

  const handleCopy = () => {
    navigator.clipboard?.writeText(acctNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex flex-col min-h-screen animate-fade-in"
      style={{ background: "#030F07", color: "#F0FAF0" }}
    >
      <div className="px-6 pt-3 pb-4 flex items-center gap-3">
        <BackBtn onBack={() => go("fund-wallet")} />
        <h2 className="text-[18px] font-extrabold">Bank Transfer</h2>
      </div>

      <div className="flex-1 px-6">
        <p className="text-[14px] mb-6" style={{ color: "#7AAD8A" }}>
          Transfer{" "}
          <span className="font-bold" style={{ color: "#AAFF45" }}>
            {fmt(amount)}
          </span>{" "}
          to the account below:
        </p>

        <div
          className="p-5 rounded-2xl mb-4"
          style={{
            background: "#0C2318",
            border: "1px solid rgba(170,255,69,0.12)",
          }}
        >
          {[
            { label: "Bank", value: "Wema Bank" },
            {
              label: "Account Number",
              value: acctNumber,
              mono: true,
              copyable: true,
            },
            {
              label: "Account Name",
              value: `DATA2CASH/${state.userName.toUpperCase()}`,
            },
            { label: "Amount", value: fmt(amount), lime: true },
          ].map(({ label, value, mono, copyable, lime }) => (
            <div
              key={label}
              className="flex items-center justify-between mb-4 last:mb-0"
            >
              <span className="text-[12px]" style={{ color: "#5A8870" }}>
                {label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-[14px] font-bold"
                  style={{
                    fontFamily: mono ? "DM Mono, monospace" : "inherit",
                    letterSpacing: mono ? "0.1em" : "normal",
                    color: lime ? "#AAFF45" : "#F0FAF0",
                  }}
                >
                  {value}
                </span>
                {copyable && (
                  <button
                    onClick={handleCopy}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                    style={{
                      background: copied
                        ? "rgba(170,255,69,0.15)"
                        : "rgba(170,255,69,0.06)",
                    }}
                  >
                    <IconCopy
                      size={13}
                      color={copied ? "#AAFF45" : "#5A8870"}
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {copied && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 animate-fade-in"
            style={{ background: "rgba(170,255,69,0.08)" }}
          >
            <IconCheckCircle size={14} />
            <span
              className="text-[12px] font-semibold"
              style={{ color: "#AAFF45" }}
            >
              Account number copied!
            </span>
          </div>
        )}

        <div
          className="p-3.5 rounded-xl"
          style={{
            background: "rgba(170,255,69,0.04)",
            border: "1px solid rgba(170,255,69,0.06)",
          }}
        >
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: "#5A8870" }}
          >
            💡 Transfer exactly{" "}
            <span className="font-semibold" style={{ color: "#7AAD8A" }}>
              {fmt(amount)}
            </span>{" "}
            to avoid delays. Your wallet will be credited automatically within{" "}
            <span className="font-semibold" style={{ color: "#7AAD8A" }}>
              5 minutes
            </span>
            .
          </p>
        </div>
      </div>

      <div className="px-6 pb-10 pt-6 flex flex-col gap-3">
        <PrimaryBtn
          label="I've Made the Transfer"
          onClick={() => go("fund-wallet-success")}
        />
        <GhostBtn label="Cancel" onClick={() => go("dashboard")} />
      </div>
    </div>
  );
}

// ─── FundWalletCard ──────────────────────────────────────────────────────────

export function FundWalletCard({ go, requestPin }: ScreenProps) {
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const amount = _fundDraft.amount;
  const fee = Math.round(amount * 0.015);
  const total = amount + fee;

  const ready =
    cardNum.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length === 3;

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const inputStyle = (filled: boolean) => ({
    background: "#0C2318",
    border: `1px solid ${filled ? "rgba(170,255,69,0.3)" : "rgba(170,255,69,0.09)"}`,
    color: "#F0FAF0",
    outline: "none",
    borderRadius: "12px",
    padding: "14px 16px",
    width: "100%",
    fontSize: "14px",
    fontFamily: "DM Mono, monospace",
    letterSpacing: "0.08em",
  });

  return (
    <div
      className="flex flex-col min-h-screen animate-fade-in"
      style={{ background: "#030F07", color: "#F0FAF0" }}
    >
      <div className="px-6 pt-3 pb-4 flex items-center gap-3">
        <BackBtn onBack={() => go("fund-wallet")} />
        <h2 className="text-[18px] font-extrabold">Card Payment</h2>
      </div>

      <div className="flex-1 px-6">
        {/* Amount summary */}
        <div
          className="p-4 rounded-2xl mb-6"
          style={{
            background: "#0C2318",
            border: "1px solid rgba(170,255,69,0.09)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px]" style={{ color: "#5A8870" }}>
              Amount
            </span>
            <span className="text-[14px] font-bold">{fmt(amount)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px]" style={{ color: "#5A8870" }}>
              Processing fee (1.5%)
            </span>
            <span
              className="text-[14px] font-bold"
              style={{ color: "#FF9F6B" }}
            >
              {fmt(fee)}
            </span>
          </div>
          <div
            className="my-1"
            style={{ borderTop: "1px solid rgba(170,255,69,0.08)" }}
          />
          <div className="flex items-center justify-between pt-2">
            <span className="text-[14px] font-bold">Total</span>
            <span
              className="text-[20px] font-extrabold"
              style={{ color: "#AAFF45" }}
            >
              {fmt(total)}
            </span>
          </div>
        </div>

        {/* Card number */}
        <div className="mb-4">
          <label
            className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase"
            style={{ color: "#5A8870" }}
          >
            Card Number
          </label>
          <input
            type="tel"
            placeholder="0000 0000 0000 0000"
            value={cardNum}
            onChange={(e) => setCardNum(formatCard(e.target.value))}
            maxLength={19}
            style={inputStyle(cardNum.replace(/\s/g, "").length === 16)}
          />
        </div>

        {/* Expiry + CVV */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label
              className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase"
              style={{ color: "#5A8870" }}
            >
              Expiry
            </label>
            <input
              type="tel"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              maxLength={5}
              style={inputStyle(expiry.length === 5)}
            />
          </div>
          <div className="flex-1">
            <label
              className="block text-[11px] font-bold mb-2 tracking-[0.14em] uppercase"
              style={{ color: "#5A8870" }}
            >
              CVV
            </label>
            <input
              type="password"
              placeholder="•••"
              value={cvv}
              onChange={(e) =>
                setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
              }
              maxLength={3}
              style={inputStyle(cvv.length === 3)}
            />
          </div>
        </div>

        <div
          className="p-3 rounded-xl"
          style={{ background: "rgba(170,255,69,0.04)" }}
        >
          <p className="text-[11px]" style={{ color: "#5A8870" }}>
            🔒 Secured by Paystack. Your card details are encrypted.
          </p>
        </div>
      </div>

      <div className="px-6 pb-10 pt-6 flex flex-col gap-3">
        <PrimaryBtn
          label={`Pay ${fmt(total)}`}
          onClick={() => requestPin(() => go("fund-wallet-success"))}
          disabled={!ready}
        />
        <GhostBtn label="Cancel" onClick={() => go("fund-wallet")} />
      </div>
    </div>
  );
}

// ─── FundWalletSuccess ───────────────────────────────────────────────────────

export function FundWalletSuccess({ go, state, setState }: ScreenProps) {
  const amount = _fundDraft.amount;
  const method = _fundDraft.method;
  const txId = genTxId();

  useEffect(() => {
    setState((s) => ({
      ...s,
      walletBalance: s.walletBalance + amount,
      transactions: [
        {
          id: txId,
          date: new Date().toLocaleDateString("en-NG", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          type: "fund-wallet" as const,
          status: "completed" as const,
          amount,
          fundingMethod: method as "bank" | "card",
        },
        ...s.transactions,
      ],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="flex flex-col min-h-screen animate-fade-in"
      style={{ background: "#030F07", color: "#F0FAF0" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative flex items-center justify-center mb-8">
          <div
            className="absolute w-36 h-36 rounded-full animate-pulse-ring"
            style={{ background: "rgba(170,255,69,0.1)" }}
          />
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(170,255,69,0.1)",
              border: "1.5px solid rgba(170,255,69,0.3)",
              boxShadow: "0 0 60px rgba(170,255,69,0.12)",
            }}
          >
            <IconCheckCircle size={44} />
          </div>
        </div>

        <p
          className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3"
          style={{ color: "#AAFF45" }}
        >
          Wallet Funded
        </p>
        <p className="text-[48px] font-extrabold leading-none mb-2 shimmer-text">
          {fmt(amount)}
        </p>
        <p className="text-[15px] mb-1" style={{ color: "#7AAD8A" }}>
          added to your wallet
        </p>
        <p className="text-[13px] mb-8" style={{ color: "#5A8870" }}>
          via {method === "bank" ? "Bank Transfer" : "Card Payment"}
        </p>

        <div
          className="w-full p-4 rounded-2xl text-left"
          style={{
            background: "#0C2318",
            border: "1px solid rgba(170,255,69,0.09)",
          }}
        >
          {[
            { label: "Transaction ID", value: txId, lime: true },
            { label: "Date & time", value: new Date().toLocaleString("en-NG") },
            {
              label: "New balance",
              value: fmt(state.walletBalance + amount),
              lime: true,
            },
          ].map(({ label, value, lime }, i, arr) => (
            <div
              key={label}
              className="flex items-center justify-between"
              style={{
                paddingBottom: i < arr.length - 1 ? "10px" : 0,
                marginBottom: i < arr.length - 1 ? "10px" : 0,
                borderBottom:
                  i < arr.length - 1
                    ? "1px solid rgba(170,255,69,0.06)"
                    : "none",
              }}
            >
              <span className="text-[12px]" style={{ color: "#5A8870" }}>
                {label}
              </span>
              <span
                className="text-[12px] font-semibold"
                style={{
                  fontFamily: "DM Mono, monospace",
                  color: lime ? "#AAFF45" : "#F0FAF0",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-10 flex flex-col gap-3">
        <PrimaryBtn label="Back to Dashboard" onClick={() => go("dashboard")} />
      </div>
    </div>
  );
}
