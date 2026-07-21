# Data2Cash

Data2Cash is a web application prototype that lets MTN subscribers convert unused mobile data bundles into cash credited straight to their bank account.

## Overview

Many users end up with excess data from SME or promo bundles that expires unused. Data2Cash automates data valuation and transfer verification, pairing silent SIM balance checks with instant payouts via Paystack.

## Key Features

- **Automated SIM & Bundle Detection**: Simulates background balance checks (*312# / *323#) and bundle classification (SME, Promo, Regular).
- **Dynamic Rate Engine**: Automatically calculates payout rates (e.g. ₦650/GB for SME bundles) based on current wholesale data rates.
- **Bank Account Linking & Resolution**: Instant account name lookup and BVN verification flow for CBN compliance.
- **Seamless Payout Flow**: Step-by-step conversion experience with real-time transfer tracking.
- **History & Account Settings**: Complete record of past conversions and user profile management.

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Icons**: Custom inline SVGs

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

## Build for Production

To generate static assets for deployment:
```bash
npm run build
```
