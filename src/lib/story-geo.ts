export function normalizeLanguageCode(lang: string | null | undefined): string | null {
  if (!lang) return null;
  return lang.toLowerCase().split(/[-_]/)[0] || null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type DistrictCandidate = {
  name: string;
  headquarters?: string;
};

export type StoryForInference = {
  headline: string;
  summary?: string | null;
  city?: string | null;
  district?: string | null;
  original_headline?: string | null;
  original_summary?: string | null;
};

export function inferDistrictFromText(
  story: StoryForInference,
  districts: DistrictCandidate[]
): string | null {
  if (story.district) return story.district;
  if (!districts || districts.length === 0) return null;

  const haystack = [
    story.headline,
    story.summary,
    story.original_headline,
    story.original_summary,
    story.city,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!haystack) return null;

  // Prefer longer names first to avoid partial matches (e.g., "North" vs "North 24 Parganas")
  const ordered = [...districts].sort((a, b) => b.name.length - a.name.length);

  for (const d of ordered) {
    const name = d.name.toLowerCase();
    const hq = d.headquarters?.toLowerCase();

    const nameRe = new RegExp(`\\b${escapeRegExp(name)}\\b`, "i");
    if (nameRe.test(haystack)) return d.name;

    if (hq) {
      const hqRe = new RegExp(`\\b${escapeRegExp(hq)}\\b`, "i");
      if (hqRe.test(haystack)) return d.name;
    }
  }

  return null;
}
