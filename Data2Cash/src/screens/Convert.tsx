import React, { useCallback, useEffect, useState } from "react";
import { ScreenProps, Network } from "@/types";
import { fmt, AIRTIME_RATES, genTxId } from "@/data";
import {
  IconSignal,
  IconPhone,
  BackBtn,
  NetworkSelector,
  PrimaryBtn,
} from "@/components";

export function ConvertHub({ go }: ScreenProps) {
  return (
    <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4">
      <div className="flex items-center gap-3 mb-8">
        <BackBtn onBack={() => go("dashboard")} />
        <h1 className="text-xl font-medium">Convert to Cash</h1>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => go("convert-data-detect")}
          className="bg-[#0C2318] p-5 rounded-2xl border border-[#143324] flex items-center gap-4 text-left hover:bg-[#112F20] transition-colors"
        >
          <div className="bg-[#030F07] p-3 rounded-full">
            <IconSignal color="#AAFF45" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-[#AAFF45]">Data → Cash</h2>
            <p className="text-[#5A8870] text-sm">
              Convert excess data bundles to Naira.
            </p>
            <p className="text-[#7AAD8A] text-xs mt-1">Rates up to ₦650/GB</p>
          </div>
        </button>

        <button
          onClick={() => go("convert-airtime")}
          className="bg-[#0C2318] p-5 rounded-2xl border border-[#143324] flex items-center gap-4 text-left hover:bg-[#112F20] transition-colors"
        >
          <div className="bg-[#030F07] p-3 rounded-full">
            <IconPhone color="#AAFF45" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-[#AAFF45]">
              Airtime → Cash
            </h2>
            <p className="text-[#5A8870] text-sm">
              Convert airtime to cash at best rates.
            </p>
            <p className="text-[#7AAD8A] text-xs mt-1">Up to 80% return</p>
          </div>
        </button>
      </div>

      <div className="bottom-nav-spacer h-24" />
    </div>
  );
}

export function ConvertDataDetect({
  go,
  state,
  setState,
  requestPin,
}: ScreenProps) {
  const [step, setStep] = useState<
    "select" | "detect" | "confirm" | "processing" | "success"
  >("select");
  const [network, setNetwork] = useState<Network>("MTN");
  const [phoneNumber, setPhoneNumber] = useState(state.userPhone || "");
  const [detectStep, setDetectStep] = useState(0);

  // Dynamic mock values determined during detection
  const [dataType, setDataType] = useState("SME Data Bundle");
  const [dataBalance, setDataBalance] = useState("10.0 GB");
  const [payoutAmount, setPayoutAmount] = useState(6500);

  const ratePerGB = 650;

  // Run the detection simulation when we enter the detect step
  useEffect(() => {
    if (step !== "detect") return;

    // Simulate reading plan based on network
    let type = "SME Data Bundle";
    let balance = 10;
    if (network === "AIRTEL") {
      type = "CG Gifting Plan";
      balance = 12;
    } else if (network === "GLO") {
      type = "Mega Data Plan";
      balance = 20;
    } else if (network === "9MOBILE") {
      type = "SME Gifting Plan";
      balance = 8;
    }

    // Add some random variation based on the phone number
    const lastDigit = parseInt(phoneNumber.slice(-1)) || 5;
    const variation = lastDigit % 3; // 0, 1, 2
    const finalBalance = balance + variation * 2.5; // e.g. 10, 12.5, 15

    setDataType(type);
    setDataBalance(`${finalBalance.toFixed(1)} GB`);
    setPayoutAmount(finalBalance * ratePerGB);

    const t1 = setTimeout(() => setDetectStep(1), 900);
    const t2 = setTimeout(() => setDetectStep(2), 1900);
    const t3 = setTimeout(() => setDetectStep(3), 2900);
    const t4 = setTimeout(() => {
      setStep("confirm");
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [step, network, phoneNumber]);

  const handleInitiateDetect = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }
    setDetectStep(0);
    setStep("detect");
  };

  const handleConfirm = () => {
    requestPin(() => {
      setStep("processing");
      // Simulate credit processing
      setTimeout(() => {
        const tx = {
          id: genTxId(),
          type: "data-to-cash" as const,
          amount: payoutAmount,
          date: new Date().toISOString(),
          status: "completed" as const,
          details: {
            network,
            bundle: `${dataBalance} (${dataType})`,
          },
        };

        setState((s) => ({
          ...s,
          walletBalance: s.walletBalance + payoutAmount,
          transactions: [tx, ...s.transactions],
        }));

        setStep("success");
      }, 3000);
    });
  };

  const detectPhases = [
    "Detecting SIM...",
    "Checking data balance...",
    "Reading bundle type...",
    "Reading plan details...",
  ];

  if (step === "select") {
    return (
      <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <BackBtn onBack={() => go("convert-hub")} />
          <h1 className="text-xl font-medium">Convert Data</h1>
        </div>

        <div className="mb-6">
          <label className="block text-[#7AAD8A] text-sm mb-3 font-semibold uppercase tracking-wider">
            Select Network
          </label>
          <NetworkSelector selected={network} onSelect={setNetwork} />
        </div>

        <div className="mb-6">
          <label className="block text-[#7AAD8A] text-sm mb-2 font-semibold uppercase tracking-wider">
            Sender Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="08031234567"
            className="w-full bg-[#0C2318] border border-[#143324] rounded-xl px-4 py-4 text-[#F0FAF0] placeholder-[#5A8870] outline-none focus:border-[#AAFF45]"
          />
        </div>

        <div className="bg-[#112F20] p-5 rounded-2xl border border-[#143324] mb-8">
          <div className="text-[#7AAD8A] text-sm mb-1">Conversion Rate</div>
          <div className="text-2xl font-bold text-[#AAFF45]">
            ₦{ratePerGB}/GB
          </div>
          <p className="text-[#5A8870] text-xs mt-2">
            Get paid instantly for unused mobile data plans.
          </p>
        </div>

        <div className="mt-auto pb-6">
          <PrimaryBtn
            onClick={handleInitiateDetect}
            disabled={phoneNumber.length < 10}
            label="Scan & Detect Data Balance →"
          />
        </div>
      </div>
    );
  }

  if (step === "detect") {
    return (
      <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <BackBtn onBack={() => setStep("select")} />
          <h1 className="text-xl font-medium">Detecting Data</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#143324] border-t-[#AAFF45] rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-[#AAFF45] font-medium text-lg">
              {detectPhases[Math.min(detectStep, 3)]}
            </h2>
            <p className="text-[#5A8870] text-sm mt-2">
              Scanning network profiles for active data bundles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <BackBtn onBack={() => setStep("select")} />
          <h1 className="text-xl font-medium">Review Conversion</h1>
        </div>

        <div className="bg-[#0C2318] p-5 rounded-2xl border border-[#143324] mb-6">
          <h2 className="text-[#7AAD8A] text-sm mb-4 font-medium">
            Conversion Breakdown
          </h2>

          <div className="flex justify-between items-center py-3 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Phone / Network</span>
            <span className="text-[#F0FAF0] text-sm font-medium">
              {phoneNumber} ({network})
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Data Plan Type</span>
            <span className="text-[#F0FAF0] text-sm font-medium">
              {dataType}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Detected Balance</span>
            <span className="text-[#AAFF45] text-sm font-bold">
              {dataBalance}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Rate</span>
            <span className="text-[#F0FAF0] text-sm font-medium">
              ₦{ratePerGB}/GB
            </span>
          </div>
        </div>

        <div className="bg-[#030F07] border border-[#143324] p-5 rounded-2xl mb-6">
          <div className="text-[#7AAD8A] text-sm mb-1">You Receive</div>
          <div className="text-3xl font-bold text-[#AAFF45]">
            ₦{fmt(payoutAmount).replace("₦", "")}
          </div>
        </div>

        {state.linkedBank && (
          <div className="bg-[#0C2318] p-4 rounded-xl border border-[#143324] mb-8">
            <div className="text-[#5A8870] text-xs mb-1">Destination Bank</div>
            <div className="text-[#F0FAF0] text-sm font-medium">
              {state.linkedBank.bank}
            </div>
            <div className="text-[#7AAD8A] text-xs mt-1">
              Acct ending in {state.linkedBank.last4}
            </div>
          </div>
        )}

        <div className="mt-auto pb-6">
          <PrimaryBtn
            onClick={handleConfirm}
            label={`Confirm & Convert ${dataBalance} →`}
          />
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4 items-center justify-center animate-fade-in">
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <div className="absolute inset-0 border-4 border-[#143324] rounded-full" />
          <div className="absolute inset-0 border-4 border-t-[#AAFF45] rounded-full animate-spin" />
          <IconSignal color="#AAFF45" size={32} />
        </div>
        <h2 className="text-[#AAFF45] text-lg font-medium text-center">
          Data transfer initiated...
        </h2>
        <p className="text-[#5A8870] text-xs mt-3 text-center px-6">
          Converting data bundle to cash and updating wallet balance.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center py-10">
        <div className="w-20 h-20 bg-[#112F20] rounded-full flex items-center justify-center mb-6">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#AAFF45"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-medium mb-2">Transfer Complete</h1>
        <div className="text-4xl font-bold text-[#AAFF45] mb-8 animate-pulse">
          ₦{fmt(payoutAmount).replace("₦", "")}
        </div>

        <div className="bg-[#0C2318] p-5 rounded-2xl border border-[#143324] w-full text-left">
          <div className="flex justify-between items-center py-2 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Transaction ID</span>
            <span className="text-[#F0FAF0] text-sm font-mono">
              {genTxId()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Date</span>
            <span className="text-[#F0FAF0] text-sm">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Bundle Sold</span>
            <span className="text-[#F0FAF0] text-sm">{dataBalance}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[#5A8870] text-sm">Rate</span>
            <span className="text-[#F0FAF0] text-sm">₦{ratePerGB}/GB</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-6">
        <PrimaryBtn
          onClick={() => setStep("select")}
          label="Convert More Data"
        />
        <button
          onClick={() => go("history")}
          className="w-full py-4 text-[#AAFF45] font-medium border border-[#143324] rounded-xl hover:bg-[#112F20]"
        >
          View History
        </button>
        <button
          onClick={() => go("dashboard")}
          className="w-full py-4 text-[#5A8870] font-medium hover:text-[#F0FAF0]"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export function ConvertAirtimeSelect({ go, state, setState }: ScreenProps) {
  const [step, setStep] = useState<
    "select" | "otp" | "confirm" | "processing" | "success"
  >("select");
  const [network, setNetwork] = useState<Network>("MTN");
  const [phoneNumber, setPhoneNumber] = useState(state.userPhone || "");
  const [amount, setAmount] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [detectedBalance, setDetectedBalance] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [txnRef, setTxnRef] = useState("");
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<
    "pending" | "completed" | "failed"
  >("completed");

  const API_BASE = "http://127.0.0.1:8000";
  const rate = AIRTIME_RATES[network] || 0;
  const numAmount = parseInt(amount || "0", 10);
  const receiveAmount = numAmount * (rate / 100);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  useEffect(() => {
    if (!transactionId || transactionStatus !== "pending") return;

    const poll = window.setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/conversions/transaction/${transactionId}`,
          {
            headers: getHeaders(),
          },
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Unable to check transaction status");
        }

        const nextStatus = String(data.status || "").toLowerCase();
        if (nextStatus === "completed") {
          setTransactionStatus("completed");
          setPayoutAmount(Number(data.net_payout ?? payoutAmount));
          setState((s) => ({
            ...s,
            walletBalance: data.net_payout
              ? s.walletBalance + Number(data.net_payout)
              : s.walletBalance,
          }));
          window.clearInterval(poll);
        } else if (nextStatus === "failed") {
          setTransactionStatus("failed");
          window.clearInterval(poll);
        }
      } catch (err) {
        console.error("Transaction polling failed", err);
      }
    }, 4000);

    return () => window.clearInterval(poll);
  }, [
    API_BASE,
    getHeaders,
    payoutAmount,
    transactionId,
    transactionStatus,
    setState,
  ]);

  // 1. Initiate Conversion (Send OTP)
  const handleInitiate = async () => {
    if (!phoneNumber || numAmount < 50) {
      setError("Please enter a valid phone number and amount (Min ₦50)");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/conversions/initiate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          network,
          phone_number: phoneNumber,
          amount: numAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send OTP");
      }

      setStep("otp");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP (Detect Balance)
  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Please enter the OTP sent to your phone");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/conversions/verify-otp`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          network,
          phone_number: phoneNumber,
          otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "OTP verification failed");
      }

      setSessionId(data.session_id);
      setDetectedBalance(data.airtime_balance || "N/A");
      setStep("confirm");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // 3. Execute Transfer (Provide Telecom PIN)
  const handleExecuteTransfer = async () => {
    if (!pin) {
      setError("Please enter your network transfer PIN");
      return;
    }
    setError("");
    setStep("processing");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/conversions/execute-transfer`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          network,
          phone_number: phoneNumber,
          amount: numAmount,
          pin,
          session_id: sessionId,
          initial_balance: detectedBalance
            ? parseFloat(detectedBalance.replace(/[^0-9.]/g, ""))
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Airtime transfer failed");
      }

      const isPending = data.status === "pending_reconciliation";
      setTransactionStatus(isPending ? "pending" : "completed");
      setPayoutAmount(data.payout_amount);
      setTxnRef(data.reference);
      if (data.transaction_id) {
        setTransactionId(data.transaction_id);
      }

      // Update parent WalletBalance and prepend transaction
      const tx = {
        id: data.reference,
        type: "airtime-to-cash" as const,
        amount: data.payout_amount,
        date: new Date().toISOString(),
        status: isPending ? ("pending" as const) : ("completed" as const),
        details: {
          network,
          amount: numAmount,
        },
      };

      setState((s) => ({
        ...s,
        walletBalance: isPending ? s.walletBalance : data.new_wallet_balance,
        transactions: [tx, ...s.transactions],
      }));

      setStep("success");
    } catch (err: any) {
      setError(err.message || "Execution failed");
      setStep("confirm"); // Go back to confirm step on error so they can re-try
    } finally {
      setLoading(false);
    }
  };

  if (step === "select") {
    const isValid =
      numAmount >= 50 && numAmount <= 50000 && phoneNumber.length >= 10;
    return (
      <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4">
        <div className="flex items-center gap-3 mb-8">
          <BackBtn onBack={() => go("convert-hub")} />
          <h1 className="text-xl font-medium">Convert Airtime</h1>
        </div>

        {error && (
          <div className="bg-[rgba(255,107,53,0.1)] border border-[#FF6B35] text-[#FF6B35] rounded-xl p-4 text-xs font-semibold mb-6">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-[#7AAD8A] text-sm mb-3">
            Select Network
          </label>
          <NetworkSelector selected={network} onSelect={setNetwork} />
        </div>

        <div className="mb-6">
          <label className="block text-[#7AAD8A] text-sm mb-2">
            Airtime Sender Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="08031234567"
            className="w-full bg-[#0C2318] border border-[#143324] rounded-xl px-4 py-4 text-[#F0FAF0] placeholder-[#5A8870] outline-none focus:border-[#AAFF45]"
          />
        </div>

        <div className="mb-6">
          <label className="block text-[#7AAD8A] text-sm mb-2">
            Airtime Amount (₦)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Min ₦50, Max ₦50,000"
            className="w-full bg-[#0C2318] border border-[#143324] rounded-xl px-4 py-4 text-[#F0FAF0] placeholder-[#5A8870] outline-none focus:border-[#AAFF45]"
          />
          <div className="text-right text-[#5A8870] text-xs mt-2">
            Conversion Rate: {rate}%
          </div>
        </div>

        <div className="bg-[#112F20] p-5 rounded-2xl border border-[#143324] mb-8">
          <div className="text-[#7AAD8A] text-sm mb-1">Cash Equivalent</div>
          <div className="text-3xl font-bold text-[#AAFF45]">
            ₦{fmt(receiveAmount).replace("₦", "")}
          </div>
        </div>

        <div className="mt-auto pb-6">
          <PrimaryBtn
            onClick={handleInitiate}
            disabled={!isValid || loading}
            label={
              loading
                ? "Sending Verification OTP..."
                : "Send Verification OTP →"
            }
          />
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4">
        <div className="flex items-center gap-3 mb-8">
          <BackBtn onBack={() => setStep("select")} />
          <h1 className="text-xl font-medium">Verify SIM Card</h1>
        </div>

        <div className="bg-[#0C2318] p-5 rounded-2xl border border-[#143324] mb-6">
          <p className="text-[#7AAD8A] text-sm leading-relaxed">
            We sent a verification SMS containing a 4-digit OTP code to{" "}
            <strong className="text-[#F0FAF0]">{phoneNumber}</strong>. Please
            enter the code below to detect your SIM balance.
          </p>
        </div>

        {error && (
          <div className="bg-[rgba(255,107,53,0.1)] border border-[#FF6B35] text-[#FF6B35] rounded-xl p-4 text-xs font-semibold mb-6">
            {error}
          </div>
        )}

        <div className="mb-8">
          <label className="block text-[#7AAD8A] text-sm mb-2">
            4-Digit SMS OTP
          </label>
          <input
            type="text"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="1234"
            className="w-full bg-[#0C2318] border border-[#143324] rounded-xl px-4 py-4 text-center text-2xl font-bold text-[#AAFF45] placeholder-[#5A8870] outline-none focus:border-[#AAFF45] tracking-[0.25em]"
          />
        </div>

        <div className="mt-auto pb-6">
          <PrimaryBtn
            onClick={handleVerifyOTP}
            disabled={otp.length < 4 || loading}
            label={
              loading ? "Detecting SIM Balance..." : "Verify & Check Balance →"
            }
          />
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4">
        <div className="flex items-center gap-3 mb-8">
          <BackBtn onBack={() => setStep("otp")} />
          <h1 className="text-xl font-medium">Confirm Conversion</h1>
        </div>

        {error && (
          <div className="bg-[rgba(255,107,53,0.1)] border border-[#FF6B35] text-[#FF6B35] rounded-xl p-4 text-xs font-semibold mb-6">
            {error}
          </div>
        )}

        <div className="bg-[#0C2318] p-5 rounded-2xl border border-[#143324] mb-6">
          <h2 className="text-[#7AAD8A] text-sm mb-4 font-medium">
            Conversion Details
          </h2>

          <div className="flex justify-between items-center py-3 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Network / Phone</span>
            <span className="text-[#F0FAF0] text-sm font-medium">
              {network} ({phoneNumber})
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Airtime Amount</span>
            <span className="text-[#F0FAF0] text-sm font-medium">
              {fmt(numAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Detected SIM Balance</span>
            <span className="text-[#AAFF45] text-sm font-bold">
              {detectedBalance}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[#5A8870] text-sm">Naira to Receive</span>
            <span className="text-[#AAFF45] text-sm font-bold">
              {fmt(receiveAmount)}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-[#7AAD8A] text-sm mb-2">
            Telecom Transfer PIN
          </label>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Transfer PIN"
            className="w-full bg-[#0C2318] border border-[#143324] rounded-xl px-4 py-4 text-[#F0FAF0] placeholder-[#5A8870] outline-none focus:border-[#AAFF45] text-center text-xl font-bold tracking-widest"
          />
          <span className="block text-right text-[#5A8870] text-xs mt-2">
            Required to authorize SIM pull transfer
          </span>
        </div>

        <div className="bg-[#1a2e15] border border-[#AAFF45] bg-opacity-20 p-4 rounded-xl mb-8">
          <div className="text-[#AAFF45] font-medium text-sm mb-1">
            Transfer Warning
          </div>
          <div className="text-[#F0FAF0] text-xs leading-relaxed">
            By pressing confirm, you authorize the platform to pull{" "}
            {fmt(numAmount)} from your mobile line. Ensure you have set your
            transfer PIN.
          </div>
        </div>

        <div className="mt-auto pb-6">
          <PrimaryBtn
            onClick={handleExecuteTransfer}
            disabled={pin.length < 4 || loading}
            label={
              loading
                ? "Processing Transfer..."
                : `Confirm & Convert ${fmt(numAmount)}`
            }
          />
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4 items-center justify-center animate-fade-in">
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <div className="absolute inset-0 border-4 border-[#143324] rounded-full" />
          <div className="absolute inset-0 border-4 border-t-[#AAFF45] rounded-full animate-spin" />
          <IconPhone color="#AAFF45" size={32} />
        </div>
        <h2 className="text-[#AAFF45] text-lg font-medium text-center animate-pulse">
          Executing airtime transfer pull...
        </h2>
        <p className="text-[#5A8870] text-xs mt-3 text-center px-6">
          We are communicating with the telecom aggregator. Please do not close
          the app.
        </p>
      </div>
    );
  }

  // Success Step
  return (
    <div className="flex flex-col flex-1 bg-[#030F07] text-[#F0FAF0] min-h-screen p-4 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center py-10">
        {transactionStatus === "pending" ? (
          <div className="w-20 h-20 bg-[rgba(255,159,107,0.1)] rounded-full flex items-center justify-center mb-6 border border-[#FF9F6B]">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF9F6B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-spin-slow"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        ) : transactionStatus === "failed" ? (
          <div className="w-20 h-20 bg-[rgba(255,107,53,0.1)] rounded-full flex items-center justify-center mb-6 border border-[#FF6B35]">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF6B35"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </div>
        ) : (
          <div className="w-20 h-20 bg-[#112F20] rounded-full flex items-center justify-center mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#AAFF45"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        )}
        <h1 className="text-2xl font-medium mb-2">
          {transactionStatus === "pending"
            ? "Reconciliation Pending"
            : transactionStatus === "failed"
              ? "Transfer Failed"
              : "Airtime Converted"}
        </h1>
        <div
          className={`text-4xl font-bold mb-8 ${transactionStatus === "pending" ? "text-[#FF9F6B]" : transactionStatus === "failed" ? "text-[#FF6B35]" : "text-[#AAFF45] animate-bounce"}`}
        >
          {fmt(payoutAmount)}
        </div>

        <div className="bg-[#0C2318] p-5 rounded-2xl border border-[#143324] w-full text-left">
          <div className="flex justify-between items-center py-2 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">
              Transaction Reference
            </span>
            <span className="text-[#F0FAF0] text-sm font-mono text-xs">
              {txnRef}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Airtime Transferred</span>
            <span className="text-[#F0FAF0] text-sm">{fmt(numAmount)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#143324]">
            <span className="text-[#5A8870] text-sm">Network</span>
            <span className="text-[#F0FAF0] text-sm">
              {network} ({phoneNumber})
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[#5A8870] text-sm">Credited to</span>
            <span className="text-[#F0FAF0] text-sm">
              {transactionStatus === "pending"
                ? "Pending SIM Verification"
                : transactionStatus === "failed"
                  ? "No Wallet Credit"
                  : "Wallet Balance"}
            </span>
          </div>
        </div>

        {transactionStatus === "pending" && (
          <div className="mt-6 bg-[rgba(255,159,107,0.1)] border border-[#FF9F6B] text-[#FF9F6B] rounded-xl p-4 text-xs font-semibold leading-relaxed text-center">
            The aggregator returned a false-negative status. We are verifying
            your SIM card debit in the background. Your wallet will be credited
            automatically once confirmed.
          </div>
        )}

        {transactionStatus === "failed" && (
          <div className="mt-6 bg-[rgba(255,107,53,0.1)] border border-[#FF6B35] text-[#FF6B35] rounded-xl p-4 text-xs font-semibold leading-relaxed text-center">
            The SIM debit could not be confirmed after multiple checks, so the
            transfer was marked as failed and no wallet credit was applied.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pb-6">
        <PrimaryBtn
          onClick={() => setStep("select")}
          label="Convert More Airtime"
        />
        <button
          onClick={() => go("history")}
          className="w-full py-4 text-[#AAFF45] font-medium border border-[#143324] rounded-xl hover:bg-[#112F20] transition-colors"
        >
          View History
        </button>
        <button
          onClick={() => go("dashboard")}
          className="w-full py-4 text-[#5A8870] font-medium hover:text-[#F0FAF0] transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export function ConvertAirtimeConfirm() {
  return null;
}
export function ConvertAirtimeProcessing() {
  return null;
}
export function ConvertAirtimeSuccess() {
  return null;
}
