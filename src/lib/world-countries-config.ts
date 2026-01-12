// World Countries Configuration with Regional Languages, Flags, and Capitals
// This file provides metadata for countries including their provinces/states, languages, and flags

export interface CountryLanguage {
  code: string;
  name: string;
  nativeName: string;
  script?: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  capital: string;
  capitalFlag?: string;
  languages: CountryLanguage[];
  provinces?: ProvinceConfig[];
  currency?: string;
  region: string;
  tier: "local" | "national" | "global";
}

export interface ProvinceConfig {
  id: string;
  name: string;
  capital?: string;
  capitalCoordinates?: { lat: number; lng: number };
  flag?: string;
  flagEmoji?: string;
  coatOfArms?: string;
  language?: string;
  languages?: string[];
  majorCities?: string[];
  population?: number;
  area?: number; // in km²
}

// Province configurations for major countries
export const COUNTRY_PROVINCES: Record<string, ProvinceConfig[]> = {
  // United Kingdom
  GB: [
    {
      id: "england",
      name: "England",
      capital: "London",
      capitalCoordinates: { lat: 51.5074, lng: -0.1278 },
      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      language: "en",
      majorCities: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Sheffield", "Bristol", "Newcastle", "Nottingham", "Leicester"],
      population: 56490048,
      area: 130279
    },
    {
      id: "scotland",
      name: "Scotland",
      capital: "Edinburgh",
      capitalCoordinates: { lat: 55.9533, lng: -3.1883 },
      flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
      flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
      language: "gd",
      languages: ["en", "gd"],
      majorCities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness", "Stirling", "Perth"],
      population: 5454000,
      area: 77933
    },
    {
      id: "wales",
      name: "Wales",
      capital: "Cardiff",
      capitalCoordinates: { lat: 51.4816, lng: -3.1791 },
      flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
      flagEmoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
      language: "cy",
      languages: ["en", "cy"],
      majorCities: ["Cardiff", "Swansea", "Newport", "Wrexham", "Barry", "Neath"],
      population: 3136000,
      area: 20779
    },
    {
      id: "northern-ireland",
      name: "Northern Ireland",
      capital: "Belfast",
      capitalCoordinates: { lat: 54.5973, lng: -5.9301 },
      flag: "🇬🇧",
      flagEmoji: "🇬🇧",
      language: "en",
      languages: ["en", "ga"],
      majorCities: ["Belfast", "Derry", "Lisburn", "Newry", "Bangor", "Craigavon"],
      population: 1895500,
      area: 13843
    }
  ],

  // Germany
  DE: [
    {
      id: "bavaria",
      name: "Bavaria (Bayern)",
      capital: "Munich",
      capitalCoordinates: { lat: 48.1351, lng: 11.5820 },
      flag: "🏳️",
      flagEmoji: "🔵⚪",
      language: "de",
      majorCities: ["Munich", "Nuremberg", "Augsburg", "Regensburg", "Ingolstadt", "Würzburg", "Fürth"],
      population: 13176989,
      area: 70550
    },
    {
      id: "berlin",
      name: "Berlin",
      capital: "Berlin",
      capitalCoordinates: { lat: 52.5200, lng: 13.4050 },
      flag: "🏳️",
      flagEmoji: "🐻",
      language: "de",
      majorCities: ["Berlin"],
      population: 3669491,
      area: 891
    },
    {
      id: "baden-wurttemberg",
      name: "Baden-Württemberg",
      capital: "Stuttgart",
      capitalCoordinates: { lat: 48.7758, lng: 9.1829 },
      flag: "🏳️",
      flagEmoji: "🟡⚫",
      language: "de",
      majorCities: ["Stuttgart", "Karlsruhe", "Mannheim", "Freiburg", "Heidelberg", "Ulm", "Heilbronn"],
      population: 11103043,
      area: 35751
    },
    {
      id: "north-rhine-westphalia",
      name: "North Rhine-Westphalia (NRW)",
      capital: "Düsseldorf",
      capitalCoordinates: { lat: 51.2277, lng: 6.7735 },
      flag: "🏳️",
      flagEmoji: "🟢⚪🔴",
      language: "de",
      majorCities: ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Duisburg", "Bochum", "Wuppertal", "Bonn"],
      population: 17932651,
      area: 34113
    },
    {
      id: "hesse",
      name: "Hesse (Hessen)",
      capital: "Wiesbaden",
      capitalCoordinates: { lat: 50.0782, lng: 8.2398 },
      flag: "🏳️",
      flagEmoji: "🔴⚪",
      language: "de",
      majorCities: ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt", "Offenbach", "Marburg"],
      population: 6293154,
      area: 21115
    },
    {
      id: "hamburg",
      name: "Hamburg",
      capital: "Hamburg",
      capitalCoordinates: { lat: 53.5511, lng: 9.9937 },
      flag: "🏳️",
      flagEmoji: "🏰",
      language: "de",
      majorCities: ["Hamburg"],
      population: 1853935,
      area: 755
    },
    {
      id: "saxony",
      name: "Saxony (Sachsen)",
      capital: "Dresden",
      capitalCoordinates: { lat: 51.0504, lng: 13.7373 },
      flag: "🏳️",
      flagEmoji: "⚪🟢",
      language: "de",
      majorCities: ["Dresden", "Leipzig", "Chemnitz", "Zwickau", "Plauen"],
      population: 4056941,
      area: 18420
    }
  ],

  // Australia
  AU: [
    {
      id: "new-south-wales",
      name: "New South Wales",
      capital: "Sydney",
      capitalCoordinates: { lat: -33.8688, lng: 151.2093 },
      flag: "🏳️",
      flagEmoji: "🦘",
      language: "en",
      majorCities: ["Sydney", "Newcastle", "Wollongong", "Central Coast", "Coffs Harbour", "Wagga Wagga", "Albury", "Tamworth"],
      population: 8166369,
      area: 800642
    },
    {
      id: "victoria",
      name: "Victoria",
      capital: "Melbourne",
      capitalCoordinates: { lat: -37.8136, lng: 144.9631 },
      flag: "🏳️",
      flagEmoji: "👑",
      language: "en",
      majorCities: ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Shepparton", "Mildura", "Warrnambool"],
      population: 6681000,
      area: 227444
    },
    {
      id: "queensland",
      name: "Queensland",
      capital: "Brisbane",
      capitalCoordinates: { lat: -27.4698, lng: 153.0251 },
      flag: "🏳️",
      flagEmoji: "☀️",
      language: "en",
      majorCities: ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville", "Cairns", "Toowoomba", "Mackay", "Rockhampton"],
      population: 5206400,
      area: 1852642
    },
    {
      id: "western-australia",
      name: "Western Australia",
      capital: "Perth",
      capitalCoordinates: { lat: -31.9505, lng: 115.8605 },
      flag: "🏳️",
      flagEmoji: "🦢",
      language: "en",
      majorCities: ["Perth", "Mandurah", "Bunbury", "Geraldton", "Kalgoorlie", "Albany", "Broome"],
      population: 2675797,
      area: 2529875
    },
    {
      id: "south-australia",
      name: "South Australia",
      capital: "Adelaide",
      capitalCoordinates: { lat: -34.9285, lng: 138.6007 },
      flag: "🏳️",
      flagEmoji: "🍇",
      language: "en",
      majorCities: ["Adelaide", "Mount Gambier", "Whyalla", "Murray Bridge", "Port Augusta", "Port Lincoln"],
      population: 1771700,
      area: 983482
    },
    {
      id: "tasmania",
      name: "Tasmania",
      capital: "Hobart",
      capitalCoordinates: { lat: -42.8821, lng: 147.3272 },
      flag: "🏳️",
      flagEmoji: "🦔",
      language: "en",
      majorCities: ["Hobart", "Launceston", "Devonport", "Burnie"],
      population: 541500,
      area: 68401
    },
    {
      id: "northern-territory",
      name: "Northern Territory",
      capital: "Darwin",
      capitalCoordinates: { lat: -12.4634, lng: 130.8456 },
      flag: "🏳️",
      flagEmoji: "🐊",
      language: "en",
      majorCities: ["Darwin", "Alice Springs", "Katherine", "Palmerston"],
      population: 246500,
      area: 1420968
    },
    {
      id: "australian-capital-territory",
      name: "Australian Capital Territory",
      capital: "Canberra",
      capitalCoordinates: { lat: -35.2809, lng: 149.1300 },
      flag: "🏳️",
      flagEmoji: "🏛️",
      language: "en",
      majorCities: ["Canberra"],
      population: 431826,
      area: 2358
    }
  ],

  // France
  FR: [
    {
      id: "ile-de-france",
      name: "Île-de-France",
      capital: "Paris",
      capitalCoordinates: { lat: 48.8566, lng: 2.3522 },
      flag: "🏳️",
      flagEmoji: "🗼",
      language: "fr",
      majorCities: ["Paris", "Boulogne-Billancourt", "Saint-Denis", "Argenteuil", "Montreuil", "Versailles"],
      population: 12278210,
      area: 12012
    },
    {
      id: "provence-alpes-cote-azur",
      name: "Provence-Alpes-Côte d'Azur",
      capital: "Marseille",
      capitalCoordinates: { lat: 43.2965, lng: 5.3698 },
      flag: "🏳️",
      flagEmoji: "☀️",
      language: "fr",
      majorCities: ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Cannes", "Antibes"],
      population: 5055651,
      area: 31400
    },
    {
      id: "auvergne-rhone-alpes",
      name: "Auvergne-Rhône-Alpes",
      capital: "Lyon",
      capitalCoordinates: { lat: 45.7640, lng: 4.8357 },
      flag: "🏳️",
      flagEmoji: "🏔️",
      language: "fr",
      majorCities: ["Lyon", "Grenoble", "Saint-Étienne", "Villeurbanne", "Clermont-Ferrand", "Annecy"],
      population: 8078652,
      area: 69711
    },
    {
      id: "nouvelle-aquitaine",
      name: "Nouvelle-Aquitaine",
      capital: "Bordeaux",
      capitalCoordinates: { lat: 44.8378, lng: -0.5792 },
      flag: "🏳️",
      flagEmoji: "🍷",
      language: "fr",
      majorCities: ["Bordeaux", "Limoges", "Poitiers", "La Rochelle", "Pau", "Bayonne", "Angoulême"],
      population: 5999982,
      area: 84061
    },
    {
      id: "occitanie",
      name: "Occitanie",
      capital: "Toulouse",
      capitalCoordinates: { lat: 43.6047, lng: 1.4442 },
      flag: "🏳️",
      flagEmoji: "✝️",
      language: "fr",
      majorCities: ["Toulouse", "Montpellier", "Nîmes", "Perpignan", "Béziers", "Narbonne"],
      population: 5924858,
      area: 72724
    },
    {
      id: "brittany",
      name: "Brittany (Bretagne)",
      capital: "Rennes",
      capitalCoordinates: { lat: 48.1173, lng: -1.6778 },
      flag: "🏳️",
      flagEmoji: "🦪",
      language: "fr",
      languages: ["fr", "br"],
      majorCities: ["Rennes", "Brest", "Quimper", "Lorient", "Vannes", "Saint-Malo"],
      population: 3373835,
      area: 27208
    }
  ],

  // Japan
  JP: [
    {
      id: "tokyo",
      name: "Tokyo",
      capital: "Tokyo",
      capitalCoordinates: { lat: 35.6762, lng: 139.6503 },
      flag: "🏳️",
      flagEmoji: "🗼",
      language: "ja",
      majorCities: ["Shinjuku", "Shibuya", "Minato", "Chiyoda", "Chuo", "Meguro", "Setagaya"],
      population: 14047594,
      area: 2194
    },
    {
      id: "osaka",
      name: "Osaka",
      capital: "Osaka",
      capitalCoordinates: { lat: 34.6937, lng: 135.5023 },
      flag: "🏳️",
      flagEmoji: "🏯",
      language: "ja",
      majorCities: ["Osaka", "Sakai", "Higashiosaka", "Hirakata", "Toyonaka", "Suita"],
      population: 8837685,
      area: 1905
    },
    {
      id: "kanagawa",
      name: "Kanagawa",
      capital: "Yokohama",
      capitalCoordinates: { lat: 35.4437, lng: 139.6380 },
      flag: "🏳️",
      flagEmoji: "⚓",
      language: "ja",
      majorCities: ["Yokohama", "Kawasaki", "Sagamihara", "Fujisawa", "Yokosuka", "Hiratsuka"],
      population: 9237337,
      area: 2416
    },
    {
      id: "aichi",
      name: "Aichi",
      capital: "Nagoya",
      capitalCoordinates: { lat: 35.1815, lng: 136.9066 },
      flag: "🏳️",
      flagEmoji: "🚗",
      language: "ja",
      majorCities: ["Nagoya", "Toyota", "Okazaki", "Ichinomiya", "Kasugai", "Toyohashi"],
      population: 7542415,
      area: 5173
    },
    {
      id: "hokkaido",
      name: "Hokkaido",
      capital: "Sapporo",
      capitalCoordinates: { lat: 43.0618, lng: 141.3545 },
      flag: "🏳️",
      flagEmoji: "❄️",
      language: "ja",
      majorCities: ["Sapporo", "Asahikawa", "Hakodate", "Kushiro", "Obihiro", "Otaru"],
      population: 5224614,
      area: 83424
    },
    {
      id: "fukuoka",
      name: "Fukuoka",
      capital: "Fukuoka",
      capitalCoordinates: { lat: 33.5904, lng: 130.4017 },
      flag: "🏳️",
      flagEmoji: "🌸",
      language: "ja",
      majorCities: ["Fukuoka", "Kitakyushu", "Kurume", "Iizuka", "Omuta"],
      population: 5138217,
      area: 4987
    },
    {
      id: "kyoto",
      name: "Kyoto",
      capital: "Kyoto",
      capitalCoordinates: { lat: 35.0116, lng: 135.7681 },
      flag: "🏳️",
      flagEmoji: "⛩️",
      language: "ja",
      majorCities: ["Kyoto", "Uji", "Kameoka", "Joyo", "Maizuru", "Nagaokakyo"],
      population: 2578087,
      area: 4612
    }
  ],

  // Canada
  CA: [
    {
      id: "ontario",
      name: "Ontario",
      capital: "Toronto",
      capitalCoordinates: { lat: 43.6532, lng: -79.3832 },
      flag: "🏳️",
      flagEmoji: "🍁",
      language: "en",
      majorCities: ["Toronto", "Ottawa", "Mississauga", "Hamilton", "Brampton", "London", "Markham", "Vaughan"],
      population: 14826276,
      area: 1076395
    },
    {
      id: "quebec",
      name: "Quebec",
      capital: "Quebec City",
      capitalCoordinates: { lat: 46.8139, lng: -71.2080 },
      flag: "🏳️",
      flagEmoji: "⚜️",
      language: "fr",
      majorCities: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Trois-Rivières"],
      population: 8604495,
      area: 1542056
    },
    {
      id: "british-columbia",
      name: "British Columbia",
      capital: "Victoria",
      capitalCoordinates: { lat: 48.4284, lng: -123.3656 },
      flag: "🏳️",
      flagEmoji: "🌲",
      language: "en",
      majorCities: ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Kelowna", "Abbotsford"],
      population: 5214805,
      area: 944735
    },
    {
      id: "alberta",
      name: "Alberta",
      capital: "Edmonton",
      capitalCoordinates: { lat: 53.5461, lng: -113.4938 },
      flag: "🏳️",
      flagEmoji: "🛢️",
      language: "en",
      majorCities: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Medicine Hat", "Grande Prairie"],
      population: 4442879,
      area: 661848
    }
  ],

  // United States
  US: [
    {
      id: "california",
      name: "California",
      capital: "Sacramento",
      capitalCoordinates: { lat: 38.5816, lng: -121.4944 },
      flag: "🐻",
      flagEmoji: "🐻",
      language: "en",
      languages: ["en", "es"],
      majorCities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland", "Fresno"],
      population: 39538223,
      area: 423967
    },
    {
      id: "texas",
      name: "Texas",
      capital: "Austin",
      capitalCoordinates: { lat: 30.2672, lng: -97.7431 },
      flag: "🏳️",
      flagEmoji: "⭐",
      language: "en",
      languages: ["en", "es"],
      majorCities: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington"],
      population: 29145505,
      area: 695662
    },
    {
      id: "new-york",
      name: "New York",
      capital: "Albany",
      capitalCoordinates: { lat: 42.6526, lng: -73.7562 },
      flag: "🏳️",
      flagEmoji: "🗽",
      language: "en",
      majorCities: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"],
      population: 20201249,
      area: 141297
    },
    {
      id: "florida",
      name: "Florida",
      capital: "Tallahassee",
      capitalCoordinates: { lat: 30.4383, lng: -84.2807 },
      flag: "🏳️",
      flagEmoji: "🌴",
      language: "en",
      languages: ["en", "es"],
      majorCities: ["Miami", "Tampa", "Orlando", "Jacksonville", "Fort Lauderdale", "St. Petersburg"],
      population: 21538187,
      area: 170312
    }
  ]
};

