# M-Pay: Airtime-to-Cash Automation Platform

M-Pay is an end-to-end automation platform that enables users (specifically MTN and other subscribers) to securely convert unused mobile data and airtime into cash, which is disburseable directly to their bank accounts. 

The platform consists of a **FastAPI backend** (M-Pay API) integrated with third-party service providers and a **React 19 + Tailwind CSS v4 frontend** (Data2Cash).

---

## 🚀 Key Features

*   **User Authentication**: Dual-mode registration and session management supporting local registration (with secure bcrypt hashing) and Google OAuth login.
*   **Email OTP Verification**: SMTP-based real-time email verification flow (with simulator mode for sandboxed local environments).
*   **Balance & SIM Detection**: Integrates with mobile network aggregators to request OTPs and detect current mobile data/airtime balances dynamically.
*   **Dynamic Rates Engine**: Automatically translates airtime values into exact cash values based on customizable wholesale network rates.
*   **Persona KYC Verification**: Fully integrated with the Persona Verification SDK and backend webhook listener to satisfy identity compliance.
*   **Monnify Cash Disbursals**: Automated single-transfers and bank payouts directly from a platform merchant account to the user's personal bank account.
*   **Bank Account Resolution**: Real-time account number lookups and BVN validations using the Monnify API.

---

## 📂 Repository Structure

The codebase is organized into two primary sub-projects: the backend service and the frontend web app.

```
M-Pay/
├── main.py                    # Backend FastAPI entrypoint & app router setup
├── requirements.txt           # Python backend dependencies list
├── system_gaps_analysis.pdf   # Architectural gaps & integration plan (Markdown format)
├── backend/                   # Backend Application Directory
│   ├── app/
│   │   ├── config.py          # Settings loader using Pydantic BaseSettings (.env loading)
│   │   ├── database.py        # SQLAlchemy session, engine, and Base class definition
│   │   ├── models.py          # SQLAlchemy tables (User, Transaction)
│   │   ├── schemas.py         # Pydantic validation schemas (including webhooks/auth)
│   │   └── tests/             # Pytest suite (Aggregator, conversions, payouts)
│   ├── routers/               # Route definitions
│   │   ├── auth.py            # Registration, login, Google OAuth, and OTP handlers
│   │   ├── conversions.py     # Airtime conversion initiation, verify-otp, and execution routes
│   │   ├── withdrawals.py     # Wallet payout trigger router
│   │   ├── webhooks.py        # Persona & Monnify webhook event listeners
│   │   └── payouts.py         # Payout queries & transactions routers
│   └── services/              # API wrappers for third-party integrations
│       ├── aggregator.py      # Airtime aggregator service wrapper
│       ├── monnify.py         # Monnify auth & single transfer disburser client
│       └── monnify_service.py # Monnify account lookup and validation helper
└── Data2Cash/                 # Frontend React Web Application
    ├── package.json           # Frontend package scripts and dependencies
    ├── vite.config.ts         # Vite bundler config with Tailwind v4 integrations
    ├── src/                   # React app source files
    │   ├── App.tsx            # Main state controller and screen coordinator
    │   ├── components.tsx     # Reusable custom UI components (buttons, modals, input elements)
    │   ├── index.css          # Design tokens and custom CSS overrides
    │   └── screens/           # Modular view screens
    │       ├── Auth.tsx       # Local and Google OAuth signup/signin flow
    │       ├── Dashboard.tsx  # Central hub showing wallet balance and quick actions
    │       ├── Onboarding.tsx # Interactive application onboarding tutorial
    │       ├── Convert.tsx    # Multi-step airtime-to-cash conversion module
    │       ├── Wallet.tsx     # Wallet actions, withdrawal forms, and transaction logs
    │       └── Other.tsx      # Profile page, security, and app settings
```

---

## 🛠️ Tech Stack

