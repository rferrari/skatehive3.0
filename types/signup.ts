// TypeScript types for Skatehive VIP Signup database tables

export interface VipCode {
  id: string;
  code: string;
  created_by?: string;
  created_at: string;
  expires_at?: string | null;
  consumed_at?: string | null;
  consumed_email?: string | null;
  consumed_username?: string | null;
  notes?: string | null;
}

export interface VipCodeUse {
  id: string;
  vip_code_id: string;
  signup_session_id?: string;
  email: string;
  username: string;
  status: 'INIT' | 'SUCCESS' | 'FAILED';
  error_message?: string | null;
  attempted_at: string;
  completed_at?: string | null;
}

export interface SignupSession {
  id: string; // This is the signup_token
  vip_code_id: string;
  username: string;
  email: string;
  status: 'INIT' | 'SUCCESS' | 'FAILED';
  backup_blob?: any | null; // JSONB field for temporary key storage
  error_message?: string | null;
  created_at: string;
  expires_at: string;
  completed_at?: string | null;
  // Joined data
  vip_codes?: VipCode;
}

export interface AuthOTT {
  id: string;
  token: string;
  username: string;
  created_at: string;
  expires_at: string;
  consumed_at?: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  hive_account: string;
  created_at: string;
  last_login?: string | null;
  signup_method: string;
  vip_code_used?: string | null;
  preferences: Record<string, any>;
}

// API Request/Response types

export interface InitSignupRequest {
  username: string;
  email: string;
  vip_code: string;
}

export interface InitSignupResponse {
  signup_token: string;
  message: string;
}

export interface SubmitSignupRequest {
  signup_token: string;
  pubkeys: {
    owner: string;
    active: string;
    posting: string;
    memo: string;
  };
  backup_blob: {
    version: number;
    cipher: string;
    data: any;
  };
}

export interface SubmitSignupResponse {
  success: true;
  ott?: string;
  username: string;
  message: string;
}

export interface OTTAuthResponse {
  success: true;
  username: string;
  jwt: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
}

// Hive-specific types for account creation

export interface HiveAuthority {
  weight_threshold: number;
  key_auths: [string, number][];
  account_auths: any[];
}

export interface HiveCreateAccountPayload {
  new_account_name: string;
  owner: HiveAuthority;
  active: HiveAuthority;
  posting: HiveAuthority;
  memo_key: string;
}

// Environment variables type checking
export interface SignupEnvVars {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SIGNER_URL: string;
  SIGNER_TOKEN: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_SECURE: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  EMAIL_COMMUNITY?: string;
  EMAIL_RECOVERYACC?: string;
  JWT_SECRET?: string;
}