// Get provinces for a country
export function getCountryProvinces(countryCode: string): ProvinceConfig[] {
  return COUNTRY_PROVINCES[countryCode.toUpperCase()] || [];
}

// Get a specific province by ID
export function getProvince(countryCode: string, provinceId: string): ProvinceConfig | undefined {
  const provinces = getCountryProvinces(countryCode);
  return provinces.find(p => p.id === provinceId);
}

// Country language mapping
export const COUNTRY_LANGUAGES: Record<string, CountryLanguage[]> = {
  US: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
  ],
  GB: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "cy", name: "Welsh", nativeName: "Cymraeg" },
    { code: "gd", name: "Scottish Gaelic", nativeName: "Gàidhlig" },
  ],
  IN: [
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", script: "Devanagari" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", script: "Bengali" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", script: "Telugu" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", script: "Devanagari" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", script: "Tamil" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", script: "Gujarati" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", script: "Kannada" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം", script: "Malayalam" },
    { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", script: "Odia" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", script: "Gurmukhi" },
    { code: "as", name: "Assamese", nativeName: "অসমীয়া", script: "Bengali" },
  ],
  CN: [
    { code: "zh", name: "Chinese", nativeName: "中文", script: "Simplified Han" },
    { code: "yue", name: "Cantonese", nativeName: "粵語" },
  ],
  JP: [
    { code: "ja", name: "Japanese", nativeName: "日本語", script: "Japanese" },
  ],
  DE: [
    { code: "de", name: "German", nativeName: "Deutsch" },
  ],
  FR: [
    { code: "fr", name: "French", nativeName: "Français" },
  ],
  ES: [
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "ca", name: "Catalan", nativeName: "Català" },
    { code: "eu", name: "Basque", nativeName: "Euskara" },
    { code: "gl", name: "Galician", nativeName: "Galego" },
  ],
  IT: [
    { code: "it", name: "Italian", nativeName: "Italiano" },
  ],
  BR: [
    { code: "pt", name: "Portuguese", nativeName: "Português" },
  ],
  RU: [
    { code: "ru", name: "Russian", nativeName: "Русский", script: "Cyrillic" },
  ],
  AE: [
    { code: "ar", name: "Arabic", nativeName: "العربية", script: "Arabic" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  SA: [
    { code: "ar", name: "Arabic", nativeName: "العربية", script: "Arabic" },
  ],
  ID: [
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  ],
  PK: [
    { code: "ur", name: "Urdu", nativeName: "اردو", script: "Arabic" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  BD: [
    { code: "bn", name: "Bengali", nativeName: "বাংলা", script: "Bengali" },
  ],
  NG: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
    { code: "ha", name: "Hausa", nativeName: "Hausa" },
    { code: "ig", name: "Igbo", nativeName: "Igbo" },
  ],
  EG: [
    { code: "ar", name: "Arabic", nativeName: "العربية", script: "Arabic" },
  ],
  ZA: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
    { code: "zu", name: "Zulu", nativeName: "isiZulu" },
    { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
  ],
  AU: [
    { code: "en", name: "English", nativeName: "English" },
  ],
  CA: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "fr", name: "French", nativeName: "Français" },
  ],
  MX: [
    { code: "es", name: "Spanish", nativeName: "Español" },
  ],
  KR: [
    { code: "ko", name: "Korean", nativeName: "한국어", script: "Hangul" },
  ],
  TH: [
    { code: "th", name: "Thai", nativeName: "ไทย", script: "Thai" },
  ],
  VN: [
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  ],
  MY: [
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  ],
  SG: [
    { code: "en", name: "English", nativeName: "English" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  ],
  PH: [
    { code: "tl", name: "Filipino", nativeName: "Filipino" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  NL: [
    { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  ],
  SE: [
    { code: "sv", name: "Swedish", nativeName: "Svenska" },
  ],
  NO: [
    { code: "no", name: "Norwegian", nativeName: "Norsk" },
  ],
  DK: [
    { code: "da", name: "Danish", nativeName: "Dansk" },
  ],
  FI: [
    { code: "fi", name: "Finnish", nativeName: "Suomi" },
    { code: "sv", name: "Swedish", nativeName: "Svenska" },
  ],
  PL: [
    { code: "pl", name: "Polish", nativeName: "Polski" },
  ],
  UA: [
    { code: "uk", name: "Ukrainian", nativeName: "Українська", script: "Cyrillic" },
  ],
  TR: [
    { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  ],
  IL: [
    { code: "he", name: "Hebrew", nativeName: "עברית", script: "Hebrew" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
  ],
  IR: [
    { code: "fa", name: "Persian", nativeName: "فارسی", script: "Arabic" },
  ],
  IQ: [
    { code: "ar", name: "Arabic", nativeName: "العربية", script: "Arabic" },
    { code: "ku", name: "Kurdish", nativeName: "کوردی" },
  ],
};

// RSS feed sources by country for local news
export const COUNTRY_LOCAL_RSS: Record<string, { name: string; url: string; language: string; region?: string }[]> = {
  US: [
    { name: "CNN", url: "http://rss.cnn.com/rss/cnn_topstories.rss", language: "en" },
    { name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", language: "en" },
    { name: "Washington Post", url: "https://feeds.washingtonpost.com/rss/world", language: "en" },
    { name: "AP News", url: "https://rsshub.app/apnews/topics/world-news", language: "en" },
  ],
  GB: [
    { name: "BBC News", url: "https://feeds.bbci.co.uk/news/rss.xml", language: "en" },
    { name: "The Guardian", url: "https://www.theguardian.com/world/rss", language: "en" },
    { name: "The Telegraph", url: "https://www.telegraph.co.uk/news/rss.xml", language: "en" },
  ],
  DE: [
    { name: "Deutsche Welle", url: "https://rss.dw.com/xml/rss-de-all", language: "de" },
    { name: "Der Spiegel", url: "https://www.spiegel.de/schlagzeilen/index.rss", language: "de" },
    { name: "FAZ", url: "https://www.faz.net/rss/aktuell/", language: "de" },
  ],
  FR: [
    { name: "Le Monde", url: "https://www.lemonde.fr/rss/une.xml", language: "fr" },
    { name: "Le Figaro", url: "https://www.lefigaro.fr/rss/figaro_actualites.xml", language: "fr" },
    { name: "France 24", url: "https://www.france24.com/fr/rss", language: "fr" },
  ],
  JP: [
    { name: "NHK World", url: "https://www3.nhk.or.jp/rss/news/cat0.xml", language: "ja" },
    { name: "Japan Times", url: "https://www.japantimes.co.jp/feed/", language: "en" },
    { name: "Asahi Shimbun", url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf", language: "ja" },
  ],
  CN: [
    { name: "China Daily", url: "https://www.chinadaily.com.cn/rss/china_rss.xml", language: "en" },
    { name: "Xinhua", url: "http://www.xinhuanet.com/english/rss/worldrss.xml", language: "en" },
    { name: "CGTN", url: "https://www.cgtn.com/subscribe/rss/section/world.xml", language: "en" },
  ],
  AU: [
    { name: "ABC News", url: "https://www.abc.net.au/news/feed/51120/rss.xml", language: "en" },
    { name: "Sydney Morning Herald", url: "https://www.smh.com.au/rss/feed.xml", language: "en" },
    { name: "The Australian", url: "https://www.theaustralian.com.au/feed/", language: "en" },
  ],
  CA: [
    { name: "CBC News", url: "https://www.cbc.ca/cmlink/rss-world", language: "en" },
    { name: "Globe and Mail", url: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/world/", language: "en" },
    { name: "Radio-Canada", url: "https://ici.radio-canada.ca/rss/4159", language: "fr" },
  ],
  BR: [
    { name: "Folha de São Paulo", url: "https://feeds.folha.uol.com.br/mundo/rss091.xml", language: "pt" },
    { name: "O Globo", url: "https://oglobo.globo.com/rss/oglobo_mundo.xml", language: "pt" },
    { name: "Estadão", url: "https://www.estadao.com.br/arc/outboundfeeds/rss/?outputType=xml", language: "pt" },
  ],
  RU: [
    { name: "RT", url: "https://www.rt.com/rss/", language: "en" },
    { name: "TASS", url: "https://tass.com/rss/v2.xml", language: "en" },
  ],
  AE: [
    { name: "Gulf News", url: "https://gulfnews.com/rss", language: "en" },
    { name: "Khaleej Times", url: "https://www.khaleejtimes.com/rss", language: "en" },
    { name: "The National", url: "https://www.thenationalnews.com/rss", language: "en" },
  ],
  SA: [
    { name: "Arab News", url: "https://www.arabnews.com/rss.xml", language: "en" },
    { name: "Saudi Gazette", url: "https://saudigazette.com.sa/feed/", language: "en" },
  ],
  EG: [
    { name: "Egypt Today", url: "https://www.egypttoday.com/RSS", language: "en" },
    { name: "Al-Ahram", url: "https://english.ahram.org.eg/RSS/", language: "en" },
  ],
  ZA: [
    { name: "News24", url: "https://www.news24.com/rss", language: "en" },
    { name: "Mail & Guardian", url: "https://mg.co.za/feed/", language: "en" },
    { name: "Daily Maverick", url: "https://www.dailymaverick.co.za/feed/", language: "en" },
  ],
  NG: [
    { name: "Punch Nigeria", url: "https://punchng.com/feed/", language: "en" },
    { name: "The Guardian Nigeria", url: "https://guardian.ng/feed/", language: "en" },
    { name: "Vanguard", url: "https://www.vanguardngr.com/feed/", language: "en" },
  ],
  KR: [
    { name: "Korea Herald", url: "http://www.koreaherald.com/rss", language: "en" },
    { name: "Yonhap News", url: "https://en.yna.co.kr/RSS/news.xml", language: "en" },
    { name: "Korea Times", url: "https://www.koreatimes.co.kr/www/rss/rss.xml", language: "en" },
  ],
  SG: [
    { name: "Straits Times", url: "https://www.straitstimes.com/news/singapore/rss.xml", language: "en" },
    { name: "Channel NewsAsia", url: "https://www.channelnewsasia.com/rssfeeds/8395986", language: "en" },
    { name: "Today Online", url: "https://www.todayonline.com/feed", language: "en" },
  ],
  MY: [
    { name: "The Star", url: "https://www.thestar.com.my/rss/News/", language: "en" },
    { name: "New Straits Times", url: "https://www.nst.com.my/rss", language: "en" },
    { name: "Malay Mail", url: "https://www.malaymail.com/feed/rss/malaysia", language: "en" },
  ],
  TH: [
    { name: "Bangkok Post", url: "https://www.bangkokpost.com/rss/data/topstories.xml", language: "en" },
    { name: "The Nation", url: "https://www.nationthailand.com/rss", language: "en" },
  ],
  ID: [
    { name: "Jakarta Post", url: "https://www.thejakartapost.com/feed/", language: "en" },
    { name: "Kompas", url: "https://www.kompas.com/rss", language: "id" },
    { name: "Tempo", url: "https://rss.tempo.co/", language: "id" },
  ],
  PH: [
    { name: "Philippine Daily Inquirer", url: "https://newsinfo.inquirer.net/feed", language: "en" },
    { name: "ABS-CBN News", url: "https://news.abs-cbn.com/rss", language: "en" },
    { name: "Rappler", url: "https://www.rappler.com/feed/", language: "en" },
  ],
  VN: [
    { name: "VnExpress", url: "https://vnexpress.net/rss/tin-moi-nhat.rss", language: "vi" },
    { name: "Vietnam News", url: "https://vietnamnews.vn/rss/", language: "en" },
  ],
  PK: [
    { name: "Dawn", url: "https://www.dawn.com/feeds/home", language: "en" },
    { name: "Geo News", url: "https://www.geo.tv/rss/", language: "en" },
    { name: "The News International", url: "https://www.thenews.com.pk/rss/1/1", language: "en" },
  ],
  BD: [
    { name: "Daily Star", url: "https://www.thedailystar.net/rss.xml", language: "en" },
    { name: "Prothom Alo", url: "https://www.prothomalo.com/feed/", language: "bn" },
    { name: "Dhaka Tribune", url: "https://www.dhakatribune.com/feed/", language: "en" },
  ],
  NL: [
    { name: "NOS", url: "https://feeds.nos.nl/nosnieuwsalgemeen", language: "nl" },
    { name: "De Volkskrant", url: "https://www.volkskrant.nl/voorpagina/rss.xml", language: "nl" },
    { name: "NRC", url: "https://www.nrc.nl/rss/", language: "nl" },
  ],
  ES: [
    { name: "El País", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada", language: "es" },
    { name: "El Mundo", url: "https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml", language: "es" },
    { name: "La Vanguardia", url: "https://www.lavanguardia.com/rss/home.xml", language: "es" },
  ],
  IT: [
    { name: "La Repubblica", url: "https://www.repubblica.it/rss/homepage/rss2.0.xml", language: "it" },
    { name: "Corriere della Sera", url: "https://xml2.corriereobjects.it/rss/homepage.xml", language: "it" },
    { name: "ANSA", url: "https://www.ansa.it/sito/ansait_rss.xml", language: "it" },
  ],
  MX: [
    { name: "El Universal", url: "https://www.eluniversal.com.mx/rss.xml", language: "es" },
    { name: "Milenio", url: "https://www.milenio.com/rss", language: "es" },
    { name: "Reforma", url: "https://www.reforma.com/rss/portada.xml", language: "es" },
  ],
  TR: [
    { name: "Daily Sabah", url: "https://www.dailysabah.com/rssFeed/turkey", language: "en" },
    { name: "Hurriyet Daily News", url: "https://www.hurriyetdailynews.com/rss", language: "en" },
    { name: "TRT World", url: "https://www.trtworld.com/rss", language: "en" },
  ],
  PL: [
    { name: "Gazeta Wyborcza", url: "https://wyborcza.pl/rss/", language: "pl" },
    { name: "TVN24", url: "https://tvn24.pl/najnowsze.xml", language: "pl" },
  ],
  UA: [
    { name: "Kyiv Independent", url: "https://kyivindependent.com/feed/", language: "en" },
    { name: "Ukrayinska Pravda", url: "https://www.pravda.com.ua/rss/", language: "uk" },
  ],
};

// Get language name from code
export function getLanguageName(code: string): { name: string; nativeName: string } {
  const allLanguages = Object.values(COUNTRY_LANGUAGES).flat();
  const lang = allLanguages.find(l => l.code === code);
  return lang ? { name: lang.name, nativeName: lang.nativeName } : { name: code.toUpperCase(), nativeName: code.toUpperCase() };
}

// Get country languages
export function getCountryLanguages(countryCode: string): CountryLanguage[] {
  return COUNTRY_LANGUAGES[countryCode.toUpperCase()] || [{ code: "en", name: "English", nativeName: "English" }];
}

// Get local RSS feeds for a country
export function getCountryLocalRSS(countryCode: string) {
  return COUNTRY_LOCAL_RSS[countryCode.toUpperCase()] || [];
}

// Determine if news is local or global based on source
export function isLocalNews(sourceUrl: string, countryCode: string): boolean {
  const localFeeds = getCountryLocalRSS(countryCode);
  return localFeeds.some(feed => sourceUrl.toLowerCase().includes(new URL(feed.url).hostname.replace('www.', '')));
}
