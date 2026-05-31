import { globalMetaTitle } from "@utils/meta";
import { Account } from "@/interfaces/Account";

export const defaultBrandingTitle = globalMetaTitle;

export function getAccountBrandingLogoDataURL(account?: Account) {
  return account?.settings?.extra?.branding_logo_data_url?.trim() ?? "";
}

export function getAccountBrandingTitle(account?: Account) {
  return account?.settings?.extra?.branding_tab_title?.trim() ?? "";
}

export function getEffectiveBrandingTitle(account?: Account) {
  return getAccountBrandingTitle(account) || defaultBrandingTitle;
}

export function getBrandedDocumentTitle(
  currentTitle: string,
  brandingTitle: string,
  previousBrandingTitle = defaultBrandingTitle,
) {
  const nextBrandingTitle = brandingTitle.trim() || defaultBrandingTitle;
  const title = currentTitle.trim() || defaultBrandingTitle;
  const suffixes = [previousBrandingTitle, defaultBrandingTitle]
    .map((value) => value.trim())
    .filter(Boolean);

  for (const suffix of suffixes) {
    if (title === suffix) return nextBrandingTitle;
    const separatorSuffix = ` - ${suffix}`;
    if (title.endsWith(separatorSuffix)) {
      return `${title.slice(
        0,
        -separatorSuffix.length,
      )} - ${nextBrandingTitle}`;
    }
  }

  return nextBrandingTitle;
}
