export const PLATFORM_LIMITS: Record<string, { max: number; warning: number }> = {
  whatsapp: { max: 4096, warning: 3800 },
  sms: { max: 160, warning: 140 },
  instagram: { max: 1000, warning: 900 },
  facebook: { max: 20000, warning: 18000 },
  email: { max: 50000, warning: 45000 },
  linkedin: { max: 3000, warning: 2700 },
};

export function getCharacterStatus(
  platform: string,
  length: number
): { ok: boolean; warning: boolean; overLimit: boolean } {
  const limit = PLATFORM_LIMITS[platform];
  if (!limit) return { ok: true, warning: false, overLimit: false };
  return {
    ok: length <= limit.warning,
    warning: length > limit.warning && length <= limit.max,
    overLimit: length > limit.max,
  };
}
