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

export type InferredDistrictResult = {
  district: string;
  confidence: "high" | "medium" | "low";
  matchType: "exact" | "alias" | "fuzzy";
} | null;

// Common district aliases for fuzzy matching
const DISTRICT_ALIASES: Record<string, string[]> = {
  // Karnataka
  "Bengaluru Urban": ["Bangalore Urban", "Bangalore", "Bengaluru", "BLR"],
  "Bengaluru Rural": ["Bangalore Rural"],
  "Mysuru": ["Mysore"],
  "Mangaluru": ["Mangalore"],
  "Belagavi": ["Belgaum", "Belgavi"],
  "Kalaburagi": ["Gulbarga"],
  "Vijayapura": ["Bijapur"],
  "Shivamogga": ["Shimoga"],
  "Tumakuru": ["Tumkur"],
  "Hubballi-Dharwad": ["Hubli", "Dharwad", "Hubli-Dharwad"],
  
  // Maharashtra
  "Mumbai": ["Bombay", "Greater Mumbai"],
  "Mumbai Suburban": ["Mumbai Suburbs"],
  "Chhatrapati Sambhajinagar": ["Aurangabad"],
  "Dharashiv": ["Osmanabad"],
  
  // Tamil Nadu
  "Chennai": ["Madras"],
  "Tiruchirappalli": ["Trichy", "Trichinopoly"],
  "Kanchipuram": ["Kancheepuram", "Kanchi"],
  "Coimbatore": ["Kovai"],
  "Madurai": ["Madura"],
  "Thanjavur": ["Tanjore"],
  
  // Telangana
  "Hyderabad": ["Secunderabad", "GHMC", "Greater Hyderabad"],
  
  // Andhra Pradesh
  "Visakhapatnam": ["Vizag", "Vizianagaram"],
  
  // West Bengal
  "Kolkata": ["Calcutta"],
  "North 24 Parganas": ["North 24 Paraganas", "N 24 Parganas", "North Twenty Four Parganas"],
  "South 24 Parganas": ["South 24 Paraganas", "S 24 Parganas", "South Twenty Four Parganas"],
  
  // Uttar Pradesh
  "Varanasi": ["Banaras", "Benares", "Kashi"],
  "Prayagraj": ["Allahabad"],
  "Ayodhya": ["Faizabad"],
  
  // Gujarat
  "Ahmedabad": ["Amdavad"],
  "Vadodara": ["Baroda"],
  
  // Kerala
  "Thiruvananthapuram": ["Trivandrum", "TVM"],
  "Kochi": ["Cochin", "Ernakulam"],
  "Kozhikode": ["Calicut"],
  "Alappuzha": ["Alleppey"],
  "Thrissur": ["Trichur"],
  
  // Odisha
  "Bhubaneswar": ["Bhubaneshwar", "BBSR"],
  "Puri": ["Jagannath Puri"],
  
  // Rajasthan
  "Jaipur": ["Pink City"],
  
  // Bihar
  "Patna": ["Pataliputra"],
  
  // Punjab
  "Amritsar": ["Ambarsar"],
  "Ludhiana": ["Ludhiyana"],
};

// Build reverse lookup: alias -> canonical name
const ALIAS_TO_CANONICAL: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(DISTRICT_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_TO_CANONICAL[alias.toLowerCase()] = canonical;
  }
  // Also map canonical to itself (lowercase)
  ALIAS_TO_CANONICAL[canonical.toLowerCase()] = canonical;
}

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,     // deletion
        d[i][j - 1] + 1,     // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

// Calculate similarity ratio (0-1)
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

export function inferDistrictFromText(
  story: StoryForInference,
  districts: DistrictCandidate[]
): InferredDistrictResult {
  if (story.district) {
    return { district: story.district, confidence: "high", matchType: "exact" };
  }
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

  // Prefer longer names first to avoid partial matches
  const ordered = [...districts].sort((a, b) => b.name.length - a.name.length);

  // Phase 1: Exact match on district name or headquarters
  for (const d of ordered) {
    const name = d.name.toLowerCase();
    const hq = d.headquarters?.toLowerCase();

    const nameRe = new RegExp(`\\b${escapeRegExp(name)}\\b`, "i");
    if (nameRe.test(haystack)) {
      return { district: d.name, confidence: "high", matchType: "exact" };
    }

    if (hq) {
      const hqRe = new RegExp(`\\b${escapeRegExp(hq)}\\b`, "i");
      if (hqRe.test(haystack)) {
        return { district: d.name, confidence: "high", matchType: "exact" };
      }
    }
  }

  // Phase 2: Alias matching
  for (const d of ordered) {
    const canonical = ALIAS_TO_CANONICAL[d.name.toLowerCase()];
    const aliases = DISTRICT_ALIASES[canonical || d.name] || [];
    
    for (const alias of aliases) {
      const aliasRe = new RegExp(`\\b${escapeRegExp(alias.toLowerCase())}\\b`, "i");
      if (aliasRe.test(haystack)) {
        return { district: d.name, confidence: "high", matchType: "alias" };
      }
    }
  }

  // Phase 3: Fuzzy matching (only if haystack has district-like words)
  const words = haystack.split(/\s+/).filter(w => w.length > 3);
  
  let bestMatch: { district: string; sim: number } | null = null;
  
  for (const d of ordered) {
    const nameLower = d.name.toLowerCase();
    
    for (const word of words) {
      const sim = similarity(word, nameLower);
      if (sim >= 0.85 && (!bestMatch || sim > bestMatch.sim)) {
        bestMatch = { district: d.name, sim };
      }
    }
    
    // Also check headquarters
    if (d.headquarters) {
      const hqLower = d.headquarters.toLowerCase();
      for (const word of words) {
        const sim = similarity(word, hqLower);
        if (sim >= 0.85 && (!bestMatch || sim > bestMatch.sim)) {
          bestMatch = { district: d.name, sim };
        }
      }
    }
  }

  if (bestMatch) {
    const confidence = bestMatch.sim >= 0.95 ? "medium" : "low";
    return { district: bestMatch.district, confidence, matchType: "fuzzy" };
  }

  return null;
}

// Simple wrapper that returns just the district name (backward compatible)
export function inferDistrictName(
  story: StoryForInference,
  districts: DistrictCandidate[]
): string | null {
  const result = inferDistrictFromText(story, districts);
  return result?.district || null;
}
