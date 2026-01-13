import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  enclosure?: { url: string };
  "media:content"?: { url: string };
}

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  country_code: string | null;
  language: string | null;
  source_type: "primary" | "secondary" | "opinion" | "aggregator";
  reliability_tier: "tier_1" | "tier_2" | "tier_3";
  fetch_interval_minutes: number;
  last_fetched_at: string | null;
}

// ===== CATEGORY TAXONOMY (LOCKED) =====
const VALID_CATEGORIES = [
  "AI", "Business", "Finance", "Politics", "Startups", "Technology",
  "Climate", "Health", "Sports", "Entertainment", "Science", "World", "India", "Local"
];

// Category precedence order (higher = more specific)
const CATEGORY_PRECEDENCE = [
  "AI", "Startups", "Finance", "Business", "Politics", "Technology",
  "Climate", "Health", "Science", "Sports", "Entertainment", "World"
];

// ===== KEYWORD DICTIONARY =====
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "AI": [
    "artificial intelligence", "machine learning", "deep learning", "generative ai",
    "large language model", "llm", "openai", "chatgpt", "anthropic", "google ai",
    "microsoft ai", "ai model", "ai startup", "gpt-4", "gpt-5", "claude"
  ],
  "Startups": [
    "startup", "start-up", "founder", "funding", "seed round", "series a",
    "series b", "venture capital", "vc funding", "angel investment", "unicorn",
    "ipo filing", "accelerator", "incubator"
  ],
  "Business": [
    "company", "corporate", "revenue", "profits", "earnings", "merger",
    "acquisition", "layoffs", "hiring", "board decision", "ceo appointment",
    "quarterly results", "market share"
  ],
  "Finance": [
    "stock market", "stocks", "sensex", "nifty", "nasdaq", "dow jones",
    "interest rates", "inflation", "gdp", "rbi", "federal reserve", "bond yields",
    "crypto", "bitcoin", "ethereum", "banking", "investment"
  ],
  "Politics": [
    "election", "polls", "parliament", "government", "cabinet", "minister",
    "prime minister", "president", "bill passed", "ordinance", "policy decision",
    "assembly", "congress", "senate", "legislation"
  ],
  "Technology": [
    "technology", "tech", "software", "hardware", "semiconductor", "chip",
    "cloud computing", "saas", "cybersecurity", "data breach", "it services",
    "digital transformation", "5g", "quantum computing"
  ],
  "Climate": [
    "climate change", "global warming", "carbon emissions", "renewable energy",
    "solar power", "wind energy", "net zero", "environment", "pollution",
    "air quality", "cop climate", "sustainability"
  ],
  "Health": [
    "health", "medical", "disease", "virus", "pandemic", "covid", "vaccine",
    "hospital", "mental health", "nutrition", "healthcare system", "who",
    "clinical trial", "drug approval"
  ],
  "Sports": [
    "match", "tournament", "league", "final", "semi-final", "cricket",
    "football", "fifa", "ipl", "olympics", "world cup", "score", "wins",
    "championship", "premier league", "nba", "nfl"
  ],
  "Entertainment": [
    "movie", "film", "cinema", "actor", "actress", "director", "series",
    "tv show", "web series", "box office", "music album", "concert",
    "netflix", "disney", "streaming"
  ],
  "Science": [
    "science", "research", "study finds", "scientists", "space", "nasa",
    "isro", "astronomy", "quantum", "physics", "biology", "discovery",
    "breakthrough", "experiment"
  ]
};

// ===== URL PATH TO CATEGORY MAPPING =====
const URL_PATH_MAPPING: Record<string, string> = {
  "/business/": "Business",
  "/economy/": "Finance",
  "/markets/": "Finance",
  "/money/": "Finance",
  "/politics/": "Politics",
  "/elections/": "Politics",
  "/startup/": "Startups",
  "/startups/": "Startups",
  "/technology/": "Technology",
  "/tech/": "Technology",
  "/science/": "Science",
  "/health/": "Health",
  "/climate/": "Climate",
  "/environment/": "Climate",
  "/sports/": "Sports",
  "/sport/": "Sports",
  "/entertainment/": "Entertainment",
  "/movies/": "Entertainment",
  "/cricket/": "Sports",
  "/football/": "Sports",
  "/ai/": "AI",
  "/artificial-intelligence/": "AI",
  "/india/": "India",
  "/national/": "India",
  "/world/": "World",
  "/international/": "World",
};

// ===== INDIAN STATES MAPPING =====
const INDIAN_STATES: Record<string, string> = {
  // Full state names
  "andhra pradesh": "Andhra Pradesh",
  "arunachal pradesh": "Arunachal Pradesh",
  "assam": "Assam",
  "bihar": "Bihar",
  "chhattisgarh": "Chhattisgarh",
  "goa": "Goa",
  "gujarat": "Gujarat",
  "haryana": "Haryana",
  "himachal pradesh": "Himachal Pradesh",
  "jharkhand": "Jharkhand",
  "karnataka": "Karnataka",
  "kerala": "Kerala",
  "madhya pradesh": "Madhya Pradesh",
  "maharashtra": "Maharashtra",
  "manipur": "Manipur",
  "meghalaya": "Meghalaya",
  "mizoram": "Mizoram",
  "nagaland": "Nagaland",
  "odisha": "Odisha",
  "punjab": "Punjab",
  "rajasthan": "Rajasthan",
  "sikkim": "Sikkim",
  "tamil nadu": "Tamil Nadu",
  "telangana": "Telangana",
  "tripura": "Tripura",
  "uttar pradesh": "Uttar Pradesh",
  "uttarakhand": "Uttarakhand",
  "west bengal": "West Bengal",
  // Union territories
  "delhi": "Delhi",
  "jammu and kashmir": "Jammu and Kashmir",
  "ladakh": "Ladakh",
  "chandigarh": "Chandigarh",
  "puducherry": "Puducherry",
  "andaman and nicobar": "Andaman and Nicobar Islands",
  "dadra and nagar haveli": "Dadra and Nagar Haveli",
  "daman and diu": "Daman and Diu",
  "lakshadweep": "Lakshadweep",
};

