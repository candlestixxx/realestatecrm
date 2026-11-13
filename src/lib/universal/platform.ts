/**
 * Universal CRM platform layer: languages, add-ons, tenant branding.
 * Custom add-ons are built and published by United Beats LLC (Bob & Lum).
 * HyperNexus drives the harness: automations, AI, sync, and workflows run
 * identically in every sector — only the pack configuration changes.
 */
export interface Language { code: string; label: string; native: string; rtl?: boolean }

export const LANGUAGES: Language[] = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "pl", label: "Polish", native: "Polski" },
  { code: "ar", label: "Arabic", native: "العربية", rtl: true },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "zh", label: "Chinese (Simplified)", native: "简体中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
];

/** Small starter dictionary; every string in the UI resolves through t(). */
export const STRINGS: Record<string, Record<string, string>> = {
  en: { welcome: "Welcome", customers: "Customers", pipeline: "Pipeline", getStarted: "Get started", tagline: "Every business. One harness." },
  es: { welcome: "Bienvenido", customers: "Clientes", pipeline: "Embudo", getStarted: "Comenzar", tagline: "Cada negocio. Un solo sistema." },
  fr: { welcome: "Bienvenue", customers: "Clients", pipeline: "Pipeline", getStarted: "Commencer", tagline: "Chaque entreprise. Un seul système." },
  de: { welcome: "Willkommen", customers: "Kunden", pipeline: "Pipeline", getStarted: "Loslegen", tagline: "Jedes Unternehmen. Ein System." },
  pt: { welcome: "Bem-vindo", customers: "Clientes", pipeline: "Funil", getStarted: "Começar", tagline: "Cada negócio. Um só sistema." },
  ar: { welcome: "مرحباً", customers: "العملاء", pipeline: "خط الأنابيب", getStarted: "ابدأ الآن", tagline: "كل عمل. نظام واحد." },
  zh: { welcome: "欢迎", customers: "客户", pipeline: "管道", getStarted: "开始使用", tagline: "每个企业。一个系统。" },
};

export function t(lang: string, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

export interface AddOn {
  id: string; name: string; blurb: string; priceMonthly: number;
  sectors: string[] | "all"; byUnitedBeats: true;
}

export const ADD_ONS: AddOn[] = [
  { id: "ai-receptionist", name: "AI Receptionist (HyperNexus Voice)", blurb: "Answers, qualifies, and books in every language, 24/7.", priceMonthly: 149, sectors: "all", byUnitedBeats: true },
  { id: "trust-tsf", name: "Trust, Security & Future (TSF)", blurb: "Trust documents, taught course, and done-with-you assembly.", priceMonthly: 0, sectors: ["real-estate", "legal", "finance"], byUnitedBeats: true },
  { id: "review-engine", name: "Review & Referral Engine", blurb: "Automatic review requests and referral campaigns after every win.", priceMonthly: 49, sectors: "all", byUnitedBeats: true },
  { id: "smart-scheduling", name: "Smart Scheduling & Routes", blurb: "Calendars, dispatch, and route planning for field teams.", priceMonthly: 79, sectors: ["construction", "home-services", "healthcare", "hospitality"], byUnitedBeats: true },
  { id: "commerce-sync", name: "Commerce Sync", blurb: "Orders, carts, and inventory synced into the pipeline.", priceMonthly: 99, sectors: ["retail"], byUnitedBeats: true },
  { id: "compliance-vault", name: "Compliance Vault", blurb: "Sector checklists, disclosures, and audit trails, always on.", priceMonthly: 129, sectors: ["healthcare", "legal", "finance"], byUnitedBeats: true },
];

export interface TenantBrand {
  businessName: string; sectorId: string; language: string;
  primaryColor: string; accentColor: string; logoUrl?: string;
  poweredBy: "United Beats LLC (Bob & Lum) — Universal CRM on HyperNexus";
}

export function addOnsForSector(sectorId: string): AddOn[] {
  return ADD_ONS.filter((a) => a.sectors === "all" || a.sectors.includes(sectorId));
}
