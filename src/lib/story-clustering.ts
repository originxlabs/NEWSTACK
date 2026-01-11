// Real-time Story Clustering with Fuzzy Matching
// Groups similar stories from different sources into unified clusters

export interface StorySource {
  source_name: string;
  source_url: string;
  published_at: string;
  description?: string;
}

export interface RawStory {
  id: string;
  headline: string;
  summary: string;
  content?: string;
  topic: string;
  source: string;
  sourceUrl?: string;
  timestamp: string;
  publishedAt?: string;
  imageUrl?: string;
  whyMatters?: string;
  sourceCount?: number;
  trustScore?: number;
  sources?: StorySource[];
  // Story intelligence fields
  storyState?: "single-source" | "breaking" | "developing" | "confirmed" | "contradicted" | "resolved";
  confidenceLevel?: "low" | "medium" | "high";
  isSingleSource?: boolean;
  verifiedSourceCount?: number;
}

export interface StoryCluster {
  id: string;
  representativeStory: RawStory;
  headline: string;
  summary: string;
  topic: string;
  sources: StorySource[];
  sourceCount: number;
  firstPublished: string;
  lastUpdated: string;
  confidence: "low" | "medium" | "high";
  signal: "breaking" | "developing" | "stabilized" | "contradicted" | "resolved";
  stories: RawStory[];
  isContradicted: boolean;
  verifiedSourceCount: number;
}

// Extended stopwords for normalization
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "and", "but", "or", "nor", "so", "yet", "both", "either", "neither",
  "not", "only", "own", "same", "than", "too", "very", "just",
  "says", "said", "report", "reports", "reported", "according", "sources",
  "breaking", "update", "live", "watch", "video", "photos", "exclusive",
  "latest", "new", "news", "today", "now", "just", "this", "that",
  "here", "there", "what", "how", "why", "when", "where", "who",
  "amid", "over", "about", "after", "before", "during", "while",
]);

// Key entities that should be preserved and matched
const KEY_ENTITIES = [
  // Political figures
  "trump", "biden", "modi", "putin", "xi", "jinping", "zelenskyy", "zelensky",
  "netanyahu", "macron", "scholz", "sunak", "starmer", "harris", "obama",
  // Organizations
  "isis", "hamas", "hezbollah", "taliban", "nato", "who", "imf",
  "world bank", "fed", "rbi", "sebi", "sec", "fbi", "cia", "nasa", "isro",
  // Companies
  "apple", "google", "microsoft", "amazon", "meta", "tesla", "nvidia",
  "openai", "anthropic", "tata", "reliance", "adani", "infosys", "wipro",
  // Countries/Regions
  "ukraine", "russia", "israel", "gaza", "palestine", "syria", "iran",
  "china", "india", "pakistan", "afghanistan", "myanmar",
];

// Verified sources for trust scoring
const VERIFIED_SOURCES = [
  "reuters", "ap news", "associated press", "afp", "pti",
  "bbc", "cnn", "al jazeera", "npr", "nbc news", "cbs news", "abc news",
  "new york times", "washington post", "the guardian", "the hindu",
  "times of india", "hindustan times", "financial times", "wall street journal",
  "bloomberg", "cnbc", "forbes", "economic times", "marketwatch",
  "techcrunch", "the verge", "ars technica", "wired",
];

function isVerifiedSource(sourceName: string): boolean {
  const lower = sourceName.toLowerCase();
  return VERIFIED_SOURCES.some(vs => lower.includes(vs));
}

function extractKeyEntities(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const entity of KEY_ENTITIES) {
    if (lower.includes(entity)) {
      found.push(entity.replace(/\s+/g, ""));
    }
  }
  return found;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
}

// Calculate Jaccard similarity between two texts
function calculateJaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  
  const intersection = [...tokens1].filter(t => tokens2.has(t)).length;
  const union = new Set([...tokens1, ...tokens2]).size;
  
  return union > 0 ? intersection / union : 0;
}

