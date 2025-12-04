export const AD_STORAGE_KEY = "fastlink-sponsored-ads";
export const CUSTOM_ADS_EVENT = "custom-ads-updated";

export type SponsoredAdFormat = "image" | "image-text";
export type SponsoredAdStatus = "active" | "paused" | "stopped";

export type SponsoredAdAction = "website" | "call";
export type SponsoredAdGender = "all" | "male" | "female";

export interface SponsoredAd {
  id: string;
  ownerId: string | null;
  format: SponsoredAdFormat;
  actionType: SponsoredAdAction;
  href: string;
  imageUrl: string;
  imageAlt: string;
  headline?: string;
  body?: string;
  createdAt?: string;
  status?: SponsoredAdStatus;
  targetGender?: SponsoredAdGender;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const generateAdId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `ad-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const readStoredAds = (): SponsoredAd[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(AD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isRecord)
      .map((item) => {
        const id = typeof item.id === "string" ? item.id : generateAdId();
        const ownerId =
          typeof item.ownerId === "string" || item.ownerId === null ? item.ownerId ?? null : null;
        const format: SponsoredAdFormat =
          item.format === "image" || item.format === "image-text" ? item.format : "image";
        const actionType: SponsoredAdAction =
          item.actionType === "call" ? "call" : "website";
        const href = typeof item.href === "string" ? item.href : "#";
        const imageUrl = typeof item.imageUrl === "string" ? item.imageUrl : "";
        const imageAlt = typeof item.imageAlt === "string" ? item.imageAlt : "Sponsored placement";
        const headline = typeof item.headline === "string" ? item.headline : undefined;
        const body = typeof item.body === "string" ? item.body : undefined;
        const createdAt = typeof item.createdAt === "string" ? item.createdAt : undefined;
        const status: SponsoredAdStatus =
          item.status === "paused" || item.status === "stopped" ? item.status : "active";
        const targetGender: SponsoredAdGender =
          item.targetGender === "male" || item.targetGender === "female"
            ? item.targetGender
            : "all";
        return {
          id,
          ownerId,
          format,
          actionType,
          href,
          imageUrl,
          imageAlt,
          headline,
          body,
          createdAt,
          status,
          targetGender,
        };
      })
      .filter((ad) => Boolean(ad.imageUrl && ad.href));
  } catch (error) {
    console.error("Failed to read stored ads:", error);
    return [];
  }
};

export const writeStoredAds = (ads: SponsoredAd[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AD_STORAGE_KEY, JSON.stringify(ads));
  } catch (error) {
    console.error("Failed to persist sponsored ads:", error);
  }
};