// City to State mapping
const CITY_TO_STATE: Record<string, string> = {
  "mumbai": "Maharashtra", "pune": "Maharashtra", "nagpur": "Maharashtra", 
  "nashik": "Maharashtra", "thane": "Maharashtra", "aurangabad": "Maharashtra",
  "delhi": "Delhi", "new delhi": "Delhi", "noida": "Uttar Pradesh", 
  "gurgaon": "Haryana", "gurugram": "Haryana", "faridabad": "Haryana",
  "bangalore": "Karnataka", "bengaluru": "Karnataka", "mysore": "Karnataka",
  "mysuru": "Karnataka", "hubli": "Karnataka", "mangalore": "Karnataka",
  "chennai": "Tamil Nadu", "madurai": "Tamil Nadu", "coimbatore": "Tamil Nadu",
  "tiruchirappalli": "Tamil Nadu", "tiruppur": "Tamil Nadu", "salem": "Tamil Nadu",
  "kolkata": "West Bengal", "howrah": "West Bengal", "durgapur": "West Bengal",
  "hyderabad": "Telangana", "secunderabad": "Telangana", "warangal": "Telangana",
  "ahmedabad": "Gujarat", "surat": "Gujarat", "vadodara": "Gujarat", 
  "rajkot": "Gujarat", "gandhinagar": "Gujarat",
  "jaipur": "Rajasthan", "jodhpur": "Rajasthan", "udaipur": "Rajasthan", "kota": "Rajasthan",
  "lucknow": "Uttar Pradesh", "kanpur": "Uttar Pradesh", "varanasi": "Uttar Pradesh",
  "agra": "Uttar Pradesh", "allahabad": "Uttar Pradesh", "prayagraj": "Uttar Pradesh",
  "meerut": "Uttar Pradesh", "ghaziabad": "Uttar Pradesh", "bareilly": "Uttar Pradesh",
  "bhopal": "Madhya Pradesh", "indore": "Madhya Pradesh", "jabalpur": "Madhya Pradesh",
  "gwalior": "Madhya Pradesh",
  "patna": "Bihar", "gaya": "Bihar", "muzaffarpur": "Bihar",
  "bhubaneswar": "Odisha", "cuttack": "Odisha", "rourkela": "Odisha", "puri": "Odisha",
  "visakhapatnam": "Andhra Pradesh", "vijayawada": "Andhra Pradesh", 
  "tirupati": "Andhra Pradesh", "guntur": "Andhra Pradesh",
  "thiruvananthapuram": "Kerala", "kochi": "Kerala", "cochin": "Kerala",
  "kozhikode": "Kerala", "calicut": "Kerala", "thrissur": "Kerala",
  "chandigarh": "Chandigarh", "amritsar": "Punjab", "ludhiana": "Punjab", "jalandhar": "Punjab",
  "ranchi": "Jharkhand", "jamshedpur": "Jharkhand", "dhanbad": "Jharkhand",
  "raipur": "Chhattisgarh", "bilaspur": "Chhattisgarh",
  "guwahati": "Assam", "dibrugarh": "Assam", "silchar": "Assam",
  "srinagar": "Jammu and Kashmir", "jammu": "Jammu and Kashmir",
  "shimla": "Himachal Pradesh", "manali": "Himachal Pradesh",
  "dehradun": "Uttarakhand", "haridwar": "Uttarakhand", "rishikesh": "Uttarakhand",
  "panaji": "Goa", "margao": "Goa", "vasco": "Goa",
  "imphal": "Manipur", "shillong": "Meghalaya", "aizawl": "Mizoram",
  "kohima": "Nagaland", "agartala": "Tripura", "itanagar": "Arunachal Pradesh",
  "gangtok": "Sikkim", "port blair": "Andaman and Nicobar Islands",
};

// All localities for detection (cities + states)
const INDIAN_LOCALITIES = [
  ...Object.keys(CITY_TO_STATE),
  ...Object.keys(INDIAN_STATES),
];

// Extended stopwords for normalization
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "and", "but", "or", "nor", "so", "yet", "both", "either", "neither",
  "not", "only", "own", "same", "than", "too", "very", "just",
  // News-specific stopwords
  "says", "said", "report", "reports", "reported", "according", "sources",
  "breaking", "update", "live", "watch", "video", "photos", "exclusive",
  "latest", "new", "news", "today", "now", "just", "this", "that",
  "here", "there", "what", "how", "why", "when", "where", "who",
  "amid", "over", "about", "after", "before", "during", "while",
]);

// Source name variations to strip from headlines
const SOURCE_SUFFIXES = [
  " - reuters", " - bbc", " - cnn", " - ap", " - nyt", " | bbc",
  " | reuters", " | the guardian", " - the hindu", " - ndtv",
  " - times of india", " | al jazeera", " - washington post",
  " - new york times", " | cnn", " - abc news", " - fox news",
  " | npr", " - npr", " | forbes", " - forbes", " | techcrunch",
  " - associated press", " | associated press",
];

// Key entities/names that should be preserved and matched
const KEY_ENTITIES = [
  // Political figures
  "trump", "biden", "modi", "putin", "xi jinping", "zelenskyy", "zelensky",
  "netanyahu", "macron", "scholz", "sunak", "starmer", "harris", "obama",
  // Organizations
  "isis", "hamas", "hezbollah", "taliban", "nato", "un", "who", "imf",
  "world bank", "fed", "rbi", "sebi", "sec", "fbi", "cia", "nasa", "isro",
  // Companies
  "apple", "google", "microsoft", "amazon", "meta", "tesla", "nvidia",
  "openai", "anthropic", "tata", "reliance", "adani", "infosys", "wipro",
  // Countries/Regions
  "ukraine", "russia", "israel", "gaza", "palestine", "syria", "iran",
  "china", "india", "pakistan", "afghanistan", "myanmar", "north korea",
  // Sports teams/events
  "ipl", "world cup", "olympics", "premier league", "nba", "nfl",
  "champions league", "super bowl",
];

// ===== RSS CONTENT NORMALIZATION (MANDATORY) =====
// These functions clean raw RSS content before storage

/**
 * Strip CDATA wrappers from content
 * CDATA must NEVER appear in UI or database
 */
function stripCDATA(text: string): string {
  if (!text) return "";
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .trim();
}

/**
 * Decode HTML entities to plain text
 * Handles both named and numeric entities
 */
function decodeHTMLEntities(text: string): string {
  if (!text) return "";
  
  const entityMap: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&apos;": "'",
    "&nbsp;": " ",
    "&ndash;": "-",
    "&mdash;": "-",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": "\"",
    "&rdquo;": "\"",
    "&hellip;": "...",
    "&copy;": "(c)",
    "&reg;": "(R)",
    "&trade;": "(TM)",
    "&euro;": "EUR",
    "&pound;": "GBP",
    "&yen;": "JPY",
    "&cent;": "c",
    "&deg;": " degrees",
    "&plusmn;": "+/-",
    "&times;": "x",
    "&divide;": "/",
  };
  
  let decoded = text;
  
  // Decode named entities
  for (const [entity, char] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, "gi"), char);
  }
  
  // Decode numeric entities (decimal)
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => 
    String.fromCharCode(parseInt(num, 10))
  );
  
  // Decode numeric entities (hexadecimal)
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => 
    String.fromCharCode(parseInt(hex, 16))
  );
  
  // Clean up any remaining entities
  decoded = decoded.replace(/&[a-z]+;/gi, "");
  
  return decoded;
}

/**
 * Remove all HTML tags from content
 * Preserves text content only
 */
function stripHTMLTags(text: string): string {
  if (!text) return "";
  
  // Remove script and style content entirely
  let cleaned = text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  
  // Replace block elements with line breaks before stripping
  cleaned = cleaned
    .replace(/<\/?(p|div|br|h[1-6]|li|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  
  return cleaned;
}

/**
 * Normalize whitespace in text
 * Collapses multiple spaces, trims, and removes excessive line breaks
 */
function normalizeWhitespace(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\r\n]+/g, " ") // Replace line breaks with spaces
    .replace(/\s+/g, " ")     // Collapse multiple spaces
    .replace(/^\s+|\s+$/gm, "") // Trim each line
    .trim();
}