// Calculate entity overlap between two texts
function calculateEntityOverlap(text1: string, text2: string): number {
  const entities1 = new Set(extractKeyEntities(text1));
  const entities2 = new Set(extractKeyEntities(text2));
  
  if (entities1.size === 0 && entities2.size === 0) return 0.5; // Neutral if no entities
  if (entities1.size === 0 || entities2.size === 0) return 0.3;
  
  const intersection = [...entities1].filter(e => entities2.has(e)).length;
  const union = new Set([...entities1, ...entities2]).size;
  
  return union > 0 ? intersection / union : 0;
}

// Combined similarity score
function calculateSimilarity(story1: RawStory, story2: RawStory): number {
  const text1 = `${story1.headline} ${story1.summary || ""}`;
  const text2 = `${story2.headline} ${story2.summary || ""}`;
  
  // Jaccard similarity of tokens (60% weight)
  const jaccardScore = calculateJaccardSimilarity(text1, text2);
  
  // Entity overlap (30% weight)
  const entityScore = calculateEntityOverlap(text1, text2);
  
  // Topic match (10% weight)
  const topicScore = story1.topic?.toLowerCase() === story2.topic?.toLowerCase() ? 1 : 0.5;
  
  return (jaccardScore * 0.6) + (entityScore * 0.3) + (topicScore * 0.1);
}

// Determine story signal based on age and source count
function determineSignal(
  publishedAt: string | undefined,
  sourceCount: number
): StoryCluster["signal"] {
  if (!publishedAt) return "developing";
  
  const ageMinutes = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60);
  
  if (ageMinutes < 30) return "breaking";
  if (ageMinutes < 360 && sourceCount >= 2) return "developing";
  if (sourceCount >= 3) return "stabilized";
  
  return "developing";
}

// Determine confidence based on source diversity
function determineConfidence(
  sourceCount: number,
  verifiedCount: number
): StoryCluster["confidence"] {
  if (verifiedCount >= 3) return "high";
  if (sourceCount >= 3 || verifiedCount >= 2) return "medium";
  return "low";
}

