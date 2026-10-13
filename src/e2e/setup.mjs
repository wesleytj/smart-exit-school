import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Load environment variables (.env.local has priority)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const JWT_SECRET = process.env.SUPABASE_LOCAL_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';

// Canonical Multi-Tenant Fixtures
export const TENANT_A_SCHOOL_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
export const TENANT_B_SCHOOL_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
export const USER_A_ID = '11111111-1111-1111-1111-111111111111';
export const USER_B_ID = '22222222-2222-2222-2222-222222222222';
export const PLATFORM_ADMIN_ID = '6f4f26ae-0bcf-434d-94ee-ada82ddc8b25';

// Pre-seeded academic IDs for Tenant Alpha
export const TENANT_A_SCHOOL_YEAR_ID = 'aaaaaaaa-1000-0000-0000-aaaaaaaaaaaa';
export const TENANT_A_ACADEMIC_LEVEL_ID = 'aaaaaaaa-2000-0000-0000-aaaaaaaaaaaa';
export const TENANT_A_ACADEMIC_GROUP_ID = 'aaaaaaaa-3000-0000-0000-aaaaaaaaaaaa';
export const TENANT_A_GATE_ID = 'aaaaaaaa-0003-0000-0000-aaaaaaaaaaaa';
export const TENANT_A_STUDENT_ID = 'aaaaaaaa-5000-0000-0000-aaaaaaaaaaaa';
export const TENANT_A_ENROLLMENT_ID = 'aaaaaaaa-6000-0000-0000-aaaaaaaaaaaa';

// Pre-seeded academic IDs for Tenant Beta
export const TENANT_B_SCHOOL_YEAR_ID = 'bbbbbbbb-1000-0000-0000-bbbbbbbbbbbb';
export const TENANT_B_GATE_ID = 'bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb';
export const TENANT_B_STUDENT_ID = 'bbbbbbbb-5000-0000-0000-bbbbbbbbbbbb';
export const TENANT_B_ENROLLMENT_ID = 'bbbbbbbb-6000-0000-0000-bbbbbbbbbbbb';

/**
 * Creates a signed JWT access token for a given user.
 */
export function createAccessToken(userId, role = 'authenticated', extraClaims = {}) {
  return jwt.sign(
    {
      aud: 'authenticated',
      role,
      sub: userId,
      email: `${userId}@smart-exit.local`,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: 'supabase',
      ...extraClaims
    },
    JWT_SECRET
  );
}

/**
 * Creates a Supabase client authenticated via Authorization Bearer header.
 */
export function createAuthedClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

/**
 * Convenience helper: authenticated client for Tenant Alpha Operator
 */
export function getAlphaClient() {
  const token = createAccessToken(USER_A_ID);
  return createAuthedClient(token);
}

/**
 * Convenience helper: authenticated client for Tenant Beta Operator
 */
export function getBetaClient() {
  const token = createAccessToken(USER_B_ID);
  return createAuthedClient(token);
}

/**
 * Convenience helper: authenticated client for Platform Admin
 */
export function getPlatformAdminClient() {
  const token = createAccessToken(PLATFORM_ADMIN_ID);
  return createAuthedClient(token);
}

/**
 * Convenience helper: service role client (bypasses RLS for maintenance/cleanup/archive)
 */
export function getServiceRoleClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service role operations');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