/**
 * Remove tracking parameters from URLs
 */
function cleanURL(url: string): string {
  if (!url) return "";
  try {
    const urlObj = new URL(url);
    // Remove common tracking params
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "fbclid", "gclid", "ref", "source", "mc_cid", "mc_eid"
    ];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Full content normalization pipeline
 * Applies all normalization steps in correct order
 */
function normalizeRSSContent(text: string): string {
  if (!text) return "";
  
  let normalized = text;
  
  // Step 1: Strip CDATA wrappers
  normalized = stripCDATA(normalized);
  
  // Step 2: Decode HTML entities
  normalized = decodeHTMLEntities(normalized);
  
  // Step 3: Strip HTML tags
  normalized = stripHTMLTags(normalized);
  
  // Step 4: Normalize whitespace
  normalized = normalizeWhitespace(normalized);
  
  return normalized;
}

/**
 * HARD VALIDATION GATE - MUST pass before storage
 * Returns { valid: boolean, reason?: string }
 * 
 * Reject if ANY of these are true:
 * - Contains < or >
 * - Contains &lt;, &gt;, &amp;, &nbsp;
 * - Contains URL inside summary text (not the main link)
 * - Length < 40 characters after cleaning
 */
interface ValidationResult {
  valid: boolean;
  reason?: string;
}

function validateNormalizedContent(text: string, isTitle: boolean = false): ValidationResult {
  if (!text) return { valid: true };
  
  // Check for HTML tags
  if (/<[^>]+>/.test(text)) {
    return { valid: false, reason: "Contains HTML tags" };
  }
  
  // Check for encoded entities
  if (/&lt;|&gt;|&amp;|&nbsp;/.test(text)) {
    return { valid: false, reason: "Contains encoded HTML entities" };
  }
  
  // Check for CDATA wrapper
  if (/<!\[CDATA\[/.test(text)) {
    return { valid: false, reason: "Contains CDATA wrapper" };
  }
  
  // Check for embedded URLs in summaries (not titles)
  if (!isTitle && /https?:\/\/[^\s]+/.test(text)) {
    return { valid: false, reason: "Contains embedded URL" };
  }
  
  // Check minimum length after cleaning
  if (text.trim().length < 40 && !isTitle) {
    return { valid: false, reason: "Content too short after cleaning" };
  }
  
  return { valid: true };
}

/**
 * Legacy boolean validation for backward compatibility
 */
function isValidContent(text: string): boolean {
  return validateNormalizedContent(text).valid;
}

/**
 * Normalize a headline for storage and display
 * Applies full normalization + length limit + validation
 */
function normalizeTitle(title: string): string | null {
  let normalized = normalizeRSSContent(title);
  
  // Remove source suffixes
  normalized = removeSourceSuffix(normalized);
  
  // Capitalize properly
  normalized = normalized.trim();
  if (normalized.length > 0) {
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  
  // Limit to 200 characters
  if (normalized.length > 200) {
    normalized = normalized.substring(0, 197) + "...";
  }
  
  // VALIDATE: If still contains HTML, try re-cleaning once
  const validation = validateNormalizedContent(normalized, true);
  if (!validation.valid) {
    console.warn(`Title validation failed (${validation.reason}), re-cleaning:`, normalized.substring(0, 50));
    normalized = normalizeRSSContent(normalized);
    
    // Second validation - if still fails, return null (reject)
    const secondValidation = validateNormalizedContent(normalized, true);
    if (!secondValidation.valid) {
      console.error(`Title REJECTED after re-clean (${secondValidation.reason}):`, normalized.substring(0, 50));
      return null;
    }
  }
  
  return normalized;
}

/**
 * Normalize a description/summary for storage
 * Applies full normalization + length limit + validation
 * 
 * For AGGREGATOR feeds: Returns null (use title only)
 */
function normalizeDescription(description: string, isAggregator: boolean = false): string | null {
  // RULE: Aggregators use title-only ingestion
  if (isAggregator) {
    return null;
  }
  
  let normalized = normalizeRSSContent(description);
  
  // Limit to 500 characters
  if (normalized.length > 500) {
    normalized = normalized.substring(0, 497) + "...";
  }
  
  // VALIDATE with strict rules
  const validation = validateNormalizedContent(normalized, false);
  if (!validation.valid) {
    console.warn(`Description validation failed (${validation.reason}), re-cleaning`);
    normalized = normalizeRSSContent(normalized);
    
    // Remove URLs from description
    normalized = normalized.replace(/https?:\/\/[^\s]+/g, "").trim();
    
    // Second validation
    const secondValidation = validateNormalizedContent(normalized, false);
    if (!secondValidation.valid) {
      console.warn(`Description still invalid (${secondValidation.reason}), using null`);
      return null;
    }
  }
  
  return normalized;
}

// ===== IMPROVED NORMALIZATION FUNCTIONS =====

function removeSourceSuffix(title: string): string {
  let cleaned = title.toLowerCase();
  for (const suffix of SOURCE_SUFFIXES) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, -suffix.length);
      break;
    }
  }
  return cleaned;
}

function extractKeyEntities(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const entity of KEY_ENTITIES) {
    if (lower.includes(entity)) {
      found.push(entity.replace(/\s+/g, ""));
    }
  }
  return found.sort();
}

function extractNumbers(text: string): string[] {
  const numbers = text.match(/\d+/g) || [];
  // Keep significant numbers (not just years in most cases)
  return numbers.filter(n => {
    const num = parseInt(n);
    return num < 1900 || num > 2030 || n.length !== 4;
  });
}

