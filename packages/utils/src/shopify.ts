/**
 * Builds a Shopify product/store URL, appending a discount query param when a
 * referral code is provided. Pure function — safe to use on web and mobile.
 *
 * @param baseUrl - the Shopify product or store URL
 * @param referralCode - optional referral code to apply as a discount
 */
export function buildShopifyUrl(baseUrl: string, referralCode?: string | null): string {
  if (!referralCode) return baseUrl
  const code = referralCode.trim().toUpperCase()
  if (!code) return baseUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}discount=${encodeURIComponent(code)}`
}
