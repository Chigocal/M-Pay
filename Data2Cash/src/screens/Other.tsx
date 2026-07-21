import React, { useState } from "react";
import {
  BackBtn,
  PrimaryBtn,
  GhostBtn,
  IconSignal,
  IconPhone,
  IconWifi,
  IconZap,
  IconWallet,
  IconInbox,
  IconCreditCard,
  IconDollarSign,
  IconShield,
  IconLock,
  IconBarChart,
  IconUser,
  IconArrowRight,
  IconLogOut,
  IconSettings,
  IconStar,
  IconTrash,
  IconCheck,
  IconRefresh,
  IconHash,
  IconBell,
  IconHelpCircle,
  IconGift,
  NetworkSelector,
  BottomNav,
} from "@/components";
import { fmt, getNetworkMeta, NETWORKS, genTxId } from "@/data";
import { ScreenProps, Screen, Network, TxType } from "@/types";

export function History({ state, setState, setScreen }: ScreenProps) {
  const [filter, setFilter] = useState<
    "All" | "Conversions" | "Purchases" | "Withdrawals"
  >("All");

  const transactions = state.transactions || [];

  const completedConversions = transactions.filter(
    (t) =>
      (t.type === "data-to-cash" || t.type === "airtime-to-cash") &&
      t.status === "completed",
  );
  const completedPurchases = transactions.filter(
    (t) =>
      (t.type === "buy-data" || t.type === "buy-airtime") &&
      t.status === "completed",
  );
  const completedWithdrawals = transactions.filter(
    (t) => t.type === "withdraw" && t.status === "completed",
  );

  const totalEarned = completedConversions.reduce(
    (sum, t) => sum + (t.amount || 0),
    0,
  );
  const totalSpent = completedPurchases.reduce(
    (sum, t) => sum + (t.amount || 0),
    0,
  );
  const totalWithdrawn = completedWithdrawals.reduce(
    (sum, t) => sum + (t.amount || 0),
    0,
  );

  const filteredTransactions = transactions
    .filter((t) => {
      if (filter === "All") return true;
      if (filter === "Conversions")
        return t.type === "data-to-cash" || t.type === "airtime-to-cash";
      if (filter === "Purchases")
        return t.type === "buy-data" || t.type === "buy-airtime";
      if (filter === "Withdrawals") return t.type === "withdraw";
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getIcon = (type: TxType) => {
    switch (type) {
      case "data-to-cash":
        return <IconSignal className="w-5 h-5 text-[#AAFF45]" />;
      case "airtime-to-cash":
        return <IconPhone className="w-5 h-5 text-[#AAFF45]" />;
      case "buy-data":
        return <IconWifi className="w-5 h-5 text-[#FF6B35]" />;
      case "buy-airtime":
        return <IconZap className="w-5 h-5 text-[#FF6B35]" />;
      case "withdraw":
        return <IconWallet className="w-5 h-5 text-[#FF9F6B]" />;
      default:
        return <IconHash className="w-5 h-5 text-[#7AAD8A]" />;
    }
  };

  const getTitle = (t: any) => {
    switch (t.type) {
      case "data-to-cash":
        return `${t.bundle || ""} ${t.gb || ""}GB`;
      case "airtime-to-cash":
        return `Airtime ₦${t.airtimeAmount || t.amount || 0}`;
      case "buy-data":
        return `Bought ${t.plan || ""}`;
      case "buy-airtime":
        return `₦${t.amount || 0} Airtime`;
      case "withdraw":
        return `Withdrawn to Bank`;
      default:
        return "Transaction";
    }
  };

  const getSubtitle = (t: any) => {
    let extra = "";
    if (t.type === "data-to-cash" || t.type === "airtime-to-cash")
      extra = t.bank ? ` • ${t.bank}` : "";
    if (t.type === "buy-data" || t.type === "buy-airtime")
      extra = t.recipientPhone ? ` • ${t.recipientPhone}` : "";
    if (t.type === "withdraw") extra = t.bank ? ` • ${t.bank}` : "";

    return `${new Date(t.date).toLocaleDateString()}${extra}`;
  };

  const getAmountClass = (type: TxType) => {
    if (type === "buy-data" || type === "buy-airtime") return "text-[#FF6B35]";
    if (type === "withdraw") return "text-[#FF9F6B]";
    return "text-[#AAFF45]";
  };

  const getAmountPrefix = (type: TxType) => {
    if (type === "buy-data" || type === "buy-airtime" || type === "withdraw")
      return "-";
    return "+";
  };

  return (
    <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] animate-fade-in flex flex-col">
      <div className="p-4 border-b border-[#2E6040] flex items-center gap-3 shrink-0">
        <BackBtn onClick={() => setScreen("dashboard")} />
        <h1 className="text-xl font-bold">Transaction History</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-[#7AAD8A] mb-1">Total Earned</span>
              <span className="font-bold text-[#AAFF45] text-sm sm:text-base">
                ₦{fmt(totalEarned)}
              </span>
            </div>
            <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-[#7AAD8A] mb-1">Total Spent</span>
              <span className="font-bold text-[#FF6B35] text-sm sm:text-base">
                ₦{fmt(totalSpent)}
              </span>
            </div>
            <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-[#7AAD8A] mb-1">Wallet Funded</span>
              <span className="font-bold text-[#F0FAF0] text-sm sm:text-base">
                ₦{fmt(totalWithdrawn)}
              </span>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
            {["All", "Conversions", "Purchases", "Withdrawals"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  filter === f
                    ? "bg-[#AAFF45] text-[#030F07] font-semibold"
                    : "bg-[#0C2318] border border-[#2E6040] text-[#7AAD8A]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#0C2318] flex items-center justify-center text-[#5A8870] mb-4">
                  <IconInbox className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-[#7AAD8A]">
                  No transactions found
                </h3>
                <p className="text-sm text-[#5A8870] mt-1">
                  Try changing your filters.
                </p>
              </div>
            ) : (
              filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#0C2318] border border-[#2E6040] rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-[#030F07] border border-[#2E6040] flex items-center justify-center shrink-0">
                    {getIcon(t.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">
                        {getTitle(t)}
                      </h4>
                      <span
                        className={`font-bold text-sm shrink-0 ${getAmountClass(t.type)}`}
                      >
                        {getAmountPrefix(t.type)}
                        {fmt(t.amount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#7AAD8A] truncate">
                        {getSubtitle(t)}
                      </p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          t.status === "completed"
                            ? "bg-lime-500/10 text-lime-400"
                            : "bg-[#FF9F6B]/10 text-[#FF9F6B]"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p
                      className="text-[10px] text-[#5A8870] mt-1.5"
                      style={{ fontFamily: "DM Mono, monospace" }}
                    >
                      ID: {t.id}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="pb-24"></div>
        </div>
      </div>
    </div>
  );
}

export function Settings({ state, setState, setScreen }: ScreenProps) {
  return (
    <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] animate-fade-in flex flex-col">
      <div className="p-4 border-b border-[#2E6040] flex items-center gap-3 shrink-0">
        <BackBtn onClick={() => setScreen("dashboard")} />
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2E6040] flex items-center justify-center text-[#AAFF45]">
            <IconUser className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-lg">
                {state.userName || "User"} Okonkwo
              </h2>
              <IconCheck className="w-4 h-4 text-lime-400" />
            </div>
            <p className="text-sm text-[#7AAD8A]">
              {state.userPhone || "08000000000"}
            </p>
            <span className="inline-block mt-1 text-[10px] uppercase tracking-wider bg-lime-500/10 text-lime-400 px-1.5 py-0.5 rounded font-bold">
              Verified
            </span>
          </div>
        </div>

        <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[#7AAD8A] mb-3 uppercase tracking-wider">
            Wallet
          </h3>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#030F07] border border-[#2E6040] flex items-center justify-center">
                <IconWallet className="w-5 h-5 text-[#AAFF45]" />
              </div>
              <div>
                <p className="text-xs text-[#7AAD8A]">Balance</p>
                <p className="font-bold text-lg">
                  ₦{fmt(state.walletBalance || 0)}
                </p>
              </div>
            </div>
          </div>
          <PrimaryBtn onClick={() => setScreen("withdraw" as any)}>
            Withdraw
          </PrimaryBtn>
        </div>

        <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl overflow-hidden">
          <h3 className="text-sm font-semibold text-[#7AAD8A] mb-1 px-4 pt-4 uppercase tracking-wider">
            Payment
          </h3>
          <div className="px-4 py-3 border-b border-[#2E6040] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconCreditCard className="w-5 h-5 text-[#5A8870]" />
              <span className="text-sm">Linked Bank Account</span>
            </div>
            <span className="text-sm text-[#7AAD8A]">Access Bank ••••1234</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconDollarSign className="w-5 h-5 text-[#5A8870]" />
              <span className="text-sm">Payout History</span>
            </div>
            <span className="text-sm text-[#7AAD8A]">
              {state.transactions?.filter(
                (t) =>
                  t.type === "data-to-cash" || t.type === "airtime-to-cash",
              ).length || 0}
            </span>
          </div>
        </div>

        <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl overflow-hidden">
          <h3 className="text-sm font-semibold text-[#7AAD8A] mb-1 px-4 pt-4 uppercase tracking-wider">
            Security
          </h3>
          <div className="px-4 py-3 border-b border-[#2E6040] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconShield className="w-5 h-5 text-[#5A8870]" />
              <span className="text-sm">KYC Verification</span>
            </div>
            <span className="text-sm text-lime-400">BVN Verified</span>
          </div>
          <button
            onClick={() => alert("Feature coming soon!")}
            className="w-full px-4 py-3 border-b border-[#2E6040] flex items-center justify-between hover:bg-[#2E6040]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <IconLock className="w-5 h-5 text-[#5A8870]" />
              <span className="text-sm">Transaction PIN</span>
            </div>
            <span className="text-sm text-[#AAFF45]">Change PIN</span>
          </button>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconSettings className="w-5 h-5 text-[#5A8870]" />
              <span className="text-sm">App Permissions</span>
            </div>
            <span className="text-sm text-[#7AAD8A]">3 of 3 granted</span>
          </div>
        </div>

        <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl overflow-hidden">
          <h3 className="text-sm font-semibold text-[#7AAD8A] mb-1 px-4 pt-4 uppercase tracking-wider">
            People
          </h3>
          <button
            onClick={() => setScreen("beneficiaries" as any)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#2E6040]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <IconStar className="w-5 h-5 text-[#5A8870]" />
              <span className="text-sm">Saved Beneficiaries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#7AAD8A]">
                {state.beneficiaries?.length || 0}
              </span>
              <IconArrowRight className="w-4 h-4 text-[#5A8870]" />
            </div>
          </button>
        </div>

        <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl overflow-hidden">
          <h3 className="text-sm font-semibold text-[#7AAD8A] mb-1 px-4 pt-4 uppercase tracking-wider">
            About
          </h3>
          <div className="px-4 py-3 border-b border-[#2E6040] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconBarChart className="w-5 h-5 text-[#5A8870]" />
              <span className="text-sm">Rate Table</span>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconHelpCircle className="w-5 h-5 text-[#5A8870]" />
              <span className="text-sm">App Version</span>
            </div>
            <span className="text-sm text-[#7AAD8A]">v2.0.0</span>
          </div>
        </div>

        <GhostBtn
          onClick={() => setScreen("splash")}
          className="w-full text-[#FF6B35] flex justify-center gap-2"
        >
          <IconLogOut className="w-5 h-5" />
          Log Out
        </GhostBtn>

        <div className="pb-24"></div>
      </div>
    </div>
  );
}

export function Beneficiaries({ state, setState, setScreen }: ScreenProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<Network>("MTN");

  const beneficiaries = state.beneficiaries || [];

  const handleSave = () => {
    if (!name || phone.length !== 11) return;

    const newBen = {
      id: genTxId(),
      name,
      phone,
      network,
      savedAt: new Date().toISOString(),
    };

    setState({
      ...state,
      beneficiaries: [...beneficiaries, newBen],
    });

    setName("");
    setPhone("");
  };

  const handleDelete = (id: string) => {
    setState({
      ...state,
      beneficiaries: beneficiaries.filter((b) => b.id !== id),
    });
  };

  return (
    <div className="min-h-screen bg-[#030F07] text-[#F0FAF0] animate-fade-in flex flex-col">
      <div className="p-4 border-b border-[#2E6040] flex items-center gap-3 shrink-0">
        <BackBtn onClick={() => setScreen("settings" as any)} />
        <h1 className="text-xl font-bold">Saved Beneficiaries</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="space-y-3 flex-1">
          {beneficiaries.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#0C2318] flex items-center justify-center text-[#5A8870] mb-4">
                <IconStar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-[#7AAD8A]">
                No beneficiaries yet
              </h3>
              <p className="text-sm text-[#5A8870] mt-1">
                Add friends and family for quick top-ups.
              </p>
            </div>
          ) : (
            beneficiaries.map((b) => {
              const meta = getNetworkMeta(b.network);
              return (
                <div
                  key={b.id}
                  className="bg-[#0C2318] border border-[#2E6040] rounded-xl p-4 flex items-center gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm`}
                    style={{ backgroundColor: meta.bg, color: meta.color }}
                  >
                    {b.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{b.name}</h4>
                    <p className="text-xs text-[#7AAD8A] font-mono">
                      {b.phone}
                    </p>
                    <span
                      className="text-[10px] mt-1 inline-block uppercase tracking-wider font-bold"
                      style={{ color: meta.color }}
                    >
                      {b.network}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-2 text-[#5A8870] hover:text-[#FF6B35] transition-colors rounded-lg"
                  >
                    <IconTrash className="w-5 h-5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-[#0C2318] border border-[#2E6040] rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-sm">Add New Beneficiary</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#7AAD8A] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mom"
                className="w-full bg-[#030F07] border border-[#2E6040] rounded-lg p-3 text-sm focus:outline-none focus:border-[#AAFF45]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#7AAD8A] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").substring(0, 11))
                }
                placeholder="08000000000"
                className="w-full bg-[#030F07] border border-[#2E6040] rounded-lg p-3 text-sm focus:outline-none focus:border-[#AAFF45]"
                style={{ fontFamily: "DM Mono, monospace" }}
              />
            </div>

            <div>
              <label className="block text-xs text-[#7AAD8A] mb-1">
                Network
              </label>
              <NetworkSelector selected={network} onSelect={setNetwork} />
            </div>

            <PrimaryBtn
              onClick={handleSave}
              disabled={!name || phone.length !== 11}
              className="mt-2 w-full"
            >
              Save Beneficiary
            </PrimaryBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