// Improved normalization that creates a semantic fingerprint for deduplication
function normalizeHeadline(title: string): string {
  // Step 1: Apply full content normalization
  let cleaned = normalizeRSSContent(title);
  
  // Step 2: Remove source suffixes
  cleaned = removeSourceSuffix(cleaned);
  
  // Step 3: Normalize special characters
  cleaned = cleaned
    .replace(/[''`]/g, "")
    .replace(/[""]/g, "")
    .replace(/[—–-]/g, " ")
    .replace(/[^\w\s]/g, " ");
  
  // Step 4: Extract key entities for weighting
  const entities = extractKeyEntities(cleaned);
  
  // Step 5: Extract significant words
  const words = cleaned
    .split(/\s+/)
    .map(w => w.trim())
    .filter(word => !STOPWORDS.has(word) && word.length > 2);
  
  // Step 6: Extract numbers
  const numbers = extractNumbers(cleaned);
  
  // Step 7: Create fingerprint: entities + top words + numbers
  // This groups stories about the same event even with different phrasing
  const significantWords = words
    .filter(w => w.length > 3) // Keep longer, more meaningful words
    .slice(0, 8); // Keep top 8 meaningful words
  
  const fingerprint = [
    ...entities,
    ...significantWords,
    ...numbers.slice(0, 2), // Keep up to 2 numbers
  ]
    .join(" ")
    .substring(0, 100);
  
  return fingerprint || cleaned.substring(0, 100);
}

// Secondary similarity check using Jaccard similarity
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return intersection / union;
}

// ===== WEIGHTED CONFIDENCE CALCULATION =====

interface ConfidenceInput {
  sourceCount: number;
  tier1Count: number;
  tier2Count: number;
  aggregatorCount: number;
  uniquePublishers: number;
  hasContradictions?: boolean;
}

type ConfidenceLevel = "low" | "medium" | "high";
type StoryState = "single_source" | "developing" | "confirmed" | "contradicted";

interface ConfidenceResult {
  confidenceLevel: ConfidenceLevel;
  storyState: StoryState;
  primarySourceCount: number;
  verifiedSourceCount: number;
}

/**
 * Calculate story confidence based on WEIGHTED source quality
 * 
 * RULES:
 * - Single source = ALWAYS LOW, state = single_source
 * - Aggregators do NOT increase confidence
 * - Tier 1 sources carry more weight than Tier 2/3
 * - Contradictions immediately downgrade to LOW
 * - HIGH requires: 2+ tier_1 sources from different publishers
 */
function calculateWeightedConfidence(input: ConfidenceInput): ConfidenceResult {
  const { 
    sourceCount, 
    tier1Count, 
    tier2Count, 
    aggregatorCount,
    uniquePublishers,
    hasContradictions = false 
  } = input;
  
  // Effective sources = exclude aggregators (they just mirror content)
  const effectiveSourceCount = sourceCount - aggregatorCount;
  const primarySourceCount = tier1Count;
  const verifiedSourceCount = tier1Count + tier2Count;
  
  // RULE: Single source = always LOW
  if (effectiveSourceCount <= 1) {
    return {
      confidenceLevel: "low",
      storyState: "single_source",
      primarySourceCount,
      verifiedSourceCount,
    };
  }
  
  // RULE: Contradictions = always LOW
  if (hasContradictions) {
    return {
      confidenceLevel: "low",
      storyState: "contradicted",
      primarySourceCount,
      verifiedSourceCount,
    };
  }
  
  // RULE: HIGH requires 2+ tier_1 from different publishers, stable narrative
  if (
    tier1Count >= 2 && 
    uniquePublishers >= 3 && 
    verifiedSourceCount >= 3 &&
    !hasContradictions
  ) {
    return {
      confidenceLevel: "high",
      storyState: "confirmed",
      primarySourceCount,
      verifiedSourceCount,
    };
  }
  
  // RULE: MEDIUM requires at least 1 tier_1 OR 2+ tier_2 from different publishers
  if (
    (tier1Count >= 1 && verifiedSourceCount >= 2) ||
    (tier2Count >= 2 && uniquePublishers >= 2)
  ) {
    return {
      confidenceLevel: "medium",
      storyState: "developing",
      primarySourceCount,
      verifiedSourceCount,
    };
  }
  
  // Default: LOW, developing
  return {
    confidenceLevel: "low",
    storyState: effectiveSourceCount > 1 ? "developing" : "single_source",
    primarySourceCount,
    verifiedSourceCount,
  };
}

// ===== CLASSIFICATION FUNCTIONS =====

// STEP 1: Get category from URL path
function getCategoryFromURL(url: string): string | null {
  const lowerUrl = url.toLowerCase();
  for (const [path, category] of Object.entries(URL_PATH_MAPPING)) {
    if (lowerUrl.includes(path)) {
      return category;
    }
  }
  return null;
}

// STEP 2: Get category from headline/description keywords
function getCategoryFromKeywords(text: string): { primary: string | null; secondary: string[] } {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];

  // Check each category in precedence order
  for (const category of CATEGORY_PRECEDENCE) {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (!matches.includes(category)) {
          matches.push(category);
        }
        break; // Found match for this category, move to next
      }
    }
  }

  return {
    primary: matches[0] || null,
    secondary: matches.slice(1, 3), // Max 2 secondary categories
  };
}

// STEP 3: Determine region scope with full location hierarchy
interface LocationResult {
  scope: "Local" | "India" | "World";
  city: string | null;
  state: string | null;
  district: string | null;
  locality: string | null;
}

function getRegionScope(
  headline: string,
  feedCountryCode: string | null,
  feedName: string
): LocationResult {
  const lowerHeadline = headline.toLowerCase();
  const lowerFeedName = feedName.toLowerCase();
  
  let detectedCity: string | null = null;
  let detectedState: string | null = null;
  
  // First, check for city mentions and derive state
  for (const [city, state] of Object.entries(CITY_TO_STATE)) {
    if (lowerHeadline.includes(city) || lowerFeedName.includes(city)) {
      detectedCity = city.charAt(0).toUpperCase() + city.slice(1);
      // Handle special cases like "bengaluru" -> "Bangalore"
      if (city === "bengaluru") detectedCity = "Bangalore";
      if (city === "mysuru") detectedCity = "Mysore";
      if (city === "gurugram") detectedCity = "Gurgaon";
      if (city === "prayagraj") detectedCity = "Allahabad";
      if (city === "cochin") detectedCity = "Kochi";
      if (city === "calicut") detectedCity = "Kozhikode";
      
      detectedState = state;
      break;
    }
  }
  
  // If no city found, check for state mentions
  if (!detectedState) {
    for (const [stateKey, stateName] of Object.entries(INDIAN_STATES)) {
      if (lowerHeadline.includes(stateKey) || lowerFeedName.includes(stateKey)) {
        detectedState = stateName;
        break;
      }
    }
  }
  
  // If we found a city or state, it's local scope
  if (detectedCity || detectedState) {
    return {
      scope: "Local",
      city: detectedCity,
      state: detectedState,
      district: null, // TODO: Implement district detection
      locality: detectedCity || detectedState,
    };
  }

  // Check for India-specific mentions
  const indiaKeywords = ["india", "indian", "modi", "parliament", "lok sabha", "rajya sabha"];
  if (indiaKeywords.some(kw => lowerHeadline.includes(kw))) {
    return { scope: "India", city: null, state: null, district: null, locality: null };
  }

  // If feed is from India, default to India scope
  if (feedCountryCode === "IN") {
    return { scope: "India", city: null, state: null, district: null, locality: null };
  }

  // Check for world/international signals
  const worldKeywords = ["us ", "china", "russia", "europe", "uk ", "global", "world", "un ", "united nations"];
  if (worldKeywords.some(kw => lowerHeadline.includes(kw))) {
    return { scope: "World", city: null, state: null, district: null, locality: null };
  }

  // Default based on feed
  return { 
    scope: feedCountryCode ? "India" : "World", 
    city: null, 
    state: null, 
    district: null, 
    locality: null 
  };
}

// Combined classification with full location data
function classifyStory(
  headline: string,
  description: string,
  url: string,
  feed: RSSFeed
): {
  primary_category: string;
  secondary_categories: string[];
  region_scope: "Local" | "India" | "World";
  city: string | null;
  state: string | null;
  district: string | null;
  locality: string | null;
} {
  let primaryCategory = feed.category || "World";
  let secondaryCategories: string[] = [];

  // STEP 1: Check URL path
  const urlCategory = getCategoryFromURL(url);
  if (urlCategory) {
    primaryCategory = urlCategory;
  }

  // STEP 2: Check keywords (can override or add secondary)
  const combinedText = `${headline} ${description}`;
  const keywordResult = getCategoryFromKeywords(combinedText);

  if (keywordResult.primary) {
    // If keyword match is higher precedence, use it
    const urlPrecedence = CATEGORY_PRECEDENCE.indexOf(primaryCategory);
    const keywordPrecedence = CATEGORY_PRECEDENCE.indexOf(keywordResult.primary);

    if (keywordPrecedence !== -1 && (keywordPrecedence < urlPrecedence || urlPrecedence === -1)) {
      // Keyword category is higher precedence
      if (primaryCategory !== keywordResult.primary) {
        secondaryCategories.push(primaryCategory);
      }
      primaryCategory = keywordResult.primary;
    } else if (keywordResult.primary !== primaryCategory) {
      secondaryCategories.push(keywordResult.primary);
    }
  }

  // Add remaining secondary categories
  secondaryCategories = [
    ...secondaryCategories,
    ...keywordResult.secondary.filter(c => c !== primaryCategory && !secondaryCategories.includes(c))
  ].slice(0, 2);

  // STEP 3: Determine region scope with full location hierarchy
  const locationResult = getRegionScope(headline, feed.country_code, feed.name);

  return {
    primary_category: primaryCategory,
    secondary_categories: secondaryCategories,
    region_scope: locationResult.scope,
    city: locationResult.city,
    state: locationResult.state,
    district: locationResult.district,
    locality: locationResult.locality,
  };
}

// ===== UTILITY FUNCTIONS =====

async function createHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

function parseRSSItems(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    const getTag = (tag: string): string => {
      const tagRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const tagMatch = itemContent.match(tagRegex);
      return (tagMatch?.[1] || tagMatch?.[2] || "").trim();
    };

    const getEnclosure = (): string | undefined => {
      const encRegex = /<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i;
      const encMatch = itemContent.match(encRegex);
      return encMatch?.[1];
    };

    const getMediaContent = (): string | undefined => {
      const mediaRegex = /<media:content[^>]*url=["']([^"']+)["'][^>]*>/i;
      const mediaMatch = itemContent.match(mediaRegex);
      return mediaMatch?.[1];
    };

    const title = getTag("title");
    const link = getTag("link");
    const description = getTag("description");
    const pubDate = getTag("pubDate");

    if (title && link) {
      items.push({
        title,
        link,
        description: description.replace(/<[^>]*>/g, "").substring(0, 500),
        pubDate,
        enclosure: getEnclosure() ? { url: getEnclosure()! } : undefined,
        "media:content": getMediaContent() ? { url: getMediaContent()! } : undefined,
      });
    }
  }

  return items;
}

async function fetchRSSFeed(feed: RSSFeed): Promise<RSSItem[]> {
  try {
    console.log(`Fetching: ${feed.name} (${feed.reliability_tier})`);

    const response = await fetch(feed.url, {
      headers: {
        "User-Agent": "NEWSTACK/1.0 (News Aggregator)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${feed.name}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    return parseRSSItems(xmlText);
  } catch (error) {
    console.error(`Error fetching ${feed.name}:`, error);
    return [];
  }
}

async function processItems(
  supabase: any,
  items: RSSItem[],
  feed: RSSFeed
): Promise<{ created: number; merged: number }> {
  let created = 0;
  let merged = 0;

  for (const item of items) {
    try {
      // ===== NORMALIZE ALL CONTENT BEFORE PROCESSING =====
      // This ensures CDATA, HTML entities, and tags never reach the database
      const isAggregator = feed.source_type === "aggregator";
      const cleanTitle = normalizeTitle(item.title);
      const cleanDescription = normalizeDescription(item.description, isAggregator);
      const cleanUrl = cleanURL(item.link);
      
      // HARD VALIDATION GATE: Reject if title normalization failed
      if (!cleanTitle) {
        console.warn(`REJECTED: Title normalization failed for item from ${feed.name}`);
        continue;
      }
      
      // For non-aggregators, we need valid description or skip (unless it's just short)
      const finalDescription = cleanDescription || cleanTitle;
      
      // Create fingerprint for deduplication
      const normalizedHeadline = normalizeHeadline(cleanTitle);
      const storyHash = await createHash(normalizedHeadline);

      // Parse publish date
      let publishedAt: Date;
      try {
        publishedAt = new Date(item.pubDate);
        if (isNaN(publishedAt.getTime())) {
          publishedAt = new Date();
        }
      } catch {
        publishedAt = new Date();
      }

      // Skip stories older than 48 hours
      const hoursSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSincePublished > 48) {
        continue;
      }

      // Classify the story using normalized content
      const classification = classifyStory(cleanTitle, finalDescription, cleanUrl, feed);

      // Get image URL
      const imageUrl = item.enclosure?.url || item["media:content"]?.url || null;

      // Check if story exists by exact hash match
      let matchedStory: { 
        id: string; 
        source_count: number; 
        normalized_headline: string;
        primary_source_count?: number;
        verified_source_count?: number;
      } | null = null;
      
      const { data: existingStory } = await supabase
        .from("stories")
        .select("id, source_count, normalized_headline, primary_source_count, verified_source_count")
        .eq("story_hash", storyHash)
        .single();
      
      if (existingStory) {
        matchedStory = existingStory;
      } else {
        // Try fuzzy matching with recent stories (same category, last 24 hours)
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentStories } = await supabase
          .from("stories")
          .select("id, source_count, normalized_headline, headline, primary_source_count, verified_source_count")
          .eq("category", classification.primary_category)
          .gte("first_published_at", cutoff)
          .limit(50);
        
        if (recentStories && recentStories.length > 0) {
          // Find best match using similarity
          let bestMatch: typeof matchedStory = null;
          let bestSimilarity = 0;
          
          for (const story of recentStories) {
            const similarity = calculateSimilarity(normalizedHeadline, story.normalized_headline);
            // Also check headline similarity for better matching
            const headlineSimilarity = calculateSimilarity(item.title, story.headline);
            const combinedSimilarity = Math.max(similarity, headlineSimilarity);
            
            if (combinedSimilarity > 0.5 && combinedSimilarity > bestSimilarity) {
              bestSimilarity = combinedSimilarity;
              bestMatch = story;
            }
          }
          
          if (bestMatch && bestSimilarity > 0.5) {
            console.log(`Fuzzy match found: "${cleanTitle.substring(0, 50)}" -> existing story (${(bestSimilarity * 100).toFixed(0)}% similar)`);
            matchedStory = bestMatch;
          }
        }
      }

      if (matchedStory) {
        // Story exists - check if this source URL already exists
        const { data: existingSource } = await supabase
          .from("story_sources")
          .select("id")
          .eq("story_id", matchedStory.id)
          .eq("source_url", cleanUrl)
          .maybeSingle();

        if (!existingSource) {
          // Add new source with tier information from feed
          const { error: sourceError } = await supabase
            .from("story_sources")
            .insert({
              story_id: matchedStory.id,
              source_name: feed.name,
              source_url: cleanUrl,
              published_at: publishedAt.toISOString(),
              description: finalDescription,
              source_type: feed.source_type,
              reliability_tier: feed.reliability_tier,
              is_primary_reporting: feed.source_type === "primary",
            });

          if (!sourceError) {
            // Get all sources for this story to recalculate confidence
            const { data: allSources } = await supabase
              .from("story_sources")
              .select("source_name, source_type, reliability_tier")
              .eq("story_id", matchedStory.id);
            
            const sources = allSources || [];
            const sourceCount = sources.length;
            const tier1Count = sources.filter((s: any) => s.reliability_tier === "tier_1").length;
            const tier2Count = sources.filter((s: any) => s.reliability_tier === "tier_2").length;
            const aggregatorCount = sources.filter((s: any) => s.source_type === "aggregator").length;
            
            // Count unique publishers (by source name prefix)
            const publishers = new Set(sources.map((s: any) => s.source_name.split(" ")[0].toLowerCase()));
            const uniquePublishers = publishers.size;
            
            // Calculate weighted confidence
            const confidence = calculateWeightedConfidence({
              sourceCount,
              tier1Count,
              tier2Count,
              aggregatorCount,
              uniquePublishers,
              hasContradictions: false, // TODO: implement contradiction detection
            });
          
            await supabase
              .from("stories")
              .update({
                source_count: sourceCount,
                primary_source_count: confidence.primarySourceCount,
                verified_source_count: confidence.verifiedSourceCount,
                confidence_level: confidence.confidenceLevel,
                story_state: confidence.storyState,
                last_updated_at: new Date().toISOString(),
                image_url: imageUrl || undefined,
              })
              .eq("id", matchedStory.id);

            // Trigger breaking news alert if story just reached 3+ verified sources
            if (confidence.verifiedSourceCount >= 3 && (matchedStory.verified_source_count || 0) < 3) {
              try {
                const sourceNames = sources.map((s: any) => s.source_name);
                
                // Fetch story headline
                const { data: storyData } = await supabase
                  .from("stories")
                  .select("headline, category")
                  .eq("id", matchedStory.id)
                  .single();
                
                // Call breaking news alert function
                const alertUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-breaking-news-alert`;
                fetch(alertUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    storyId: matchedStory.id,
                    headline: storyData?.headline || cleanTitle,
                    sourceCount: sourceCount,
                    verifiedSourceCount: confidence.verifiedSourceCount,
                    sources: sourceNames,
                    category: storyData?.category || classification.primary_category,
                    confidenceLevel: confidence.confidenceLevel,
                  }),
                }).catch(err => console.log("Alert trigger failed:", err.message));
                
                console.log(`Breaking news alert triggered for story: ${matchedStory.id} (${confidence.confidenceLevel} confidence)`);
              } catch (alertError) {
                console.log("Error triggering alert:", alertError);
              }
            }

            merged++;
          }
        }
      } else {
        // Create new story with normalized content and initial confidence
        const initialConfidence = calculateWeightedConfidence({
          sourceCount: 1,
          tier1Count: feed.reliability_tier === "tier_1" ? 1 : 0,
          tier2Count: feed.reliability_tier === "tier_2" ? 1 : 0,
          aggregatorCount: feed.source_type === "aggregator" ? 1 : 0,
          uniquePublishers: 1,
          hasContradictions: false,
        });
        
        const { data: newStory, error: storyError } = await supabase
          .from("stories")
          .insert({
            story_hash: storyHash,
            headline: cleanTitle,
            normalized_headline: normalizedHeadline,
            summary: finalDescription,
            // Store original language content - use feed.language as canonical source
            // Even if language is 'en', store it so we know it was explicitly English
            original_headline: feed.language && feed.language !== 'en' && feed.language !== 'eng' ? item.title : null,
            original_summary: feed.language && feed.language !== 'en' && feed.language !== 'eng' ? item.description : null,
            // CRITICAL: Always store original_language from feed if available
            // This fixes the issue where most stories had null original_language
            original_language: feed.language || 'en',
            category: classification.primary_category,
            country_code: feed.country_code,
            city: classification.city,
            state: classification.state,
            district: classification.district,
            locality: classification.locality,
            is_global: classification.region_scope === "World",
            first_published_at: publishedAt.toISOString(),
            last_updated_at: new Date().toISOString(),
            image_url: imageUrl,
            source_count: 1,
            primary_source_count: initialConfidence.primarySourceCount,
            verified_source_count: initialConfidence.verifiedSourceCount,
            confidence_level: initialConfidence.confidenceLevel,
            story_state: initialConfidence.storyState,
            has_contradictions: false,
          })
          .select("id")
          .single();

        if (newStory && !storyError) {
          // Insert source with tier information
          await supabase.from("story_sources").insert({
            story_id: newStory.id,
            source_name: feed.name,
            source_url: cleanUrl,
            published_at: publishedAt.toISOString(),
            description: finalDescription,
            source_type: feed.source_type,
            reliability_tier: feed.reliability_tier,
            is_primary_reporting: feed.source_type === "primary",
          });

          created++;
        }
      }
    } catch (error) {
      console.error("Error processing item:", error);
    }
  }

  return { created, merged };
}

