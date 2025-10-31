import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-only safety check - prevent this from being imported in client code
if (typeof window !== 'undefined') {
  throw new Error('Server-only Supabase client cannot be imported in the browser');
}

// Server-side Supabase client with service role key
let supabaseAdmin: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
};

// Client-side Supabase client (public key)
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLIC_KEY'
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseClient;
};

// Utility functions for signup-specific operations

export const validateVipCode = async (code: string) => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('vip_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid VIP code' };
  }

  if (data.consumed_at) {
    return { valid: false, error: 'VIP code has already been used' };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'VIP code has expired' };
  }

  return { valid: true, data };
};

export const createSignupSession = async (
  vipCodeId: string,
  username: string,
  email: string,
  signupToken: string
) => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('signup_sessions')
    .insert({
      id: signupToken,
      vip_code_id: vipCodeId,
      username: username.toLowerCase(),
      email,
      status: 'INIT',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  return { data, error };
};

export const logVipCodeUsage = async (
  vipCodeId: string,
  signupSessionId: string,
  email: string,
  username: string,
  status: 'INIT' | 'SUCCESS' | 'FAILED',
  errorMessage?: string
) => {
  const supabase = getSupabaseAdmin();

  const updateData: any = {
    status,
  };

  if (status === 'INIT') {
    updateData.vip_code_id = vipCodeId;
    updateData.signup_session_id = signupSessionId;
    updateData.email = email;
    updateData.username = username;
    updateData.attempted_at = new Date().toISOString();
  } else {
    updateData.completed_at = new Date().toISOString();
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
  }

  if (status === 'INIT') {
    const { error } = await supabase
      .from('vip_code_uses')
      .insert(updateData);
    return { error };
  } else {
    const { error } = await supabase
      .from('vip_code_uses')
      .update(updateData)
      .eq('signup_session_id', signupSessionId);
    return { error };
  }
};

export const consumeVipCode = async (
  vipCodeId: string,
  email: string,
  username: string
) => {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('vip_codes')
    .update({
      consumed_at: new Date().toISOString(),
      consumed_email: email,
      consumed_username: username,
    })
    .eq('id', vipCodeId);

  return { error };
};

export const createUser = async (
  username: string,
  email: string,
  vipCodeUsed?: string
) => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('users')
    .insert({
      username: username.toLowerCase(),
      email,
      hive_account: username.toLowerCase(),
      created_at: new Date().toISOString(),
      signup_method: 'vip_code',
      vip_code_used: vipCodeUsed,
    })
    .select()
    .single();

  return { data, error };
};

export const createAuthOTT = async (username: string) => {
  const supabase = getSupabaseAdmin();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const { data, error } = await supabase
    .from('auth_ott')
    .insert({
      token,
      username: username.toLowerCase(),
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data, error, token };
};

export const validateAndConsumeOTT = async (token: string) => {
  const supabase = getSupabaseAdmin();

  // Get the OTT
  const { data: ottData, error: ottError } = await supabase
    .from('auth_ott')
    .select('*')
    .eq('token', token)
    .is('consumed_at', null)
    .single();

  if (ottError || !ottData) {
    return { valid: false, error: 'Invalid or expired one-time token' };
  }

  // Check expiration
  if (new Date(ottData.expires_at) < new Date()) {
    return { valid: false, error: 'One-time token has expired' };
  }

  // Consume the token
  const { error: consumeError } = await supabase
    .from('auth_ott')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token', token);

  if (consumeError) {
    return { valid: false, error: 'Failed to consume one-time token' };
  }

  return { valid: true, data: ottData };
};