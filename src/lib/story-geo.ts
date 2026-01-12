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

// Comprehensive district aliases for fuzzy matching (all major states)
const DISTRICT_ALIASES: Record<string, string[]> = {
  // Karnataka
  "Bengaluru Urban": ["Bangalore Urban", "Bangalore", "Bengaluru", "BLR", "Silicon Valley of India"],
  "Bengaluru Rural": ["Bangalore Rural"],
  "Mysuru": ["Mysore", "Mysore City"],
  "Mangaluru": ["Mangalore", "Mangalur"],
  "Belagavi": ["Belgaum", "Belgavi"],
  "Kalaburagi": ["Gulbarga", "Gulburga"],
  "Vijayapura": ["Bijapur"],
  "Shivamogga": ["Shimoga", "Shimogga"],
  "Tumakuru": ["Tumkur"],
  "Hubballi-Dharwad": ["Hubli", "Dharwad", "Hubli-Dharwad", "Hubballi"],
  "Ballari": ["Bellary"],
  "Ramanagara": ["Ramanagar"],
  "Chikkamagaluru": ["Chikmagalur", "Chickmagalur"],
  "Dakshina Kannada": ["South Kannada", "DK"],
  "Uttara Kannada": ["North Kannada", "UK", "Karwar"],
  
  // Maharashtra
  "Mumbai": ["Bombay", "Greater Mumbai", "BMC"],
  "Mumbai Suburban": ["Mumbai Suburbs", "Western Suburbs"],
  "Chhatrapati Sambhajinagar": ["Aurangabad"],
  "Dharashiv": ["Osmanabad"],
  "Thane": ["Thana"],
  "Raigad": ["Alibaug", "Alibag"],
  
  // Tamil Nadu
  "Chennai": ["Madras", "Chennai City", "MTC"],
  "Tiruchirappalli": ["Trichy", "Trichinopoly", "Tiruchi"],
  "Kanchipuram": ["Kancheepuram", "Kanchi"],
  "Coimbatore": ["Kovai", "Coimbatur"],
  "Madurai": ["Madura", "Temple City"],
  "Thanjavur": ["Tanjore", "Tanjavur"],
  "Tirunelveli": ["Nellai"],
  "Kanyakumari": ["Cape Comorin"],
  "Thoothukudi": ["Tuticorin"],
  "Tiruppur": ["Tirupur"],
  "Vellore": ["Vellur"],
  "Villupuram": ["Viluppuram"],
  "Cuddalore": ["Cuddalore District"],
  "Erode": ["Erodu"],
  "Salem": ["Selam"],
  
  // Telangana
  "Hyderabad": ["Secunderabad", "GHMC", "Greater Hyderabad", "Cyberabad"],
  "Rangareddy": ["Ranga Reddy", "RR District"],
  "Medchal-Malkajgiri": ["Medchal", "Malkajgiri"],
  "Sangareddy": ["Sangareddi"],
  "Nizamabad": ["Nizamabad District"],
  "Karimnagar": ["Karimnagar District"],
  "Warangal": ["Warangal Urban", "Warangal Rural", "Kakatiya"],
  
  // Andhra Pradesh
  "Visakhapatnam": ["Vizag", "Vishakhapatnam", "Waltair"],
  "Vijayawada": ["Bezawada", "Vijayavada"],
  "Guntur": ["Guntur District"],
  "Tirupati": ["Tirupathi"],
  "Krishna": ["Krishna District", "Machilipatnam"],
  "East Godavari": ["Kakinada", "EG District"],
  "West Godavari": ["Eluru", "WG District"],
  "Nellore": ["Sri Potti Sriramulu Nellore", "SPSR Nellore"],
  "Chittoor": ["Chittor"],
  "Kurnool": ["Kurnul"],
  "Anantapur": ["Anantapuram"],
  "Kadapa": ["Cuddapah", "YSR Kadapa"],
  
  // West Bengal
  "Kolkata": ["Calcutta", "KMC"],
  "North 24 Parganas": ["North 24 Paraganas", "N 24 Parganas", "North Twenty Four Parganas"],
  "South 24 Parganas": ["South 24 Paraganas", "S 24 Parganas", "South Twenty Four Parganas"],
  "Howrah": ["Haora"],
  "Hooghly": ["Hugli"],
  "Barddhaman": ["Burdwan", "Purba Bardhaman", "Paschim Bardhaman"],
  "Darjeeling": ["Darjiling"],
  "Jalpaiguri": ["Jalpiguri"],
  "Siliguri": ["Siliguri Subdivision"],
  
  // Uttar Pradesh
  "Varanasi": ["Banaras", "Benares", "Kashi"],
  "Prayagraj": ["Allahabad", "Prayag"],
  "Ayodhya": ["Faizabad"],
  "Lucknow": ["Lakhnau"],
  "Kanpur": ["Cawnpore", "Kanpur Nagar"],
  "Agra": ["Agra District"],
  "Noida": ["Gautam Buddha Nagar", "GB Nagar"],
  "Ghaziabad": ["Gaziabad"],
  "Meerut": ["Mirat"],
  "Mathura": ["Matura", "Vrindavan"],
  "Gorakhpur": ["Gorakpur"],
  "Bareilly": ["Bareli"],
  "Aligarh": ["Alighar"],
  "Moradabad": ["Moradabad Brass City"],
  "Saharanpur": ["Saharnpur"],
  
  // Gujarat
  "Ahmedabad": ["Amdavad", "Karnavati"],
  "Vadodara": ["Baroda"],
  "Surat": ["Surate"],
  "Rajkot": ["Rajcot"],
  "Bhavnagar": ["Bhawnagar"],
  "Jamnagar": ["Jamnagar District"],
  "Junagadh": ["Junagarh"],
  "Gandhinagar": ["Gandhinagar District"],
  "Kutch": ["Kachchh", "Bhuj"],
  "Anand": ["Anand District"],
  "Kheda": ["Kheda District", "Nadiad"],
  "Panchmahal": ["Godhra"],
  "Mehsana": ["Mahesana"],
  "Banaskantha": ["Banaskantha District", "Palanpur"],
  "Sabarkantha": ["Himmatnagar"],
  
  // Kerala
  "Thiruvananthapuram": ["Trivandrum", "TVM"],
  "Kochi": ["Cochin", "Ernakulam"],
  "Kozhikode": ["Calicut"],
  "Alappuzha": ["Alleppey"],
  "Thrissur": ["Trichur"],
  "Kannur": ["Cannanore"],
  "Kollam": ["Quilon"],
  "Palakkad": ["Palghat"],
  "Malappuram": ["Malapuram"],
  "Kasaragod": ["Kasargod"],
  "Wayanad": ["Wynad", "Wayanadu"],
  "Pathanamthitta": ["Pathanamthitta District"],
  "Idukki": ["Idukki District"],
  
  // Odisha
  "Bhubaneswar": ["Bhubaneshwar", "BBSR", "Temple City of India"],
  "Puri": ["Jagannath Puri", "Jagannath Dham"],
  "Cuttack": ["Cuttak", "Kataka"],
  "Khordha": ["Khurda"],
  "Ganjam": ["Berhampur", "Brahmapur"],
  "Sundargarh": ["Sundargarh District", "Rourkela"],
  "Sambalpur": ["Sambalpur District"],
  "Mayurbhanj": ["Baripada"],
  "Balasore": ["Baleshwar"],
  "Koraput": ["Koraput District"],
  "Rayagada": ["Rayagada District"],
  "Kalahandi": ["Bhawanipatna"],
  "Bolangir": ["Balangir", "Bolangir District"],
  "Jharsuguda": ["Jharsuguda District"],
  "Angul": ["Angul District", "Talcher"],
  "Kendrapara": ["Kendrapara District"],
  "Jagatsinghpur": ["Jagatsinghapur", "Paradip"],
  "Jajpur": ["Jajpur District"],
  "Dhenkanal": ["Dhenkanal District"],
  "Keonjhar": ["Keonjhar District", "Kendujhar"],
  
  // Rajasthan
  "Jaipur": ["Pink City", "Jaipore"],
  "Jodhpur": ["Blue City", "Jodhpore"],
  "Udaipur": ["City of Lakes", "Udaipore"],
  "Jaisalmer": ["Golden City"],
  "Bikaner": ["Camel Country"],
  "Ajmer": ["Ajmere"],
  "Kota": ["Kota District"],
  "Alwar": ["Alwer"],
  "Bharatpur": ["Bharatpore"],
  "Chittorgarh": ["Chittor", "Chittaurgarh"],
  "Sikar": ["Sikar District"],
  "Pali": ["Pali District"],
  "Nagaur": ["Nagaur District"],
  "Jhunjhunu": ["Jhunjhunu District"],
  "Barmer": ["Barmer District"],
  "Jalore": ["Jalore District"],
  "Dungarpur": ["Dungarpur District"],
  "Banswara": ["Banswara District"],
  "Pratapgarh": ["Pratapgarh District"],
  "Sawai Madhopur": ["Sawai Madhopur District", "Ranthambore"],
  
  // Bihar
  "Patna": ["Pataliputra", "Patna Sahib"],
  "Gaya": ["Bodh Gaya", "Bodhgaya"],
  "Nalanda": ["Bihar Sharif"],
  "Muzaffarpur": ["Muzaffarpur District"],
  "Bhagalpur": ["Bhagalpur District", "Silk City"],
  "Darbhanga": ["Darbhanga District"],
  "Purnia": ["Purnea"],
  "Vaishali": ["Hajipur"],
  "Saran": ["Chapra"],
  "East Champaran": ["Motihari"],
  "West Champaran": ["Bettiah"],
  "Rohtas": ["Sasaram"],
  "Begusarai": ["Begusarai District"],
  "Samastipur": ["Samastipur District"],
  "Madhubani": ["Madhubani District", "Mithila"],
  
  // Punjab
  "Amritsar": ["Ambarsar", "Amritsar Sahib"],
  "Ludhiana": ["Ludhiyana", "Manchester of India"],
  "Jalandhar": ["Jullundur"],
  "Patiala": ["Patiala District"],
  "Bathinda": ["Bhatinda"],
  "Mohali": ["SAS Nagar", "Sahibzada Ajit Singh Nagar"],
  "Pathankot": ["Pathankote"],
  "Hoshiarpur": ["Hoshiarpur District"],
  "Kapurthala": ["Kapurthala District"],
  "Gurdaspur": ["Gurdaspur District"],
  "Firozpur": ["Ferozepur"],
  "Faridkot": ["Faridkot District"],
  "Moga": ["Moga District"],
  "Barnala": ["Barnala District"],
  "Mansa": ["Mansa District"],
  "Sangrur": ["Sangrur District"],
  "Fatehgarh Sahib": ["Fatehgarh Sahib District"],
  "Rupnagar": ["Ropar", "Roopnagar"],
  
  // Haryana
  "Gurugram": ["Gurgaon"],
  "Faridabad": ["Faridabad District"],
  "Panipat": ["Panipat District"],
  "Ambala": ["Ambala District"],
  "Karnal": ["Karnal District"],
  "Rohtak": ["Rohtak District"],
  "Hisar": ["Hissar"],
  "Sonipat": ["Sonipat District"],
  "Yamunanagar": ["Yamuna Nagar"],
  "Bhiwani": ["Bhiwani District"],
  "Rewari": ["Rewari District"],
  "Jhajjar": ["Jhajjar District"],
  "Kurukshetra": ["Kurukshetra District"],
  "Sirsa": ["Sirsa District"],
  "Jind": ["Jind District"],
  "Palwal": ["Palwal District"],
  "Mahendragarh": ["Mahendragarh District", "Narnaul"],
  "Panchkula": ["Panchkula District"],
  
  // Madhya Pradesh
  "Bhopal": ["Bhopal District", "City of Lakes"],
  "Indore": ["Indore District", "Mini Mumbai"],
  "Jabalpur": ["Jabalpur District"],
  "Gwalior": ["Gwalior District"],
  "Ujjain": ["Ujjain District"],
  "Sagar": ["Saugor"],
  "Rewa": ["Rewa District"],
  "Satna": ["Satna District"],
  "Dewas": ["Dewas District"],
  "Ratlam": ["Ratlam District"],
  "Khargone": ["Khargone District", "West Nimar"],
  "Khandwa": ["Khandwa District", "East Nimar"],
  "Chhindwara": ["Chhindwara District"],
  "Shivpuri": ["Shivpuri District"],
  "Vidisha": ["Vidisha District"],
  "Damoh": ["Damoh District"],
  "Panna": ["Panna District"],
  "Tikamgarh": ["Tikamgarh District"],
  "Chhatarpur": ["Chhatarpur District"],
  "Hoshangabad": ["Narmadapuram"],
  
  // Chhattisgarh
  "Raipur": ["Raipur District", "Capital of CG"],
  "Bilaspur CG": ["Bilaspur District", "Bilaspur Chhattisgarh"],
  "Durg": ["Durg-Bhilai", "Bhilai"],
  "Korba": ["Korba District"],
  "Raigarh": ["Raigarh District"],
  "Rajnandgaon": ["Rajnandgaon District"],
  "Jagdalpur": ["Bastar District"],
  "Ambikapur": ["Surguja District"],
  
  // Assam
  "Guwahati": ["Gauhati", "Kamrup Metropolitan"],
  "Dibrugarh": ["Dibrugarh District"],
  "Jorhat": ["Jorhat District"],
  "Silchar": ["Cachar District"],
  "Tezpur": ["Sonitpur District"],
  "Nagaon": ["Nowgong"],
  "Tinsukia": ["Tinsukia District"],
  "Bongaigaon": ["Bongaigaon District"],
  "Sivasagar": ["Sibsagar"],
  "Goalpara": ["Goalpara District"],
  "Nalbari": ["Nalbari District"],
  "Barpeta": ["Barpeta District"],
  "Kamrup": ["Kamrup District"],
  "Darrang": ["Darrang District"],
  "Lakhimpur": ["Lakhimpur District"],
  
  // Delhi
  "New Delhi": ["Delhi", "NCR", "National Capital", "Central Delhi"],
  "North Delhi": ["North District"],
  "South Delhi": ["South District"],
  "East Delhi": ["East District"],
  "West Delhi": ["West District"],
  "North West Delhi": ["NW District"],
  "South West Delhi": ["SW District", "Dwarka"],
  "North East Delhi": ["NE District"],
  "South East Delhi": ["SE District"],
  "Shahdara": ["Shahdara District"],
  
  // Himachal Pradesh
  "Shimla": ["Simla"],
  "Dharamshala": ["Dharamsala", "Kangra District"],
  "Kullu": ["Kulu"],
  "Manali": ["Manali Town"],
  "Mandi HP": ["Mandi District Himachal"],
  "Solan": ["Solan District"],
  "Hamirpur HP": ["Hamirpur Himachal"],
  "Una HP": ["Una District Himachal"],
  "Bilaspur HP": ["Bilaspur Himachal"],
  "Chamba": ["Chamba District"],
  "Kinnaur": ["Kinnaur District"],
  "Lahaul and Spiti": ["Lahaul Spiti"],
  
  // Uttarakhand
  "Dehradun": ["Dehra Dun"],
  "Haridwar": ["Hardwar"],
  "Rishikesh": ["Rishikesh Town"],
  "Nainital": ["Nainital District"],
  "Almora": ["Almora District"],
  "Udham Singh Nagar": ["US Nagar", "Rudrapur"],
  "Tehri Garhwal": ["Tehri"],
  "Pauri Garhwal": ["Pauri"],
  "Chamoli": ["Chamoli District"],
  "Uttarkashi": ["Uttarkashi District"],
  "Pithoragarh": ["Pithoragarh District"],
  "Bageshwar": ["Bageshwar District"],
  "Champawat": ["Champawat District"],
  
  // Jharkhand
  "Ranchi": ["Ranchi District"],
  "Jamshedpur": ["East Singhbhum", "Tata Nagar", "Steel City"],
  "Dhanbad": ["Dhanbad District", "Coal Capital"],
  "Bokaro": ["Bokaro Steel City"],
  "Hazaribagh": ["Hazaribag"],
  "Deoghar": ["Deoghar District", "Baidyanath Dham"],
  "Giridih": ["Giridih District"],
  "Dumka": ["Dumka District"],
  "Chaibasa": ["West Singhbhum"],
  "Palamu": ["Daltonganj"],
  
  // Goa
  "Panaji": ["Panjim", "Panaaji"],
  "Margao": ["Madgaon"],
  "Vasco da Gama": ["Vasco"],
  "North Goa": ["North Goa District"],
  "South Goa": ["South Goa District"],
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
