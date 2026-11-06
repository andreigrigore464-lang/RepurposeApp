/**
 * Single-User / Multi-Tenant Seam
 * Provides the current account and brand IDs. In this MVP, it returns the seeded
 * default IDs. When authentication is added in the future, this is the only file modified.
 */

export interface CurrentContext {
  accountId: string;
  brandId: string;
}

export const DEFAULT_ACCOUNT_ID = "00000000-0000-0000-0000-000000000001";
export const DEFAULT_BRAND_ID = "00000000-0000-0000-0000-000000000002";

export async function getCurrentContext(): Promise<CurrentContext> {
  return {
    accountId: DEFAULT_ACCOUNT_ID,
    brandId: DEFAULT_BRAND_ID,
  };
}