### Backend
*   **Web Framework**: FastAPI (Asynchronous Python)
*   **ORM**: SQLAlchemy
*   **Database**: SQLite (`airtime_cash.db`)
*   **Validation**: Pydantic v2
*   **Testing**: Pytest & Pytest-HTTPX
*   **HTTP Client**: HTTPX

### Frontend
*   **Framework**: React 19 + Vite
*   **Styling**: Tailwind CSS v4
*   **Language**: TypeScript
*   **Formatter**: oxfmt

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root directory. Copy and modify the following configuration keys:

```ini
# Monnify Credentials
MONNIFY_API_KEY=your_monnify_api_key
MONNIFY_SECRET_KEY=your_monnify_secret_key
MONNIFY_CONTRACT_CODE=your_monnify_contract_code
MONNIFY_BASE_URL=https://sandbox.monnify.com           # Use production URL for live
MONNIFY_WALLET_ACCOUNT_NUMBER=your_source_wallet_num

# Airtime Aggregator Credentials
AGGREGATOR_API_KEY=your_aggregator_token
AGGREGATOR_BASE_URL=https://automation.airtimetocash.com

# Persona KYC Credentials
PERSONA_API_KEY=your_persona_api_key
PERSONA_WEBHOOK_SECRET=your_persona_webhook_secret

# Database Configuration
DATABASE_URL=sqlite:///./airtime_cash.db

# Authentication Secrets
GOOGLE_CLIENT_ID=your_google_oauth_client_id
JWT_SECRET_KEY=your_super_secret_jwt_key

# SMTP Configuration (For email verification OTPs)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_sender_email@gmail.com
SMTP_PASSWORD=your_app_specific_password
SMTP_FROM=your_sender_email@gmail.com
```

---

## 🔧 Getting Started

### 1. Set Up the Backend

1.  **Prerequisites**: Ensure you have Python 3.10+ installed.
2.  **Environment**: Create a Python virtual environment and activate it:
    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # macOS/Linux:
    source .venv/bin/activate
    ```
3.  **Dependencies**: Install Python packages from `requirements.txt`:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Run Server**: Run the FastAPI application using the start script:
    ```bash
    python main.py
    ```
    Alternatively, launch directly via Uvicorn:
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```
5.  **Interactive Docs**: Navigate to `http://localhost:8000/docs` to test endpoints via Swagger UI.

### 2. Set Up the Frontend

1.  **Navigate to frontend directory**:
    ```bash
    cd Data2Cash
    ```
2.  **Install Node packages**:
    ```bash
    npm install
    # or using pnpm
    pnpm install
    ```
3.  **Run Development server**:
    ```bash
    npm run dev
    ```
4.  **Access the Application**: Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Testing

To run the backend test suite, execute the following command in the root folder:

```bash
pytest backend/app/tests/
```

---

## 🔗 Code Reference Links

- Backend Entry Point: [main.py](file:///c:/Users/user/Documents/Coding/Work%20Project/M-Pay/main.py)
- Main Configuration: [config.py](file:///c:/Users/user/Documents/Coding/Work%20Project/M-Pay/backend/app/config.py)
- DB Schema & Models: [models.py](file:///c:/Users/user/Documents/Coding/Work%20Project/M-Pay/backend/app/models.py)
- Backend Routers: [backend/routers](file:///c:/Users/user/Documents/Coding/Work%20Project/M-Pay/backend/routers)
- Webhooks Router: [webhooks.py](file:///c:/Users/user/Documents/Coding/Work%20Project/M-Pay/backend/routers/webhooks.py)
- Frontend Entry Point: [App.tsx](file:///c:/Users/user/Documents/Coding/Work%20Project/M-Pay/Data2Cash/src/App.tsx)
- Frontend Screen Views: [screens/](file:///c:/Users/user/Documents/Coding/Work%20Project/M-Pay/Data2Cash/src/screens)
- System Alignment Analysis: [system_gaps_analysis.pdf](file:///c:/Users/user/Documents/Coding/Work%20Project/M-Pay/system_gaps_analysis.pdf)
