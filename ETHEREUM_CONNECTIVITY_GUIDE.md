# Ethereum Connectivity in Skatehive 3.0

This document summarizes all references to Ethereum connection, sign-in, related packages, imports, code, buttons, and hooks in the Skatehive 3.0 codebase. Use this as a study guide for replacing or improving the current Ethereum integration.

---

## Key Packages & Imports

- **wagmi**: Main library for Ethereum wallet connection and account management.
  - Used in: `ConnectButton.tsx`, `ConnectModal.tsx`, `WalletSummary.tsx`, `EthereumAssetsSection.tsx`, `MainWallet.tsx`, etc.
- **ethers**: (Not directly found, but likely used via wagmi or in utility code.)
- **@walletconnect/**: Multiple WalletConnect packages in `pnpm-lock.yaml` for multi-wallet support.
- **@metamask/**: Metamask-related packages in `pnpm-lock.yaml`.
- **FaEthereum**: Used for Ethereum icon in UI buttons.

---

## UI Components & Buttons

- **ConnectButton.tsx**: Button to connect/disconnect Ethereum wallet.
  - Shows "Connect Ethereum" if not connected.
  - Uses `useAccount` and `useDisconnect` from wagmi.
- **ConnectModal.tsx**: Modal for wallet connection.
  - Lists Ethereum wallet connectors (MetaMask, WalletConnect, etc.).
  - Button for each connector: `onClick={() => connect({ connector })}`.
- **WalletSummary.tsx**: Shows wallet status and connection buttons.
  - Button: `Connect Ethereum` (calls `onConnectEthereum`).
  - Button: `Disconnect Ethereum` (calls `handleDisconnect`).
- **EditProfile.tsx**: Ethereum wallet section in profile.
  - Button: `Connect Ethereum Wallet` (calls `handleEditEthAddress`).
  - Handles wallet connection and address update.
- **EthereumAssetsSection.tsx**: Displays Ethereum assets if connected.
  - Uses `useAccount` from wagmi.
  - Shows token balances, send token modal, etc.
- **MainWallet.tsx**: Main wallet dashboard.
  - Shows EthereumAssetsSection and NFTSection if `isConnected`.
  - Passes `onConnectEthereum` to WalletSummary.

---

## Hooks & Utility

- **useAccount, useConnect, useDisconnect** (from wagmi): Used throughout wallet components for Ethereum connection state.
- **useWalletSource**: Determines wallet type (Ethereum, Farcaster, etc.).
- **getWalletSource**: Utility for wallet source info.

---

## Example Code References

- `onClick={onConnectEthereum}` (WalletSummary)
- `onClick={() => connect({ connector })}` (ConnectModal)
- `onClick={handleEditEthAddress}` (EditProfile)
- `isConnected && <EthereumAssetsSection />` (MainWallet)
- `useAccount()` (EthereumAssetsSection, ConnectButton, WalletSummary, MainWallet)

---

## Packages in pnpm-lock.yaml

- `wagmi`, `@walletconnect/*`, `@metamask/*`, `eth-block-tracker`, `eth-json-rpc-filters`, `eth-query`, `@coinbase/wallet-sdk`

---

## Provider Tree (from AGENTS.md)

- **Wagmi** with **Viem** – Ethereum RPC connectivity
- Main provider tree defined in `app/providers.tsx`

---

## How to Replace or Improve

- Identify all usages of wagmi and related wallet connection logic.
- Consider alternatives (e.g., RainbowKit, web3modal, custom wallet connectors).
- Refactor UI components to support new connection flows.
- Update provider tree in `app/providers.tsx`.
- Audit dependencies in `pnpm-lock.yaml` for unused or outdated packages.

---

**Use this guide to plan and execute a migration or upgrade of Ethereum connectivity in Skatehive 3.0.**
