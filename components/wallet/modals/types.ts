/**
 * Type definitions for wallet modal components
 * These interfaces ensure type safety across all wallet operations
 */

// Base modal props that all modals extend
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// HIVE Operations
// ============================================================================

export interface SendHiveModalProps extends BaseModalProps {
  balance: string;
}

export interface PowerUpModalProps extends BaseModalProps {
  balance: string;
}

export interface PowerDownModalProps extends BaseModalProps {
  hivePower: string;
}

export interface DelegateHiveModalProps extends BaseModalProps {
  hivePower: string;
}

// ============================================================================
// HBD Operations
// ============================================================================

export interface SendHBDModalProps extends BaseModalProps {
  balance: string;
}

export interface ConvertHiveModalProps extends BaseModalProps {
  hiveBalance: string;
  hbdBalance: string;
}

// ============================================================================
// Bank Operations
// ============================================================================

export interface DepositHBDSavingsModalProps extends BaseModalProps {
  hbdBalance: string;
}

export interface WithdrawHBDSavingsModalProps extends BaseModalProps {
  savingsBalance: string;
}

export interface DepositHiveSavingsModalProps extends BaseModalProps {
  hiveBalance: string;
}

export interface WithdrawHiveSavingsModalProps extends BaseModalProps {
  savingsBalance: string;
}

// ============================================================================
// PIX Operations (Future)
// ============================================================================

export interface PIXTransferModalProps extends BaseModalProps {
  // PIX-specific props will be added when implementing PIX functionality
  balance?: string;
}

// ============================================================================
// Common Types
// ============================================================================

export type WalletCurrency = 'HIVE' | 'HBD';
export type ConversionDirection = 'HIVE_TO_HBD' | 'HBD_TO_HIVE';

// Transaction result type
export interface TransactionResult {
  success: boolean;
  result?: any;
  error?: string;
  errorCode?: number;
}

// Modal form state
export interface ModalFormState {
  amount: string;
  username?: string;
  memo?: string;
  encryptMemo?: boolean;
}
