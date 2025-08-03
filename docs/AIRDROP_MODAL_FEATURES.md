# SkateHive Airdrop Modal & Components: Features & Flow

## Overview
The Airdrop Modal is a multi-step, highly interactive UI for configuring, previewing, and executing token airdrops on Hive and Ethereum (Base) networks. It is designed for flexibility, security, and a smooth user experience.

---

## Modal Steps & Features

### 1. Token Selection Step
- **Select Token**: Choose from available tokens (Hive or Base/Ethereum) based on wallet connections.
- **Set Total Amount**: Specify the total airdrop amount.
- **Wallet Awareness**: Only shows tokens for which the user has a connected wallet.
- **Navigation**: Next/Cancel buttons, with validation.

### 2. Configuration Step
- **Recipient Filtering**: Sort and limit recipients using leaderboard data and custom options.
- **Custom Message**: Add a message for the airdrop announcement.
- **Include SkateHive**: Optionally include the SkateHive account as a recipient.
- **Weighted Airdrop**: Toggle between equal and weighted distribution.
- **Anonymous Mode**: Option to hide sender identity in the announcement.
- **Navigation**: Back/Next buttons, with validation.

### 3. Preview Step
- **Network Visualization**: Shows a React Flow network graph of the airdrop distribution.
- **Screenshot Capture**: Captures a high-quality image of the network for the announcement.
- **Performance Optimized**: Uses html-to-image for fast, accurate screenshots.
- **Navigation**: Back/Next (Confirm & Execute) buttons.

### 4. Confirmation Step
- **Final Review**: Shows all airdrop details, cost estimates, and validation status.
- **Execute Airdrop**: Triggers the airdrop transaction on Hive or Ethereum.
- **Approve Token**: For ERC-20, allows token approval before execution.
- **Status Feedback**: Real-time status updates and error handling.
- **Navigation**: Back/Start Over/Execute buttons.

---

## Key Features
- **Multi-Network Support**: Works with both Hive and Ethereum (Base) tokens.
- **Smart Token Filtering**: Only shows tokens for which the user has a connected wallet.
- **Dynamic Recipient Management**: Sort, filter, and limit recipients based on leaderboard data.
- **Customizable Distribution**: Equal or weighted airdrop, with optional SkateHive inclusion.
- **Announcement Automation**: Posts a formatted announcement (with network image) immediately after transaction confirmation.
- **Performance**: Fast screenshot capture, minimal rerenders, and optimized state management.
- **Clean UX**: All logs and debug output removed for production.
- **Mobile Responsive**: Adapts to mobile and desktop layouts.

---

## Component Structure
- **AirdropModal**: Main modal, manages all state and step navigation.
- **TokenSelectionStep**: Token/amount selection UI.
- **ConfigurationStep**: Recipient filtering and airdrop config.
- **PreviewStep**: Network visualization and screenshot capture.
- **ConfirmationStep**: Final review and transaction execution.
- **StepHeader**: Consistent step titles and progress.

---

## Developer Notes
- **No Preview Modal**: Announcement is posted directly after transaction confirmation (no user preview step).
- **All logs removed**: No console output in production.
- **Unused state cleaned**: Only necessary state is kept.
- **Hooks**: Uses custom hooks for airdrop management, transaction status, and mobile detection.
- **Extensible**: Easy to add new tokens, networks, or recipient filters.

---

## Flow Summary
1. User selects token and amount.
2. Configures recipients and airdrop options.
3. Previews network, screenshot is captured.
4. Confirms and executes airdrop.
5. Announcement is posted automatically with all details and the network image.

---

For more details, see the code in `components/airdrop/` and related hooks/services.