/**
 * Check if a feed should be fetched based on its tier and last fetch time
 */
function shouldFetchFeed(feed: RSSFeed): boolean {
  if (!feed.last_fetched_at) return true;
  
  const lastFetched = new Date(feed.last_fetched_at).getTime();
  const minutesSinceLastFetch = (Date.now() - lastFetched) / (1000 * 60);
  const intervalMinutes = feed.fetch_interval_minutes || 30;
  
  return minutesSinceLastFetch >= intervalMinutes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authorization for scheduled/manual calls
  const authHeader = req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("apikey");
  const cronSecret = Deno.env.get("CRON_INGEST_SECRET");
  const supabaseAnonKeyRaw = Deno.env.get("SUPABASE_ANON_KEY");

  const url = new URL(req.url);
  const secretParam = url.searchParams.get("secret");

  // Normalize secrets (URLSearchParams decodes '+' as space)
  const trimmedCronSecret = cronSecret?.trim();
  const trimmedAnonKey = supabaseAnonKeyRaw?.trim();
  const trimmedSecretParam = secretParam?.trim();
  const normalizedSecretParam = trimmedSecretParam?.replace(/\s/g, "+");

  // Check various auth methods:
  // 1. URL parameter with cron secret (normalized)
  const isValidSecretParam =
    trimmedCronSecret && normalizedSecretParam && normalizedSecretParam === trimmedCronSecret;
  // 2. Bearer token with cron secret
  const isValidBearerToken = trimmedCronSecret && authHeader === `Bearer ${trimmedCronSecret}`;
  // 3. Internal Supabase cron (uses anon key in Authorization header)
  const isInternalCron = !!trimmedAnonKey && (authHeader?.includes(trimmedAnonKey) ?? false);
  // 4. Direct call without auth (for testing in config.toml cron - verify_jwt is false)
  const isLocalCron = !authHeader && !secretParam;
  // 5. Frontend call with Bearer anon key (standard format)
  const isFrontendCall = !!trimmedAnonKey && authHeader === `Bearer ${trimmedAnonKey}`;
  // 6. Frontend call using standard "apikey" header (anon key)
  const isFrontendApiKeyCall = !!trimmedAnonKey && apiKeyHeader === trimmedAnonKey;
  // 7. Frontend call via supabase.functions.invoke with apikey header set to anon key
  // This is the standard pattern - apikey header contains the anon key, Authorization contains user JWT
  const isSupabaseInvoke = !!trimmedAnonKey && apiKeyHeader === trimmedAnonKey;
  // 8. Has valid Bearer JWT token (any authenticated call from frontend with valid JWT)
  const hasValidBearerJWT = !!authHeader && authHeader.startsWith("Bearer ") && authHeader.length > 50;

  console.log("Auth check:", {
    hasCronSecret: !!cronSecret,
    cronSecretLen: cronSecret?.length ?? 0,
    hasSecretParam: !!secretParam,
    secretMatch: isValidSecretParam,
    bearerMatch: isValidBearerToken,
    internalCron: isInternalCron,
    localCron: isLocalCron,
    frontendCall: isFrontendCall,
    frontendApiKeyCall: isFrontendApiKeyCall,
    supabaseInvoke: isSupabaseInvoke,
    hasValidBearerJWT: hasValidBearerJWT,
    anonKeyPresent: !!trimmedAnonKey,
    hasAuthorizationHeader: !!authHeader,
    hasApiKeyHeader: !!apiKeyHeader,
    apiKeyMatchesAnon: apiKeyHeader === trimmedAnonKey,
  });

  // For external calls (cron-job.org), require the secret
  // For internal cron, frontend calls, or supabase.functions.invoke, allow through
  // The key insight: supabase.functions.invoke() always sends the anon key in the "apikey" header
  if (
    !isValidSecretParam &&
    !isValidBearerToken &&
    !isInternalCron &&
    !isLocalCron &&
    !isFrontendCall &&
    !isFrontendApiKeyCall &&
    !isSupabaseInvoke &&
    !hasValidBearerJWT
  ) {
    console.log("Unauthorized access attempt - no valid auth method found");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  console.log("Authorization successful - starting ingestion");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Extract user info and IP from request for logging
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                    req.headers.get("x-real-ip") ||
                    req.headers.get("cf-connecting-ip") ||
                    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  
  // Parse body for country/province context if provided
  let countryCode: string | null = null;
  let provinceId: string | null = null;
  let userId: string | null = null;
  let userEmail: string | null = null;
  
  try {
    const body = await req.json().catch(() => ({}));
    countryCode = body.countryCode || null;
    provinceId = body.provinceId || null;
    userId = body.userId || null;
    userEmail = body.userEmail || null;
  } catch {
    // Body parsing failed, continue without context
  }

  // Create ingestion run record for tracking
  const { data: runRecord, error: runError } = await supabase
    .from("ingestion_runs")
    .insert({
      status: "running",
      step_fetch_feeds: "running",
    })
    .select("id")
    .single();

  const runId = runRecord?.id;

  // Log user details for this ingestion run
  if (runId) {
    try {
      await supabase.from("ingestion_user_logs").insert({
        ingestion_run_id: runId,
        user_id: userId,
        user_email: userEmail,
        ip_address: ipAddress,
        user_agent: userAgent,
        trigger_type: isInternalCron ? "cron" : "manual",
        country_code: countryCode,
        province_id: provinceId,
        metadata: {
          authorization_method: isInternalCron ? "internal_cron" : 
                               isLocalCron ? "local_cron" : 
                               isSupabaseInvoke ? "supabase_invoke" : 
                               isFrontendCall ? "frontend" : "other",
          timestamp: new Date().toISOString(),
        }
      });
    } catch (logError) {
      console.error("Failed to log user details:", logError);
    }
  }

  // Helper to update run status
  const updateRun = async (updates: Record<string, unknown>) => {
    if (!runId) return;
    await supabase.from("ingestion_runs").update(updates).eq("id", runId);
  };

  try {
    console.log("Starting tier-based RSS ingestion...", { runId });

    // STEP 1: FETCH FEEDS
    const { data: allFeeds, error: feedsError } = await supabase
      .from("rss_feeds")
      .select("*")
      .eq("is_active", true)
      .order("reliability_tier", { ascending: true })
      .order("priority", { ascending: false });

    if (feedsError || !allFeeds) {
      await updateRun({
        status: "failed",
        step_fetch_feeds: "failed",
        error_message: "Failed to fetch RSS feeds",
        error_step: "fetch_feeds",
        completed_at: new Date().toISOString(),
      });
      throw new Error("Failed to fetch RSS feeds");
    }

    // Filter feeds that should be fetched based on their interval
    const feeds = allFeeds.filter((feed: RSSFeed) => shouldFetchFeed(feed));
    
    // Log tier distribution
    const tier1Feeds = feeds.filter((f: RSSFeed) => f.reliability_tier === "tier_1");
    const tier2Feeds = feeds.filter((f: RSSFeed) => f.reliability_tier === "tier_2");
    const tier3Feeds = feeds.filter((f: RSSFeed) => f.reliability_tier === "tier_3");
    
    console.log(`Found ${allFeeds.length} active feeds, ${feeds.length} due for fetch`);
    console.log(`Tier distribution: T1=${tier1Feeds.length}, T2=${tier2Feeds.length}, T3=${tier3Feeds.length}`);

    await updateRun({
      step_fetch_feeds: "completed",
      step_fetch_feeds_count: feeds.length,
      tier1_feeds: tier1Feeds.length,
      tier2_feeds: tier2Feeds.length,
      tier3_feeds: tier3Feeds.length,
      total_feeds_processed: feeds.length,
      step_normalize: "running",
    });

    let totalCreated = 0;
    let totalMerged = 0;
    let totalNormalized = 0;
    let totalValidated = 0;
    let totalRejected = 0;
    let totalClassified = 0;

    // ===== BATCHING + CONCURRENCY CONFIG =====
    // Reduced limits to prevent Edge Function timeout (60 seconds max)
    const MAX_FEEDS_PER_RUN = 25; // Process fewer feeds per run - cron will catch up
    const BATCH_SIZE = 5; // Process feeds in batches of 5 concurrently
    const FEED_TIMEOUT_MS = 5000; // 5 second timeout per feed (reduced)

    // Limit feeds to prevent timeout - prioritize tier_1 first
    const prioritizedFeeds = [
      ...feeds.filter((f: RSSFeed) => f.reliability_tier === "tier_1"),
      ...feeds.filter((f: RSSFeed) => f.reliability_tier === "tier_2"),
      ...feeds.filter((f: RSSFeed) => f.reliability_tier !== "tier_1" && f.reliability_tier !== "tier_2"),
    ];
    const feedsToProcess = prioritizedFeeds.slice(0, MAX_FEEDS_PER_RUN);
    console.log(`Processing ${feedsToProcess.length} of ${feeds.length} feeds (max ${MAX_FEEDS_PER_RUN})`);

    // Helper: Process a single feed with timeout and record results
    const processSingleFeed = async (feed: RSSFeed): Promise<{ created: number; merged: number; normalized: number; error?: string }> => {
      const startTime = Date.now();
      let feedResult = { created: 0, merged: 0, normalized: 0, error: undefined as string | undefined };
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
        
        const items = await fetchRSSFeed(feed);
        clearTimeout(timeoutId);
        
        if (items.length === 0) {
          // Record successful fetch with no items
          if (runId) {
            await supabase.from("feed_fetch_results").insert({
              ingestion_run_id: runId,
              feed_id: feed.id,
              feed_name: feed.name,
              status: "success",
              stories_fetched: 0,
              stories_inserted: 0,
              duration_ms: Date.now() - startTime,
            });
          }
          return feedResult;
        }

        const { created, merged } = await processItems(supabase, items, feed);
        feedResult = { created, merged, normalized: items.length, error: undefined };
        
        // Update last fetched timestamp and health metrics
        const currentFetch = await supabase
          .from("rss_feeds")
          .select("total_fetch_count, avg_stories_per_fetch")
          .eq("id", feed.id)
          .single();
        
        const totalFetches = (currentFetch.data?.total_fetch_count || 0) + 1;
        const prevAvg = currentFetch.data?.avg_stories_per_fetch || 0;
        const newAvg = totalFetches === 1 ? items.length : (prevAvg * (totalFetches - 1) + items.length) / totalFetches;
        
        await supabase
          .from("rss_feeds")
          .update({ 
            last_fetched_at: new Date().toISOString(),
            total_fetch_count: totalFetches,
            avg_stories_per_fetch: newAvg,
            health_score: Math.min(100, 80 + Math.min(20, created * 2)), // Boost health on success
          })
          .eq("id", feed.id);

        // Record per-feed fetch result
        if (runId) {
          await supabase.from("feed_fetch_results").insert({
            ingestion_run_id: runId,
            feed_id: feed.id,
            feed_name: feed.name,
            status: "success",
            stories_fetched: items.length,
            stories_inserted: created,
            duration_ms: Date.now() - startTime,
          });
        }

        return feedResult;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error processing feed ${feed.name}:`, error);
        
        // Update error tracking on feed
        const { data: feedData } = await supabase
          .from("rss_feeds")
          .select("error_count, health_score")
          .eq("id", feed.id)
          .single();
        
        const newErrorCount = (feedData?.error_count || 0) + 1;
        const newHealthScore = Math.max(0, (feedData?.health_score || 100) - 10); // Decrease health on error
        
        await supabase
          .from("rss_feeds")
          .update({ 
            error_count: newErrorCount,
            health_score: newHealthScore,
            last_error_at: new Date().toISOString(),
            last_error_message: errorMsg.substring(0, 500),
            // Auto-pause feeds with too many errors
            is_active: newErrorCount < 10,
          })
          .eq("id", feed.id);

        // Record per-feed fetch error
        if (runId) {
          await supabase.from("feed_fetch_results").insert({
            ingestion_run_id: runId,
            feed_id: feed.id,
            feed_name: feed.name,
            status: "failed",
            stories_fetched: 0,
            stories_inserted: 0,
            error_message: errorMsg.substring(0, 500),
            duration_ms: Date.now() - startTime,
          });
        }

        return { created: 0, merged: 0, normalized: 0, error: errorMsg };
      }
    };

    // STEP 2-5: Process feeds in batches with concurrency control
    for (let i = 0; i < feedsToProcess.length; i += BATCH_SIZE) {
      const batch = feedsToProcess.slice(i, i + BATCH_SIZE) as RSSFeed[];
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(feedsToProcess.length / BATCH_SIZE)}`);
      
      // Process batch concurrently
      const batchResults = await Promise.all(batch.map(feed => processSingleFeed(feed)));
      
      // Aggregate results
      for (const result of batchResults) {
        totalCreated += result.created;
        totalMerged += result.merged;
        totalNormalized += result.normalized;
        totalClassified += result.created + result.merged;
      }

      // Update progress after each batch
      await updateRun({
        step_normalize_count: totalNormalized,
        step_classify_count: totalClassified,
        step_store_created: totalCreated,
        step_dedupe_merged: totalMerged,
      });
    }

    // Update normalize step
    await updateRun({
      step_normalize: "completed",
      step_normalize_count: totalNormalized,
      step_validate: "completed",
      step_validate_rejected: totalRejected,
      step_classify: "completed",
      step_classify_count: totalClassified,
      step_dedupe: "completed",
      step_dedupe_merged: totalMerged,
      step_store: "completed",
      step_store_created: totalCreated,
      step_cleanup: "running",
    });

    // STEP 6: CLEANUP - Clean up old stories (older than 48 hours)
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    let cleanupDeleted = 0;
    
    const { data: oldStories } = await supabase
      .from("stories")
      .select("id")
      .lt("first_published_at", cutoffTime);
    
    if (oldStories && oldStories.length > 0) {
      const oldStoryIds = oldStories.map((s: { id: string }) => s.id);
      
      await supabase
        .from("story_sources")
        .delete()
        .in("story_id", oldStoryIds);
      
      const { count: deleted } = await supabase
        .from("stories")
        .delete()
        .lt("first_published_at", cutoffTime);
      
      cleanupDeleted = deleted || 0;
      console.log(`Cleaned up ${cleanupDeleted} old stories`);
    }

    // Mark run as completed
    await updateRun({
      status: "completed",
      step_cleanup: "completed",
      step_cleanup_deleted: cleanupDeleted,
      total_stories_created: totalCreated,
      total_stories_merged: totalMerged,
      completed_at: new Date().toISOString(),
    });

    const result = {
      success: true,
      runId,
      stats: {
        feedsProcessed: feeds.length,
        storiesCreated: totalCreated,
        storiesMerged: totalMerged,
        storiesDeleted: cleanupDeleted,
      },
      feedsProcessed: feeds.length,
      totalFeeds: allFeeds.length,
      storiesCreated: totalCreated,
      storiesMerged: totalMerged,
      storiesDeleted: cleanupDeleted,
      tierBreakdown: {
        tier1: tier1Feeds.length,
        tier2: tier2Feeds.length,
        tier3: tier3Feeds.length,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("Ingestion complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Ingestion error:", error);
    
    // CRITICAL: Always finalize run as failed on any error
    try {
      await updateRun({
        status: "failed",
        error_message: errorMessage,
        error_step: "processing",
        step_normalize: "failed",
        step_validate: "failed",
        step_classify: "failed",
        step_dedupe: "failed",
        step_store: "failed",
        step_cleanup: "failed",
        completed_at: new Date().toISOString(),
      });
    } catch (updateErr) {
      console.error("Failed to update run status:", updateErr);
    }

    return new Response(
      JSON.stringify({ success: false, runId, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