// Cluster stories using agglomerative clustering
export function clusterStories(
  stories: RawStory[],
  similarityThreshold = 0.45
): StoryCluster[] {
  if (stories.length === 0) return [];
  
  const clusters: StoryCluster[] = [];
  const assigned = new Set<string>();
  
  // Sort by freshness first
  const sortedStories = [...stories].sort((a, b) => {
    const dateA = new Date(a.publishedAt || 0).getTime();
    const dateB = new Date(b.publishedAt || 0).getTime();
    return dateB - dateA;
  });
  
  for (const story of sortedStories) {
    if (assigned.has(story.id)) continue;
    
    // Find similar stories
    const clusterMembers: RawStory[] = [story];
    assigned.add(story.id);
    
    for (const candidate of sortedStories) {
      if (assigned.has(candidate.id)) continue;
      
      // Check similarity with all members of current cluster
      const similarities = clusterMembers.map(m => calculateSimilarity(m, candidate));
      const maxSimilarity = Math.max(...similarities);
      
      if (maxSimilarity >= similarityThreshold) {
        clusterMembers.push(candidate);
        assigned.add(candidate.id);
      }
    }
    
    // Build cluster
    const allSources: StorySource[] = [];
    const seenSourceUrls = new Set<string>();
    
    for (const member of clusterMembers) {
      // Add primary source
      if (member.sourceUrl && !seenSourceUrls.has(member.sourceUrl)) {
        allSources.push({
          source_name: member.source,
          source_url: member.sourceUrl,
          published_at: member.publishedAt || new Date().toISOString(),
          description: member.summary?.substring(0, 100),
        });
        seenSourceUrls.add(member.sourceUrl);
      }
      
      // Add linked sources
      if (member.sources) {
        for (const s of member.sources) {
          if (!seenSourceUrls.has(s.source_url)) {
            allSources.push(s);
            seenSourceUrls.add(s.source_url);
          }
        }
      }
    }
    
    // Sort sources by publication time
    allSources.sort((a, b) => 
      new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
    );
    
    // Calculate verified source count
    const verifiedCount = allSources.filter(s => isVerifiedSource(s.source_name)).length;
    
    // Get first and last published times
    const times = clusterMembers
      .map(m => new Date(m.publishedAt || 0).getTime())
      .filter(t => t > 0);
    
    const firstPublished = times.length > 0 
      ? new Date(Math.min(...times)).toISOString()
      : new Date().toISOString();
    
    const lastUpdated = times.length > 0
      ? new Date(Math.max(...times)).toISOString()
      : new Date().toISOString();
    
    // Check for contradictions (simple heuristic)
    const isContradicted = false; // Would need sentiment analysis to detect
    
    const cluster: StoryCluster = {
      id: story.id,
      representativeStory: story,
      headline: story.headline,
      summary: story.summary,
      topic: story.topic,
      sources: allSources,
      sourceCount: allSources.length,
      firstPublished,
      lastUpdated,
      confidence: determineConfidence(allSources.length, verifiedCount),
      signal: determineSignal(firstPublished, allSources.length),
      stories: clusterMembers,
      isContradicted,
      verifiedSourceCount: verifiedCount,
    };
    
    clusters.push(cluster);
  }
  
  // Sort clusters by source count (multi-source first), then by freshness
  clusters.sort((a, b) => {
    // First: verified multi-source stories
    if (a.verifiedSourceCount >= 3 && b.verifiedSourceCount < 3) return -1;
    if (b.verifiedSourceCount >= 3 && a.verifiedSourceCount < 3) return 1;
    
    // Second: multi-source stories
    if (a.sourceCount >= 2 && b.sourceCount < 2) return -1;
    if (b.sourceCount >= 2 && a.sourceCount < 2) return 1;
    
    // Third: by source count
    if (a.sourceCount !== b.sourceCount) return b.sourceCount - a.sourceCount;
    
    // Finally: by freshness
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
  });
  
  return clusters;
}

// Group stories by time blocks for pagination
export interface TimeBlock {
  label: string;
  id: string;
  stories: RawStory[];
  clusters: StoryCluster[];
}

export function groupByTimeBlocks(
  stories: RawStory[],
  clusters: StoryCluster[]
): TimeBlock[] {
  const now = Date.now();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  
  const blocks: TimeBlock[] = [
    { label: "Last 2 hours", id: "last-2-hours", stories: [], clusters: [] },
    { label: "Earlier today", id: "earlier-today", stories: [], clusters: [] },
    { label: "Yesterday", id: "yesterday", stories: [], clusters: [] },
    { label: "This week", id: "this-week", stories: [], clusters: [] },
  ];
  
  // Group stories
  for (const story of stories) {
    const time = new Date(story.publishedAt || 0).getTime();
    
    if (time >= twoHoursAgo) {
      blocks[0].stories.push(story);
    } else if (time >= todayStart) {
      blocks[1].stories.push(story);
    } else if (time >= yesterdayStart) {
      blocks[2].stories.push(story);
    } else {
      blocks[3].stories.push(story);
    }
  }
  
  // Group clusters
  for (const cluster of clusters) {
    const time = new Date(cluster.lastUpdated).getTime();
    
    if (time >= twoHoursAgo) {
      blocks[0].clusters.push(cluster);
    } else if (time >= todayStart) {
      blocks[1].clusters.push(cluster);
    } else if (time >= yesterdayStart) {
      blocks[2].clusters.push(cluster);
    } else {
      blocks[3].clusters.push(cluster);
    }
  }
  
  // Filter out empty blocks
  return blocks.filter(b => b.stories.length > 0 || b.clusters.length > 0);
}
