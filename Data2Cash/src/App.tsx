import { useState, useCallback, useRef } from "react";
import type { Screen, AppState } from "./types";
import { DEFAULT_STATE, NAV_SCREENS } from "./data";
import { BottomNav, PinModal, PinSetup } from "./components";
import {
  Splash,
  HowItWorks,
  Permissions,
  BankLink,
} from "./screens/Onboarding";
import { Dashboard } from "./screens/Dashboard";
import {
  ConvertHub,
  ConvertDataDetect,
  ConvertAirtimeSelect,
} from "./screens/Convert";
import {
  BuyHub,
  BuyData,
  BuyDataConfirm,
  BuyDataProcessing,
  BuyDataSuccess,
  BuyAirtime,
  BuyAirtimeConfirm,
  BuyAirtimeProcessing,
  BuyAirtimeSuccess,
} from "./screens/Buy";
import {
  FundWallet,
  FundWalletBank,
  FundWalletCard,
  FundWalletSuccess,
  WithdrawFlow,
} from "./screens/Wallet";
import { History, Settings, Beneficiaries } from "./screens/Other";
import { LogIn, SignUp } from "./screens/Auth";
import "./index.css";

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  // PIN modal state
  const [pinVisible, setPinVisible] = useState(false);
  const pinCallback = useRef<(() => void) | null>(null);

  const go = useCallback((s: Screen) => setScreen(s), []);

  const requestPin = useCallback(
    (onSuccess: () => void) => {
      if (!state.pinSet) {
        // If PIN not set, just proceed (shouldn't happen after onboarding)
        onSuccess();
        return;
      }
      pinCallback.current = onSuccess;
      setPinVisible(true);
    },
    [state.pinSet],
  );

  const handlePinSuccess = useCallback(() => {
    setPinVisible(false);
    pinCallback.current?.();
    pinCallback.current = null;
  }, []);

  const handlePinCancel = useCallback(() => {
    setPinVisible(false);
    pinCallback.current = null;
  }, []);

  const handlePinSet = useCallback((pin: string) => {
    setState((s) => ({ ...s, pin, pinSet: true }));
  }, []);

  // Determine if bottom nav should show
  const showNav = (NAV_SCREENS as readonly string[]).includes(screen);

  const props = { go, state, setState, requestPin };

  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ background: "#030F07", color: "#F0FAF0" }}
    >
      <div
        className="w-full h-full overflow-y-auto relative"
        style={{ scrollbarWidth: "none", maxWidth: "520px" }}
      >
        {/* ── Auth ── */}
        {screen === "signup" && <SignUp {...props} />}
        {screen === "login" && <LogIn {...props} />}

        {/* ── Onboarding ── */}
        {screen === "splash" && <Splash {...props} />}
        {screen === "how-it-works" && <HowItWorks {...props} />}
        {screen === "permissions" && <Permissions {...props} />}
        {screen === "bank-link" && <BankLink {...props} />}
        {screen === "pin-setup" && <PinSetup go={go} onPinSet={handlePinSet} />}

        {/* ── Main ── */}
        {screen === "dashboard" && <Dashboard {...props} />}

        {/* ── Convert ── */}
        {screen === "convert-hub" && <ConvertHub {...props} />}
        {screen === "convert-data-detect" && <ConvertDataDetect {...props} />}
        {screen === "convert-airtime" && <ConvertAirtimeSelect {...props} />}

        {/* ── Buy ── */}
        {screen === "buy-hub" && <BuyHub {...props} />}
        {screen === "buy-data" && <BuyData {...props} />}
        {screen === "buy-data-confirm" && <BuyDataConfirm {...props} />}
        {screen === "buy-data-processing" && <BuyDataProcessing {...props} />}
        {screen === "buy-data-success" && <BuyDataSuccess {...props} />}
        {screen === "buy-airtime" && <BuyAirtime {...props} />}
        {screen === "buy-airtime-confirm" && <BuyAirtimeConfirm {...props} />}
        {screen === "buy-airtime-processing" && (
          <BuyAirtimeProcessing {...props} />
        )}
        {screen === "buy-airtime-success" && <BuyAirtimeSuccess {...props} />}

        {/* ── Wallet ── */}
        {screen === "fund-wallet" && <FundWallet {...props} />}
        {screen === "fund-wallet-bank" && <FundWalletBank {...props} />}
        {screen === "fund-wallet-card" && <FundWalletCard {...props} />}
        {screen === "fund-wallet-success" && <FundWalletSuccess {...props} />}
        {screen === "withdraw" && <WithdrawFlow {...props} />}

        {/* ── Other ── */}
        {screen === "history" && <History {...props} />}
        {screen === "settings" && <Settings {...props} />}
        {screen === "beneficiaries" && <Beneficiaries {...props} />}
      </div>

      {/* Bottom Navigation */}
      {showNav && <BottomNav screen={screen} go={go} />}

      {/* PIN Modal */}
      <PinModal
        visible={pinVisible}
        correctPin={state.pin}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    </div>
  );
}
