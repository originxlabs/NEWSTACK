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
  ],

  // China - Provinces (Shěng), Municipalities, Autonomous Regions
  CN: [
    {
      id: "beijing",
      name: "Beijing (北京)",
      capital: "Beijing",
      capitalCoordinates: { lat: 39.9042, lng: 116.4074 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "zh",
      majorCities: ["Beijing"],
      population: 21893095,
      area: 16410
    },
    {
      id: "shanghai",
      name: "Shanghai (上海)",
      capital: "Shanghai",
      capitalCoordinates: { lat: 31.2304, lng: 121.4737 },
      flag: "🌆",
      flagEmoji: "🌆",
      language: "zh",
      majorCities: ["Shanghai", "Pudong", "Minhang"],
      population: 24870895,
      area: 6341
    },
    {
      id: "guangdong",
      name: "Guangdong (广东)",
      capital: "Guangzhou",
      capitalCoordinates: { lat: 23.1291, lng: 113.2644 },
      flag: "🌺",
      flagEmoji: "🌺",
      language: "zh",
      languages: ["zh", "yue"],
      majorCities: ["Guangzhou", "Shenzhen", "Dongguan", "Foshan", "Zhuhai", "Huizhou", "Zhongshan"],
      population: 126012510,
      area: 177900
    },
    {
      id: "zhejiang",
      name: "Zhejiang (浙江)",
      capital: "Hangzhou",
      capitalCoordinates: { lat: 30.2741, lng: 120.1551 },
      flag: "🌊",
      flagEmoji: "🌊",
      language: "zh",
      majorCities: ["Hangzhou", "Ningbo", "Wenzhou", "Shaoxing", "Jiaxing"],
      population: 64567588,
      area: 101800
    },
    {
      id: "jiangsu",
      name: "Jiangsu (江苏)",
      capital: "Nanjing",
      capitalCoordinates: { lat: 32.0603, lng: 118.7969 },
      flag: "🏯",
      flagEmoji: "🏯",
      language: "zh",
      majorCities: ["Nanjing", "Suzhou", "Wuxi", "Changzhou", "Nantong", "Xuzhou"],
      population: 84748016,
      area: 102600
    },
    {
      id: "sichuan",
      name: "Sichuan (四川)",
      capital: "Chengdu",
      capitalCoordinates: { lat: 30.5728, lng: 104.0668 },
      flag: "🐼",
      flagEmoji: "🐼",
      language: "zh",
      majorCities: ["Chengdu", "Mianyang", "Deyang", "Leshan", "Nanchong"],
      population: 83674866,
      area: 486000
    },
    {
      id: "hubei",
      name: "Hubei (湖北)",
      capital: "Wuhan",
      capitalCoordinates: { lat: 30.5928, lng: 114.3055 },
      flag: "🌅",
      flagEmoji: "🌅",
      language: "zh",
      majorCities: ["Wuhan", "Yichang", "Xiangyang", "Jingzhou", "Huangshi"],
      population: 57752557,
      area: 185900
    },
    {
      id: "shandong",
      name: "Shandong (山东)",
      capital: "Jinan",
      capitalCoordinates: { lat: 36.6512, lng: 117.1201 },
      flag: "⛰️",
      flagEmoji: "⛰️",
      language: "zh",
      majorCities: ["Jinan", "Qingdao", "Yantai", "Weifang", "Zibo", "Linyi"],
      population: 101527453,
      area: 157100
    },
    {
      id: "henan",
      name: "Henan (河南)",
      capital: "Zhengzhou",
      capitalCoordinates: { lat: 34.7466, lng: 113.6254 },
      flag: "🌾",
      flagEmoji: "🌾",
      language: "zh",
      majorCities: ["Zhengzhou", "Luoyang", "Kaifeng", "Xinxiang", "Anyang"],
      population: 99365519,
      area: 167000
    },
    {
      id: "hong-kong",
      name: "Hong Kong (香港)",
      capital: "Hong Kong",
      capitalCoordinates: { lat: 22.3193, lng: 114.1694 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "zh",
      languages: ["zh", "yue", "en"],
      majorCities: ["Central", "Kowloon", "Tsim Sha Tsui", "Mong Kok"],
      population: 7500700,
      area: 1104
    },
    {
      id: "macau",
      name: "Macau (澳门)",
      capital: "Macau",
      capitalCoordinates: { lat: 22.1987, lng: 113.5439 },
      flag: "🎰",
      flagEmoji: "🎰",
      language: "zh",
      languages: ["zh", "pt"],
      majorCities: ["Macau Peninsula", "Taipa", "Cotai"],
      population: 682500,
      area: 33
    }
  ],

  // Russia - Federal Subjects (Oblasts, Republics, Krais)
  RU: [
    {
      id: "moscow",
      name: "Moscow (Москва)",
      capital: "Moscow",
      capitalCoordinates: { lat: 55.7558, lng: 37.6173 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "ru",
      majorCities: ["Moscow"],
      population: 12655050,
      area: 2561
    },
    {
      id: "saint-petersburg",
      name: "Saint Petersburg (Санкт-Петербург)",
      capital: "Saint Petersburg",
      capitalCoordinates: { lat: 59.9311, lng: 30.3609 },
      flag: "⚓",
      flagEmoji: "⚓",
      language: "ru",
      majorCities: ["Saint Petersburg"],
      population: 5384342,
      area: 1439
    },
    {
      id: "moscow-oblast",
      name: "Moscow Oblast (Московская область)",
      capital: "Krasnogorsk",
      capitalCoordinates: { lat: 55.8204, lng: 37.3308 },
      flag: "🏘️",
      flagEmoji: "🏘️",
      language: "ru",
      majorCities: ["Balashikha", "Podolsk", "Khimki", "Mytishchi", "Korolev"],
      population: 7690863,
      area: 44340
    }
  ],

  // Brazil - States (Estados)
  BR: [
    {
      id: "sao-paulo",
      name: "São Paulo",
      capital: "São Paulo",
      capitalCoordinates: { lat: -23.5505, lng: -46.6333 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "pt",
      majorCities: ["São Paulo", "Campinas", "Guarulhos", "Santos", "Ribeirão Preto"],
      population: 46289333,
      area: 248209
    },
    {
      id: "rio-de-janeiro",
      name: "Rio de Janeiro",
      capital: "Rio de Janeiro",
      capitalCoordinates: { lat: -22.9068, lng: -43.1729 },
      flag: "🏖️",
      flagEmoji: "🏖️",
      language: "pt",
      majorCities: ["Rio de Janeiro", "Niterói", "Nova Iguaçu", "Petrópolis"],
      population: 17366189,
      area: 43696
    },
    {
      id: "minas-gerais",
      name: "Minas Gerais",
      capital: "Belo Horizonte",
      capitalCoordinates: { lat: -19.9167, lng: -43.9345 },
      flag: "⛏️",
      flagEmoji: "⛏️",
      language: "pt",
      majorCities: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora"],
      population: 21292666,
      area: 586522
    }
  ],

  // South Korea - Provinces (Do) and Special Cities
  KR: [
    {
      id: "seoul",
      name: "Seoul (서울)",
      capital: "Seoul",
      capitalCoordinates: { lat: 37.5665, lng: 126.9780 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "ko",
      majorCities: ["Gangnam", "Jongno", "Mapo", "Yongsan"],
      population: 9776000,
      area: 605
    },
    {
      id: "busan",
      name: "Busan (부산)",
      capital: "Busan",
      capitalCoordinates: { lat: 35.1796, lng: 129.0756 },
      flag: "⚓",
      flagEmoji: "⚓",
      language: "ko",
      majorCities: ["Busan", "Haeundae", "Seomyeon"],
      population: 3429000,
      area: 770
    },
    {
      id: "gyeonggi",
      name: "Gyeonggi Province (경기도)",
      capital: "Suwon",
      capitalCoordinates: { lat: 37.2636, lng: 127.0286 },
      flag: "🏘️",
      flagEmoji: "🏘️",
      language: "ko",
      majorCities: ["Suwon", "Seongnam", "Goyang", "Yongin", "Bucheon", "Ansan"],
      population: 13530000,
      area: 10183
    }
  ],

  // Spain - Autonomous Communities (Comunidades Autónomas)
  ES: [
    {
      id: "madrid",
      name: "Community of Madrid",
      capital: "Madrid",
      capitalCoordinates: { lat: 40.4168, lng: -3.7038 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "es",
      majorCities: ["Madrid", "Móstoles", "Alcalá de Henares", "Getafe"],
      population: 6779888,
      area: 8028
    },
    {
      id: "catalonia",
      name: "Catalonia (Catalunya)",
      capital: "Barcelona",
      capitalCoordinates: { lat: 41.3851, lng: 2.1734 },
      flag: "🟡🔴",
      flagEmoji: "🟡🔴",
      language: "es",
      languages: ["es", "ca"],
      majorCities: ["Barcelona", "Hospitalet", "Badalona", "Terrassa", "Tarragona"],
      population: 7780479,
      area: 32113
    },
    {
      id: "andalusia",
      name: "Andalusia (Andalucía)",
      capital: "Seville",
      capitalCoordinates: { lat: 37.3891, lng: -5.9845 },
      flag: "🌻",
      flagEmoji: "🌻",
      language: "es",
      majorCities: ["Seville", "Málaga", "Córdoba", "Granada", "Almería"],
      population: 8464411,
      area: 87268
    }
  ],

  // Italy - Regions (Regioni)
  IT: [
    {
      id: "lazio",
      name: "Lazio",
      capital: "Rome",
      capitalCoordinates: { lat: 41.9028, lng: 12.4964 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "it",
      majorCities: ["Rome", "Latina", "Fiumicino", "Viterbo"],
      population: 5879082,
      area: 17232
    },
    {
      id: "lombardy",
      name: "Lombardy (Lombardia)",
      capital: "Milan",
      capitalCoordinates: { lat: 45.4642, lng: 9.1900 },
      flag: "🏢",
      flagEmoji: "🏢",
      language: "it",
      majorCities: ["Milan", "Brescia", "Bergamo", "Monza", "Como"],
      population: 10027602,
      area: 23844
    },
    {
      id: "veneto",
      name: "Veneto",
      capital: "Venice",
      capitalCoordinates: { lat: 45.4408, lng: 12.3155 },
      flag: "🦁",
      flagEmoji: "🦁",
      language: "it",
      majorCities: ["Venice", "Verona", "Padua", "Vicenza", "Treviso"],
      population: 4906210,
      area: 18399
    }
  ],

  // Argentina - Provincias (Provinces)
  AR: [
    {
      id: "buenos-aires",
      name: "Buenos Aires Province",
      capital: "La Plata",
      capitalCoordinates: { lat: -34.9214, lng: -57.9545 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "es",
      majorCities: ["La Plata", "Mar del Plata", "Bahía Blanca", "Tandil", "Quilmes"],
      population: 17541141,
      area: 307571
    },
    {
      id: "caba",
      name: "Buenos Aires City (CABA)",
      capital: "Buenos Aires",
      capitalCoordinates: { lat: -34.6037, lng: -58.3816 },
      flag: "🌆",
      flagEmoji: "🌆",
      language: "es",
      majorCities: ["Buenos Aires", "Palermo", "Recoleta", "San Telmo"],
      population: 3075646,
      area: 203
    },
    {
      id: "cordoba",
      name: "Córdoba",
      capital: "Córdoba",
      capitalCoordinates: { lat: -31.4201, lng: -64.1888 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "es",
      majorCities: ["Córdoba", "Villa Carlos Paz", "Río Cuarto", "Villa María"],
      population: 3760450,
      area: 165321
    },
    {
      id: "santa-fe",
      name: "Santa Fe",
      capital: "Santa Fe",
      capitalCoordinates: { lat: -31.6333, lng: -60.7000 },
      flag: "🌾",
      flagEmoji: "🌾",
      language: "es",
      majorCities: ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto"],
      population: 3536418,
      area: 133007
    },
    {
      id: "mendoza",
      name: "Mendoza",
      capital: "Mendoza",
      capitalCoordinates: { lat: -32.8908, lng: -68.8272 },
      flag: "🍇",
      flagEmoji: "🍇",
      language: "es",
      majorCities: ["Mendoza", "San Rafael", "Godoy Cruz", "Las Heras"],
      population: 1990338,
      area: 148827
    },
    {
      id: "tucuman",
      name: "Tucumán",
      capital: "San Miguel de Tucumán",
      capitalCoordinates: { lat: -26.8083, lng: -65.2176 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "es",
      majorCities: ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo"],
      population: 1687305,
      area: 22524
    }
  ],

  // Poland - Województwa (Voivodeships)
  PL: [
    {
      id: "mazowieckie",
      name: "Masovian (Mazowieckie)",
      capital: "Warsaw",
      capitalCoordinates: { lat: 52.2297, lng: 21.0122 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "pl",
      majorCities: ["Warsaw", "Radom", "Płock", "Siedlce", "Pruszków"],
      population: 5428031,
      area: 35558
    },
    {
      id: "malopolskie",
      name: "Lesser Poland (Małopolskie)",
      capital: "Kraków",
      capitalCoordinates: { lat: 50.0647, lng: 19.9450 },
      flag: "🦅",
      flagEmoji: "🦅",
      language: "pl",
      majorCities: ["Kraków", "Tarnów", "Nowy Sącz", "Oświęcim"],
      population: 3410901,
      area: 15183
    },
    {
      id: "slaskie",
      name: "Silesian (Śląskie)",
      capital: "Katowice",
      capitalCoordinates: { lat: 50.2649, lng: 19.0238 },
      flag: "⛏️",
      flagEmoji: "⛏️",
      language: "pl",
      majorCities: ["Katowice", "Częstochowa", "Sosnowiec", "Gliwice", "Zabrze"],
      population: 4517635,
      area: 12333
    },
    {
      id: "wielkopolskie",
      name: "Greater Poland (Wielkopolskie)",
      capital: "Poznań",
      capitalCoordinates: { lat: 52.4064, lng: 16.9252 },
      flag: "🦌",
      flagEmoji: "🦌",
      language: "pl",
      majorCities: ["Poznań", "Kalisz", "Konin", "Piła", "Ostrów Wielkopolski"],
      population: 3498733,
      area: 29826
    },
    {
      id: "pomorskie",
      name: "Pomeranian (Pomorskie)",
      capital: "Gdańsk",
      capitalCoordinates: { lat: 54.3520, lng: 18.6466 },
      flag: "⚓",
      flagEmoji: "⚓",
      language: "pl",
      majorCities: ["Gdańsk", "Gdynia", "Sopot", "Słupsk", "Tczew"],
      population: 2346671,
      area: 18310
    },
    {
      id: "dolnoslaskie",
      name: "Lower Silesian (Dolnośląskie)",
      capital: "Wrocław",
      capitalCoordinates: { lat: 51.1079, lng: 17.0385 },
      flag: "🏰",
      flagEmoji: "🏰",
      language: "pl",
      majorCities: ["Wrocław", "Wałbrzych", "Legnica", "Jelenia Góra"],
      population: 2901225,
      area: 19947
    }
  ],

  // Ukraine - Oblasts (Regions)
  UA: [
    {
      id: "kyiv-city",
      name: "Kyiv City",
      capital: "Kyiv",
      capitalCoordinates: { lat: 50.4501, lng: 30.5234 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "uk",
      majorCities: ["Kyiv"],
      population: 2962180,
      area: 839
    },
    {
      id: "kyiv-oblast",
      name: "Kyiv Oblast",
      capital: "Kyiv",
      capitalCoordinates: { lat: 50.4501, lng: 30.5234 },
      flag: "🌻",
      flagEmoji: "🌻",
      language: "uk",
      majorCities: ["Bila Tserkva", "Brovary", "Boryspil", "Irpin", "Bucha"],
      population: 1781044,
      area: 28131
    },
    {
      id: "lviv",
      name: "Lviv Oblast",
      capital: "Lviv",
      capitalCoordinates: { lat: 49.8397, lng: 24.0297 },
      flag: "🦁",
      flagEmoji: "🦁",
      language: "uk",
      majorCities: ["Lviv", "Drohobych", "Stryi", "Chervonohrad"],
      population: 2512084,
      area: 21833
    },
    {
      id: "odesa",
      name: "Odesa Oblast",
      capital: "Odesa",
      capitalCoordinates: { lat: 46.4825, lng: 30.7233 },
      flag: "⚓",
      flagEmoji: "⚓",
      language: "uk",
      majorCities: ["Odesa", "Izmail", "Chornomorsk", "Bilhorod-Dnistrovskyi"],
      population: 2377230,
      area: 33310
    },
    {
      id: "kharkiv",
      name: "Kharkiv Oblast",
      capital: "Kharkiv",
      capitalCoordinates: { lat: 49.9935, lng: 36.2304 },
      flag: "🏭",
      flagEmoji: "🏭",
      language: "uk",
      majorCities: ["Kharkiv", "Izium", "Lozova", "Chuhuiv"],
      population: 2658461,
      area: 31415
    },
    {
      id: "dnipropetrovsk",
      name: "Dnipropetrovsk Oblast",
      capital: "Dnipro",
      capitalCoordinates: { lat: 48.4647, lng: 35.0462 },
      flag: "🏗️",
      flagEmoji: "🏗️",
      language: "uk",
      majorCities: ["Dnipro", "Kryvyi Rih", "Kamianske", "Nikopol"],
      population: 3176648,
      area: 31914
    }
  ],

  // Cambodia - Provinces (Khaet)
  KH: [
    {
      id: "phnom-penh",
      name: "Phnom Penh",
      capital: "Phnom Penh",
      capitalCoordinates: { lat: 11.5564, lng: 104.9282 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "km",
      majorCities: ["Phnom Penh"],
      population: 2129371,
      area: 679
    },
    {
      id: "siem-reap",
      name: "Siem Reap",
      capital: "Siem Reap",
      capitalCoordinates: { lat: 13.3633, lng: 103.8564 },
      flag: "🛕",
      flagEmoji: "🛕",
      language: "km",
      majorCities: ["Siem Reap"],
      population: 1014234,
      area: 10299
    }
  ],

  // Myanmar - States and Regions
  MM: [
    {
      id: "yangon",
      name: "Yangon Region",
      capital: "Yangon",
      capitalCoordinates: { lat: 16.8661, lng: 96.1951 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "my",
      majorCities: ["Yangon", "Thanlyin", "Insein"],
      population: 7360703,
      area: 10170
    },
    {
      id: "mandalay",
      name: "Mandalay Region",
      capital: "Mandalay",
      capitalCoordinates: { lat: 21.9588, lng: 96.0891 },
      flag: "🏯",
      flagEmoji: "🏯",
      language: "my",
      majorCities: ["Mandalay", "Amarapura", "Meiktila"],
      population: 6165723,
      area: 37024
    }
  ],

  // Laos - Provinces (Khoueng)
  LA: [
    {
      id: "vientiane-capital",
      name: "Vientiane Capital",
      capital: "Vientiane",
      capitalCoordinates: { lat: 17.9757, lng: 102.6331 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "lo",
      majorCities: ["Vientiane"],
      population: 997900,
      area: 3920
    },
    {
      id: "luang-prabang",
      name: "Luang Prabang",
      capital: "Luang Prabang",
      capitalCoordinates: { lat: 19.8866, lng: 102.1347 },
      flag: "🛕",
      flagEmoji: "🛕",
      language: "lo",
      majorCities: ["Luang Prabang"],
      population: 475573,
      area: 16875
    }
  ],

  // Nepal - Provinces
  NP: [
    {
      id: "bagmati",
      name: "Bagmati Province",
      capital: "Hetauda",
      capitalCoordinates: { lat: 27.4231, lng: 85.0322 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "ne",
      majorCities: ["Kathmandu", "Lalitpur", "Bhaktapur", "Hetauda"],
      population: 6084042,
      area: 20300
    },
    {
      id: "gandaki",
      name: "Gandaki Province",
      capital: "Pokhara",
      capitalCoordinates: { lat: 28.2096, lng: 83.9856 },
      flag: "⛰️",
      flagEmoji: "⛰️",
      language: "ne",
      majorCities: ["Pokhara", "Gorkha", "Damauli"],
      population: 2479745,
      area: 21773
    },
    {
      id: "lumbini",
      name: "Lumbini Province",
      capital: "Deukhuri",
      capitalCoordinates: { lat: 27.9008, lng: 82.4502 },
      flag: "🛕",
      flagEmoji: "🛕",
      language: "ne",
      majorCities: ["Butwal", "Siddharthanagar", "Nepalgunj"],
      population: 5124225,
      area: 22288
    }
  ],

  // Sri Lanka - Provinces
  LK: [
    {
      id: "western",
      name: "Western Province",
      capital: "Colombo",
      capitalCoordinates: { lat: 6.9271, lng: 79.8612 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "si",
      languages: ["si", "ta", "en"],
      majorCities: ["Colombo", "Sri Jayawardenepura Kotte", "Moratuwa", "Negombo"],
      population: 5851130,
      area: 3684
    },
    {
      id: "central",
      name: "Central Province",
      capital: "Kandy",
      capitalCoordinates: { lat: 7.2906, lng: 80.6337 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "si",
      majorCities: ["Kandy", "Nuwara Eliya", "Matale"],
      population: 2571557,
      area: 5674
    },
    {
      id: "southern",
      name: "Southern Province",
      capital: "Galle",
      capitalCoordinates: { lat: 6.0535, lng: 80.2210 },
      flag: "🏖️",
      flagEmoji: "🏖️",
      language: "si",
      majorCities: ["Galle", "Matara", "Hambantota"],
      population: 2477285,
      area: 5544
    }
  ],

  // Mexico - Estados (States)
  MX: [
    {
      id: "mexico-city",
      name: "Mexico City (CDMX)",
      capital: "Mexico City",
      capitalCoordinates: { lat: 19.4326, lng: -99.1332 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "es",
      majorCities: ["Mexico City", "Iztapalapa", "Ecatepec", "Gustavo A. Madero"],
      population: 21804515,
      area: 1485
    },
    {
      id: "jalisco",
      name: "Jalisco",
      capital: "Guadalajara",
      capitalCoordinates: { lat: 20.6597, lng: -103.3496 },
      flag: "🌮",
      flagEmoji: "🌮",
      language: "es",
      majorCities: ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta"],
      population: 8348151,
      area: 78599
    },
    {
      id: "nuevo-leon",
      name: "Nuevo León",
      capital: "Monterrey",
      capitalCoordinates: { lat: 25.6866, lng: -100.3161 },
      flag: "🏭",
      flagEmoji: "🏭",
      language: "es",
      majorCities: ["Monterrey", "Guadalupe", "San Nicolás", "Apodaca", "Santa Catarina"],
      population: 5784442,
      area: 64220
    },
    {
      id: "estado-de-mexico",
      name: "State of Mexico",
      capital: "Toluca",
      capitalCoordinates: { lat: 19.2826, lng: -99.6557 },
      flag: "🌋",
      flagEmoji: "🌋",
      language: "es",
      majorCities: ["Ecatepec", "Nezahualcóyotl", "Toluca", "Naucalpan", "Tlalnepantla"],
      population: 16992418,
      area: 22357
    },
    {
      id: "veracruz",
      name: "Veracruz",
      capital: "Xalapa",
      capitalCoordinates: { lat: 19.5438, lng: -96.9102 },
      flag: "⚓",
      flagEmoji: "⚓",
      language: "es",
      majorCities: ["Veracruz", "Xalapa", "Coatzacoalcos", "Córdoba", "Boca del Río"],
      population: 8112505,
      area: 71820
    },
    {
      id: "puebla",
      name: "Puebla",
      capital: "Puebla",
      capitalCoordinates: { lat: 19.0414, lng: -98.2063 },
      flag: "🏺",
      flagEmoji: "🏺",
      language: "es",
      majorCities: ["Puebla", "Tehuacán", "San Martín Texmelucan", "Atlixco"],
      population: 6583278,
      area: 34306
    },
    {
      id: "quintana-roo",
      name: "Quintana Roo",
      capital: "Chetumal",
      capitalCoordinates: { lat: 18.5001, lng: -88.2965 },
      flag: "🏖️",
      flagEmoji: "🏖️",
      language: "es",
      majorCities: ["Cancún", "Playa del Carmen", "Chetumal", "Cozumel", "Tulum"],
      population: 1857985,
      area: 42361
    },
    {
      id: "yucatan",
      name: "Yucatán",
      capital: "Mérida",
      capitalCoordinates: { lat: 20.9674, lng: -89.5926 },
      flag: "🦜",
      flagEmoji: "🦜",
      language: "es",
      majorCities: ["Mérida", "Valladolid", "Tizimín", "Progreso"],
      population: 2320898,
      area: 39612
    }
  ],

  // Indonesia - Provinsi (Provinces)
  ID: [
    {
      id: "jakarta",
      name: "DKI Jakarta",
      capital: "Jakarta",
      capitalCoordinates: { lat: -6.2088, lng: 106.8456 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "id",
      majorCities: ["Jakarta", "South Jakarta", "East Jakarta", "West Jakarta", "North Jakarta"],
      population: 10562088,
      area: 664
    },
    {
      id: "west-java",
      name: "West Java (Jawa Barat)",
      capital: "Bandung",
      capitalCoordinates: { lat: -6.9175, lng: 107.6191 },
      flag: "🌋",
      flagEmoji: "🌋",
      language: "id",
      languages: ["id", "su"],
      majorCities: ["Bandung", "Bekasi", "Depok", "Bogor", "Cirebon", "Karawang"],
      population: 49935858,
      area: 35377
    },
    {
      id: "east-java",
      name: "East Java (Jawa Timur)",
      capital: "Surabaya",
      capitalCoordinates: { lat: -7.2575, lng: 112.7521 },
      flag: "🦈",
      flagEmoji: "🦈",
      language: "id",
      languages: ["id", "jv"],
      majorCities: ["Surabaya", "Malang", "Sidoarjo", "Kediri", "Jember"],
      population: 40665696,
      area: 47922
    },
    {
      id: "central-java",
      name: "Central Java (Jawa Tengah)",
      capital: "Semarang",
      capitalCoordinates: { lat: -6.9666, lng: 110.4196 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "id",
      languages: ["id", "jv"],
      majorCities: ["Semarang", "Solo", "Surakarta", "Pekalongan", "Magelang"],
      population: 36516035,
      area: 32544
    },
    {
      id: "bali",
      name: "Bali",
      capital: "Denpasar",
      capitalCoordinates: { lat: -8.6705, lng: 115.2126 },
      flag: "🏝️",
      flagEmoji: "🏝️",
      language: "id",
      languages: ["id", "ban"],
      majorCities: ["Denpasar", "Singaraja", "Ubud", "Kuta", "Sanur"],
      population: 4317404,
      area: 5780
    },
    {
      id: "north-sumatra",
      name: "North Sumatra (Sumatera Utara)",
      capital: "Medan",
      capitalCoordinates: { lat: 3.5952, lng: 98.6722 },
      flag: "🌴",
      flagEmoji: "🌴",
      language: "id",
      majorCities: ["Medan", "Binjai", "Pematangsiantar", "Tanjungbalai"],
      population: 14799361,
      area: 72981
    },
    {
      id: "south-sulawesi",
      name: "South Sulawesi (Sulawesi Selatan)",
      capital: "Makassar",
      capitalCoordinates: { lat: -5.1477, lng: 119.4327 },
      flag: "🌊",
      flagEmoji: "🌊",
      language: "id",
      majorCities: ["Makassar", "Parepare", "Palopo", "Maros"],
      population: 9073509,
      area: 46717
    },
    {
      id: "yogyakarta",
      name: "Yogyakarta (DIY)",
      capital: "Yogyakarta",
      capitalCoordinates: { lat: -7.7956, lng: 110.3695 },
      flag: "👑",
      flagEmoji: "👑",
      language: "id",
      languages: ["id", "jv"],
      majorCities: ["Yogyakarta", "Sleman", "Bantul"],
      population: 3842932,
      area: 3133
    }
  ],

  // South Africa - Provinces
  ZA: [
    {
      id: "gauteng",
      name: "Gauteng",
      capital: "Johannesburg",
      capitalCoordinates: { lat: -26.2041, lng: 28.0473 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "en",
      languages: ["en", "zu", "af", "st"],
      majorCities: ["Johannesburg", "Pretoria", "Soweto", "Sandton", "Centurion", "Midrand"],
      population: 15810388,
      area: 18176
    },
    {
      id: "western-cape",
      name: "Western Cape",
      capital: "Cape Town",
      capitalCoordinates: { lat: -33.9249, lng: 18.4241 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "af",
      languages: ["af", "en", "xh"],
      majorCities: ["Cape Town", "Stellenbosch", "Paarl", "George", "Worcester"],
      population: 7005741,
      area: 129462
    },
    {
      id: "kwazulu-natal",
      name: "KwaZulu-Natal",
      capital: "Pietermaritzburg",
      capitalCoordinates: { lat: -29.6006, lng: 30.3794 },
      flag: "🦁",
      flagEmoji: "🦁",
      language: "zu",
      languages: ["zu", "en"],
      majorCities: ["Durban", "Pietermaritzburg", "Newcastle", "Richards Bay", "Ladysmith"],
      population: 11513575,
      area: 94361
    },
    {
      id: "eastern-cape",
      name: "Eastern Cape",
      capital: "Bhisho",
      capitalCoordinates: { lat: -32.8494, lng: 27.4367 },
      flag: "🌊",
      flagEmoji: "🌊",
      language: "xh",
      languages: ["xh", "af", "en"],
      majorCities: ["Port Elizabeth", "East London", "Mthatha", "Bhisho"],
      population: 6734001,
      area: 168966
    },
    {
      id: "limpopo",
      name: "Limpopo",
      capital: "Polokwane",
      capitalCoordinates: { lat: -23.9045, lng: 29.4689 },
      flag: "🌿",
      flagEmoji: "🌿",
      language: "st",
      languages: ["st", "tn", "ve", "en"],
      majorCities: ["Polokwane", "Tzaneen", "Mokopane", "Thohoyandou"],
      population: 5982584,
      area: 125754
    },
    {
      id: "mpumalanga",
      name: "Mpumalanga",
      capital: "Mbombela",
      capitalCoordinates: { lat: -25.4753, lng: 30.9694 },
      flag: "🌄",
      flagEmoji: "🌄",
      language: "ss",
      languages: ["ss", "zu", "en"],
      majorCities: ["Mbombela", "Secunda", "Witbank", "Middelburg"],
      population: 4679786,
      area: 76495
    },
    {
      id: "free-state",
      name: "Free State",
      capital: "Bloemfontein",
      capitalCoordinates: { lat: -29.0852, lng: 26.1596 },
      flag: "🌻",
      flagEmoji: "🌻",
      language: "st",
      languages: ["st", "af", "en"],
      majorCities: ["Bloemfontein", "Welkom", "Bethlehem", "Kroonstad"],
      population: 2928903,
      area: 129825
    },
    {
      id: "north-west",
      name: "North West",
      capital: "Mahikeng",
      capitalCoordinates: { lat: -25.8652, lng: 25.6444 },
      flag: "⛏️",
      flagEmoji: "⛏️",
      language: "tn",
      languages: ["tn", "af", "en"],
      majorCities: ["Rustenburg", "Mahikeng", "Klerksdorp", "Potchefstroom"],
      population: 4108816,
      area: 104882
    },
    {
      id: "northern-cape",
      name: "Northern Cape",
      capital: "Kimberley",
      capitalCoordinates: { lat: -28.7282, lng: 24.7499 },
      flag: "💎",
      flagEmoji: "💎",
      language: "af",
      languages: ["af", "en", "tn"],
      majorCities: ["Kimberley", "Upington", "Springbok", "De Aar"],
      population: 1292786,
      area: 372889
    }
  ],

  // Turkey - İller (Provinces) / Bölgeler (Regions)
  TR: [
    {
      id: "istanbul",
      name: "Istanbul (İstanbul)",
      capital: "Istanbul",
      capitalCoordinates: { lat: 41.0082, lng: 28.9784 },
      flag: "🕌",
      flagEmoji: "🕌",
      language: "tr",
      majorCities: ["Istanbul", "Kadıköy", "Üsküdar", "Beşiktaş", "Fatih", "Bakırköy"],
      population: 15840900,
      area: 5343
    },
    {
      id: "ankara",
      name: "Ankara",
      capital: "Ankara",
      capitalCoordinates: { lat: 39.9334, lng: 32.8597 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "tr",
      majorCities: ["Ankara", "Çankaya", "Keçiören", "Yenimahalle", "Mamak"],
      population: 5747325,
      area: 25632
    },
    {
      id: "izmir",
      name: "Izmir (İzmir)",
      capital: "Izmir",
      capitalCoordinates: { lat: 38.4192, lng: 27.1287 },
      flag: "⚓",
      flagEmoji: "⚓",
      language: "tr",
      majorCities: ["Izmir", "Konak", "Karşıyaka", "Bornova", "Buca"],
      population: 4425789,
      area: 12012
    },
    {
      id: "antalya",
      name: "Antalya",
      capital: "Antalya",
      capitalCoordinates: { lat: 36.8969, lng: 30.7133 },
      flag: "🏖️",
      flagEmoji: "🏖️",
      language: "tr",
      majorCities: ["Antalya", "Alanya", "Manavgat", "Serik", "Kemer"],
      population: 2619832,
      area: 20177
    },
    {
      id: "bursa",
      name: "Bursa",
      capital: "Bursa",
      capitalCoordinates: { lat: 40.1885, lng: 29.0610 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "tr",
      majorCities: ["Bursa", "Nilüfer", "Osmangazi", "İnegöl", "Yıldırım"],
      population: 3147818,
      area: 10813
    },
    {
      id: "adana",
      name: "Adana",
      capital: "Adana",
      capitalCoordinates: { lat: 37.0017, lng: 35.3289 },
      flag: "🌾",
      flagEmoji: "🌾",
      language: "tr",
      majorCities: ["Adana", "Seyhan", "Yüreğir", "Çukurova", "Ceyhan"],
      population: 2274106,
      area: 13844
    },
    {
      id: "konya",
      name: "Konya",
      capital: "Konya",
      capitalCoordinates: { lat: 37.8746, lng: 32.4932 },
      flag: "🌀",
      flagEmoji: "🌀",
      language: "tr",
      majorCities: ["Konya", "Selçuklu", "Meram", "Karatay", "Ereğli"],
      population: 2296347,
      area: 41001
    },
    {
      id: "gaziantep",
      name: "Gaziantep",
      capital: "Gaziantep",
      capitalCoordinates: { lat: 37.0662, lng: 37.3833 },
      flag: "🥙",
      flagEmoji: "🥙",
      language: "tr",
      majorCities: ["Gaziantep", "Şahinbey", "Şehitkamil", "Nizip"],
      population: 2130432,
      area: 6887
    }
  ],

  // India - States (adding here for completeness)
  IN: [
    {
      id: "maharashtra",
      name: "Maharashtra",
      capital: "Mumbai",
      capitalCoordinates: { lat: 19.0760, lng: 72.8777 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "mr",
      languages: ["mr", "hi", "en"],
      majorCities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
      population: 123144223,
      area: 307713
    },
    {
      id: "karnataka",
      name: "Karnataka",
      capital: "Bengaluru",
      capitalCoordinates: { lat: 12.9716, lng: 77.5946 },
      flag: "🐘",
      flagEmoji: "🐘",
      language: "kn",
      languages: ["kn", "en"],
      majorCities: ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belgaum"],
      population: 67562686,
      area: 191791
    },
    {
      id: "tamil-nadu",
      name: "Tamil Nadu",
      capital: "Chennai",
      capitalCoordinates: { lat: 13.0827, lng: 80.2707 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "ta",
      languages: ["ta", "en"],
      majorCities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
      population: 77841267,
      area: 130058
    },
    {
      id: "uttar-pradesh",
      name: "Uttar Pradesh",
      capital: "Lucknow",
      capitalCoordinates: { lat: 26.8467, lng: 80.9462 },
      flag: "🕌",
      flagEmoji: "🕌",
      language: "hi",
      languages: ["hi", "ur"],
      majorCities: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida", "Allahabad"],
      population: 231502578,
      area: 240928
    },
    {
      id: "west-bengal",
      name: "West Bengal",
      capital: "Kolkata",
      capitalCoordinates: { lat: 22.5726, lng: 88.3639 },
      flag: "🌸",
      flagEmoji: "🌸",
      language: "bn",
      languages: ["bn", "en"],
      majorCities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
      population: 99609303,
      area: 88752
    },
    {
      id: "gujarat",
      name: "Gujarat",
      capital: "Gandhinagar",
      capitalCoordinates: { lat: 23.2156, lng: 72.6369 },
      flag: "🦁",
      flagEmoji: "🦁",
      language: "gu",
      languages: ["gu", "hi", "en"],
      majorCities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
      population: 63872399,
      area: 196024
    },
    {
      id: "rajasthan",
      name: "Rajasthan",
      capital: "Jaipur",
      capitalCoordinates: { lat: 26.9124, lng: 75.7873 },
      flag: "🏰",
      flagEmoji: "🏰",
      language: "hi",
      majorCities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
      population: 79502477,
      area: 342239
    },
    {
      id: "kerala",
      name: "Kerala",
      capital: "Thiruvananthapuram",
      capitalCoordinates: { lat: 8.5241, lng: 76.9366 },
      flag: "🌴",
      flagEmoji: "🌴",
      language: "ml",
      languages: ["ml", "en"],
      majorCities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
      population: 35699443,
      area: 38863
    },
    {
      id: "delhi",
      name: "Delhi",
      capital: "New Delhi",
      capitalCoordinates: { lat: 28.6139, lng: 77.2090 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "hi",
      languages: ["hi", "en", "pa", "ur"],
      majorCities: ["New Delhi", "Delhi", "Dwarka", "Rohini"],
      population: 18710922,
      area: 1484
    },
    {
      id: "goa",
      name: "Goa",
      capital: "Panaji",
      capitalCoordinates: { lat: 15.4909, lng: 73.8278 },
      flag: "🏖️",
      flagEmoji: "🏖️",
      language: "kok",
      languages: ["kok", "mr", "en"],
      majorCities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
      population: 1586250,
      area: 3702
    }
  ],

  // Pakistan - Provinces (Sūbā)
  PK: [
    {
      id: "punjab",
      name: "Punjab",
      capital: "Lahore",
      capitalCoordinates: { lat: 31.5204, lng: 74.3587 },
      flag: "🌾",
      flagEmoji: "🌾",
      language: "pa",
      languages: ["pa", "ur", "en"],
      majorCities: ["Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Multan", "Sialkot"],
      population: 110012442,
      area: 205344
    },
    {
      id: "sindh",
      name: "Sindh",
      capital: "Karachi",
      capitalCoordinates: { lat: 24.8607, lng: 67.0011 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "sd",
      languages: ["sd", "ur", "en"],
      majorCities: ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah"],
      population: 47886051,
      area: 140914
    },
    {
      id: "khyber-pakhtunkhwa",
      name: "Khyber Pakhtunkhwa",
      capital: "Peshawar",
      capitalCoordinates: { lat: 34.0151, lng: 71.5249 },
      flag: "⛰️",
      flagEmoji: "⛰️",
      language: "ps",
      languages: ["ps", "ur"],
      majorCities: ["Peshawar", "Mardan", "Abbottabad", "Swat", "Dera Ismail Khan"],
      population: 35525047,
      area: 101741
    },
    {
      id: "balochistan",
      name: "Balochistan",
      capital: "Quetta",
      capitalCoordinates: { lat: 30.1798, lng: 66.9750 },
      flag: "🏜️",
      flagEmoji: "🏜️",
      language: "bal",
      languages: ["bal", "ps", "ur"],
      majorCities: ["Quetta", "Gwadar", "Turbat", "Khuzdar", "Hub"],
      population: 12344408,
      area: 347190
    },
    {
      id: "islamabad",
      name: "Islamabad Capital Territory",
      capital: "Islamabad",
      capitalCoordinates: { lat: 33.6844, lng: 73.0479 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "ur",
      languages: ["ur", "en"],
      majorCities: ["Islamabad"],
      population: 2006572,
      area: 906
    },
    {
      id: "gilgit-baltistan",
      name: "Gilgit-Baltistan",
      capital: "Gilgit",
      capitalCoordinates: { lat: 35.9208, lng: 74.3144 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "ur",
      languages: ["shi", "bal", "ur"],
      majorCities: ["Gilgit", "Skardu", "Chilas", "Hunza", "Khaplu"],
      population: 1800000,
      area: 72971
    },
    {
      id: "azad-kashmir",
      name: "Azad Jammu & Kashmir",
      capital: "Muzaffarabad",
      capitalCoordinates: { lat: 34.3700, lng: 73.4700 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "ur",
      languages: ["ur", "hi", "pa"],
      majorCities: ["Muzaffarabad", "Mirpur", "Bhimber", "Kotli", "Rawalakot"],
      population: 4045366,
      area: 13297
    }
  ],

  // Nigeria - States
  NG: [
    {
      id: "lagos",
      name: "Lagos",
      capital: "Ikeja",
      capitalCoordinates: { lat: 6.6018, lng: 3.3515 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "yo",
      languages: ["yo", "en"],
      majorCities: ["Lagos", "Ikeja", "Victoria Island", "Lekki", "Ikorodu"],
      population: 14862111,
      area: 3577
    },
    {
      id: "abuja-fct",
      name: "Federal Capital Territory",
      capital: "Abuja",
      capitalCoordinates: { lat: 9.0765, lng: 7.3986 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "en",
      majorCities: ["Abuja", "Gwagwalada", "Kuje"],
      population: 3564126,
      area: 7315
    },
    {
      id: "kano",
      name: "Kano",
      capital: "Kano",
      capitalCoordinates: { lat: 12.0022, lng: 8.5920 },
      flag: "🕌",
      flagEmoji: "🕌",
      language: "ha",
      languages: ["ha", "en"],
      majorCities: ["Kano", "Wudil", "Rano"],
      population: 13076892,
      area: 20131
    },
    {
      id: "rivers",
      name: "Rivers",
      capital: "Port Harcourt",
      capitalCoordinates: { lat: 4.8156, lng: 7.0498 },
      flag: "🛢️",
      flagEmoji: "🛢️",
      language: "en",
      majorCities: ["Port Harcourt", "Obio-Akpor", "Bonny"],
      population: 7303924,
      area: 11077
    },
    {
      id: "oyo",
      name: "Oyo",
      capital: "Ibadan",
      capitalCoordinates: { lat: 7.3775, lng: 3.9470 },
      flag: "🌿",
      flagEmoji: "🌿",
      language: "yo",
      languages: ["yo", "en"],
      majorCities: ["Ibadan", "Ogbomoso", "Oyo"],
      population: 7840864,
      area: 28454
    },
    {
      id: "kaduna",
      name: "Kaduna",
      capital: "Kaduna",
      capitalCoordinates: { lat: 10.5222, lng: 7.4383 },
      flag: "🏭",
      flagEmoji: "🏭",
      language: "ha",
      languages: ["ha", "en"],
      majorCities: ["Kaduna", "Zaria", "Kafanchan"],
      population: 8252366,
      area: 46053
    }
  ],

  // Egypt - Governorates (Muhafazat)
  EG: [
    {
      id: "cairo",
      name: "Cairo",
      capital: "Cairo",
      capitalCoordinates: { lat: 30.0444, lng: 31.2357 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "ar",
      majorCities: ["Cairo", "Helwan", "Nasr City", "Maadi", "Zamalek"],
      population: 10025657,
      area: 3085
    },
    {
      id: "giza",
      name: "Giza",
      capital: "Giza",
      capitalCoordinates: { lat: 30.0131, lng: 31.2089 },
      flag: "🔺",
      flagEmoji: "🔺",
      language: "ar",
      majorCities: ["Giza", "6th of October City", "Sheikh Zayed City"],
      population: 8632021,
      area: 85153
    },
    {
      id: "alexandria",
      name: "Alexandria",
      capital: "Alexandria",
      capitalCoordinates: { lat: 31.2001, lng: 29.9187 },
      flag: "⚓",
      flagEmoji: "⚓",
      language: "ar",
      majorCities: ["Alexandria", "Borg El Arab"],
      population: 5200000,
      area: 2879
    },
    {
      id: "luxor",
      name: "Luxor",
      capital: "Luxor",
      capitalCoordinates: { lat: 25.6872, lng: 32.6396 },
      flag: "🏺",
      flagEmoji: "🏺",
      language: "ar",
      majorCities: ["Luxor", "Karnak"],
      population: 1300000,
      area: 2960
    },
    {
      id: "red-sea",
      name: "Red Sea",
      capital: "Hurghada",
      capitalCoordinates: { lat: 27.2579, lng: 33.8116 },
      flag: "🏖️",
      flagEmoji: "🏖️",
      language: "ar",
      majorCities: ["Hurghada", "Sharm El Sheikh", "Marsa Alam"],
      population: 359888,
      area: 203685
    },
    {
      id: "aswan",
      name: "Aswan",
      capital: "Aswan",
      capitalCoordinates: { lat: 24.0889, lng: 32.8998 },
      flag: "🌊",
      flagEmoji: "🌊",
      language: "ar",
      majorCities: ["Aswan", "Abu Simbel"],
      population: 1568000,
      area: 679
    }
  ],

  // Bangladesh - Divisions (Bibhag)
  BD: [
    {
      id: "dhaka-division",
      name: "Dhaka",
      capital: "Dhaka",
      capitalCoordinates: { lat: 23.8103, lng: 90.4125 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "bn",
      majorCities: ["Dhaka", "Narayanganj", "Gazipur", "Tangail"],
      population: 39000000,
      area: 20593
    },
    {
      id: "chittagong",
      name: "Chittagong",
      capital: "Chittagong",
      capitalCoordinates: { lat: 22.3569, lng: 91.7832 },
      flag: "⚓",
      flagEmoji: "⚓",
      language: "bn",
      majorCities: ["Chittagong", "Cox's Bazar", "Comilla"],
      population: 34000000,
      area: 33909
    },
    {
      id: "rajshahi",
      name: "Rajshahi",
      capital: "Rajshahi",
      capitalCoordinates: { lat: 24.3636, lng: 88.6241 },
      flag: "🌾",
      flagEmoji: "🌾",
      language: "bn",
      majorCities: ["Rajshahi", "Bogra", "Pabna"],
      population: 21000000,
      area: 18197
    },
    {
      id: "khulna",
      name: "Khulna",
      capital: "Khulna",
      capitalCoordinates: { lat: 22.8456, lng: 89.5403 },
      flag: "🌳",
      flagEmoji: "🌳",
      language: "bn",
      majorCities: ["Khulna", "Jessore", "Satkhira"],
      population: 18000000,
      area: 22285
    },
    {
      id: "sylhet",
      name: "Sylhet",
      capital: "Sylhet",
      capitalCoordinates: { lat: 24.8949, lng: 91.8687 },
      flag: "🍵",
      flagEmoji: "🍵",
      language: "bn",
      majorCities: ["Sylhet", "Moulvibazar", "Habiganj"],
      population: 11000000,
      area: 12635
    }
  ],

  // Thailand - Provinces (Changwat)
  TH: [
    {
      id: "bangkok",
      name: "Bangkok",
      capital: "Bangkok",
      capitalCoordinates: { lat: 13.7563, lng: 100.5018 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "th",
      majorCities: ["Bangkok", "Sukhumvit", "Silom", "Siam"],
      population: 10539000,
      area: 1568
    },
    {
      id: "chiang-mai",
      name: "Chiang Mai",
      capital: "Chiang Mai",
      capitalCoordinates: { lat: 18.7883, lng: 98.9853 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "th",
      majorCities: ["Chiang Mai", "Mae Hong Son"],
      population: 1780000,
      area: 20107
    },
    {
      id: "phuket",
      name: "Phuket",
      capital: "Phuket",
      capitalCoordinates: { lat: 7.8804, lng: 98.3923 },
      flag: "🏖️",
      flagEmoji: "🏖️",
      language: "th",
      majorCities: ["Phuket", "Patong", "Kata"],
      population: 417000,
      area: 576
    },
    {
      id: "chonburi",
      name: "Chonburi",
      capital: "Chonburi",
      capitalCoordinates: { lat: 13.3611, lng: 100.9847 },
      flag: "🏭",
      flagEmoji: "🏭",
      language: "th",
      majorCities: ["Chonburi", "Pattaya", "Si Racha"],
      population: 1559000,
      area: 4363
    }
  ],

  // Vietnam - Regions/Provinces
  VN: [
    {
      id: "hanoi",
      name: "Hanoi",
      capital: "Hanoi",
      capitalCoordinates: { lat: 21.0278, lng: 105.8342 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "vi",
      majorCities: ["Hanoi", "Long Bien", "Dong Da"],
      population: 8054000,
      area: 3359
    },
    {
      id: "ho-chi-minh",
      name: "Ho Chi Minh City",
      capital: "Ho Chi Minh City",
      capitalCoordinates: { lat: 10.8231, lng: 106.6297 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "vi",
      majorCities: ["Ho Chi Minh City", "District 1", "Thu Duc"],
      population: 8993000,
      area: 2095
    },
    {
      id: "da-nang",
      name: "Da Nang",
      capital: "Da Nang",
      capitalCoordinates: { lat: 16.0544, lng: 108.2022 },
      flag: "🏖️",
      flagEmoji: "🏖️",
      language: "vi",
      majorCities: ["Da Nang", "Hoi An"],
      population: 1134000,
      area: 1285
    }
  ],

  // Malaysia - States (Negeri)
  MY: [
    {
      id: "kuala-lumpur",
      name: "Kuala Lumpur",
      capital: "Kuala Lumpur",
      capitalCoordinates: { lat: 3.1390, lng: 101.6869 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "ms",
      languages: ["ms", "en", "zh", "ta"],
      majorCities: ["Kuala Lumpur", "KLCC", "Bukit Bintang"],
      population: 1980000,
      area: 243
    },
    {
      id: "selangor",
      name: "Selangor",
      capital: "Shah Alam",
      capitalCoordinates: { lat: 3.0733, lng: 101.5185 },
      flag: "🌴",
      flagEmoji: "🌴",
      language: "ms",
      majorCities: ["Shah Alam", "Petaling Jaya", "Klang", "Subang Jaya"],
      population: 6540000,
      area: 8104
    },
    {
      id: "penang",
      name: "Penang",
      capital: "George Town",
      capitalCoordinates: { lat: 5.4141, lng: 100.3288 },
      flag: "🏝️",
      flagEmoji: "🏝️",
      language: "ms",
      languages: ["ms", "en", "zh"],
      majorCities: ["George Town", "Butterworth", "Bayan Lepas"],
      population: 1780000,
      area: 1048
    },
    {
      id: "johor",
      name: "Johor",
      capital: "Johor Bahru",
      capitalCoordinates: { lat: 1.4927, lng: 103.7414 },
      flag: "👑",
      flagEmoji: "👑",
      language: "ms",
      majorCities: ["Johor Bahru", "Iskandar Puteri", "Kulai"],
      population: 3790000,
      area: 19210
    }
  ],

  // Philippines - Regions
  PH: [
    {
      id: "ncr",
      name: "Metro Manila (NCR)",
      capital: "Manila",
      capitalCoordinates: { lat: 14.5995, lng: 120.9842 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "tl",
      languages: ["tl", "en"],
      majorCities: ["Manila", "Quezon City", "Makati", "Taguig", "Pasig"],
      population: 13484000,
      area: 620
    },
    {
      id: "cebu",
      name: "Cebu",
      capital: "Cebu City",
      capitalCoordinates: { lat: 10.3157, lng: 123.8854 },
      flag: "🏝️",
      flagEmoji: "🏝️",
      language: "ceb",
      languages: ["ceb", "tl", "en"],
      majorCities: ["Cebu City", "Mandaue", "Lapu-Lapu"],
      population: 5000000,
      area: 5088
    },
    {
      id: "davao",
      name: "Davao Region",
      capital: "Davao City",
      capitalCoordinates: { lat: 7.1907, lng: 125.4553 },
      flag: "🦅",
      flagEmoji: "🦅",
      language: "ceb",
      languages: ["ceb", "tl", "en"],
      majorCities: ["Davao City", "Tagum", "Panabo"],
      population: 5230000,
      area: 20357
    }
  ],

  // Saudi Arabia - Regions (Mintaqah)
  SA: [
    {
      id: "riyadh-region",
      name: "Riyadh Region",
      capital: "Riyadh",
      capitalCoordinates: { lat: 24.7136, lng: 46.6753 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "ar",
      majorCities: ["Riyadh", "Kharj", "Diriyah"],
      population: 8216284,
      area: 412000
    },
    {
      id: "makkah-region",
      name: "Makkah Region",
      capital: "Mecca",
      capitalCoordinates: { lat: 21.3891, lng: 39.8579 },
      flag: "🕌",
      flagEmoji: "🕌",
      language: "ar",
      majorCities: ["Mecca", "Jeddah", "Taif"],
      population: 8557766,
      area: 153128
    },
    {
      id: "eastern-region",
      name: "Eastern Region",
      capital: "Dammam",
      capitalCoordinates: { lat: 26.4207, lng: 50.0888 },
      flag: "🛢️",
      flagEmoji: "🛢️",
      language: "ar",
      majorCities: ["Dammam", "Dhahran", "Al Khobar", "Jubail"],
      population: 4900325,
      area: 672522
    }
  ],

  // UAE - Emirates
  AE: [
    {
      id: "dubai",
      name: "Dubai",
      capital: "Dubai",
      capitalCoordinates: { lat: 25.2048, lng: 55.2708 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "ar",
      languages: ["ar", "en"],
      majorCities: ["Dubai", "Jumeirah", "Deira", "Downtown"],
      population: 3400800,
      area: 4114
    },
    {
      id: "abu-dhabi",
      name: "Abu Dhabi",
      capital: "Abu Dhabi",
      capitalCoordinates: { lat: 24.4539, lng: 54.3773 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "ar",
      languages: ["ar", "en"],
      majorCities: ["Abu Dhabi", "Al Ain", "Yas Island"],
      population: 2900000,
      area: 67340
    },
    {
      id: "sharjah",
      name: "Sharjah",
      capital: "Sharjah",
      capitalCoordinates: { lat: 25.3463, lng: 55.4209 },
      flag: "📚",
      flagEmoji: "📚",
      language: "ar",
      majorCities: ["Sharjah", "Khor Fakkan"],
      population: 1800000,
      area: 2590
    }
  ],

  // Iran - Ostans (Provinces)
  IR: [
    {
      id: "tehran",
      name: "Tehran",
      capital: "Tehran",
      capitalCoordinates: { lat: 35.6892, lng: 51.3890 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "fa",
      majorCities: ["Tehran", "Rey", "Karaj", "Shemiran"],
      population: 14160000,
      area: 18814
    },
    {
      id: "isfahan",
      name: "Isfahan",
      capital: "Isfahan",
      capitalCoordinates: { lat: 32.6546, lng: 51.6680 },
      flag: "🕌",
      flagEmoji: "🕌",
      language: "fa",
      majorCities: ["Isfahan", "Kashan", "Najafabad", "Khomeyni Shahr"],
      population: 5120850,
      area: 107018
    },
    {
      id: "fars",
      name: "Fars",
      capital: "Shiraz",
      capitalCoordinates: { lat: 29.5918, lng: 52.5836 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "fa",
      majorCities: ["Shiraz", "Marvdasht", "Kazerun", "Jahrom"],
      population: 4851274,
      area: 122608
    },
    {
      id: "khorasan-razavi",
      name: "Razavi Khorasan",
      capital: "Mashhad",
      capitalCoordinates: { lat: 36.2605, lng: 59.6168 },
      flag: "🕌",
      flagEmoji: "🕌",
      language: "fa",
      majorCities: ["Mashhad", "Neyshabur", "Sabzevar", "Torbat-e Heydarieh"],
      population: 6434501,
      area: 118851
    },
    {
      id: "khuzestan",
      name: "Khuzestan",
      capital: "Ahvaz",
      capitalCoordinates: { lat: 31.3183, lng: 48.6706 },
      flag: "🛢️",
      flagEmoji: "🛢️",
      language: "fa",
      languages: ["fa", "ar"],
      majorCities: ["Ahvaz", "Abadan", "Khorramshahr", "Dezful"],
      population: 4710509,
      area: 64055
    },
    {
      id: "east-azerbaijan",
      name: "East Azerbaijan",
      capital: "Tabriz",
      capitalCoordinates: { lat: 38.0800, lng: 46.2919 },
      flag: "⛰️",
      flagEmoji: "⛰️",
      language: "az",
      languages: ["az", "fa"],
      majorCities: ["Tabriz", "Maragheh", "Marand", "Ahar"],
      population: 3909652,
      area: 45651
    }
  ],

  // Iraq - Governorates (Muhafazat)
  IQ: [
    {
      id: "baghdad",
      name: "Baghdad",
      capital: "Baghdad",
      capitalCoordinates: { lat: 33.3152, lng: 44.3661 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "ar",
      majorCities: ["Baghdad", "Sadr City", "Kadhimiya"],
      population: 8126755,
      area: 4555
    },
    {
      id: "basra",
      name: "Basra",
      capital: "Basra",
      capitalCoordinates: { lat: 30.5085, lng: 47.7804 },
      flag: "🛢️",
      flagEmoji: "🛢️",
      language: "ar",
      majorCities: ["Basra", "Zubayr", "Abu Al-Khaseeb"],
      population: 2772000,
      area: 19070
    },
    {
      id: "erbil",
      name: "Erbil",
      capital: "Erbil",
      capitalCoordinates: { lat: 36.1901, lng: 44.0091 },
      flag: "🏰",
      flagEmoji: "🏰",
      language: "ku",
      languages: ["ku", "ar"],
      majorCities: ["Erbil", "Soran", "Shaqlawa"],
      population: 2009367,
      area: 15074
    },
    {
      id: "ninawa",
      name: "Nineveh",
      capital: "Mosul",
      capitalCoordinates: { lat: 36.3350, lng: 43.1189 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "ar",
      majorCities: ["Mosul", "Tal Afar", "Sinjar"],
      population: 3729998,
      area: 37323
    },
    {
      id: "sulaymaniyah",
      name: "Sulaymaniyah",
      capital: "Sulaymaniyah",
      capitalCoordinates: { lat: 35.5570, lng: 45.4353 },
      flag: "⛰️",
      flagEmoji: "⛰️",
      language: "ku",
      majorCities: ["Sulaymaniyah", "Halabja", "Ranya"],
      population: 2199500,
      area: 17023
    },
    {
      id: "karbala",
      name: "Karbala",
      capital: "Karbala",
      capitalCoordinates: { lat: 32.6160, lng: 44.0249 },
      flag: "🕌",
      flagEmoji: "🕌",
      language: "ar",
      majorCities: ["Karbala", "Al-Hindiyah"],
      population: 1218732,
      area: 5034
    }
  ],

  // Afghanistan - Provinces (Welayat)
  AF: [
    {
      id: "kabul",
      name: "Kabul",
      capital: "Kabul",
      capitalCoordinates: { lat: 34.5553, lng: 69.2075 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "ps",
      languages: ["ps", "fa"],
      majorCities: ["Kabul", "Paghman", "Mir Bacha Kot"],
      population: 4635000,
      area: 4462
    },
    {
      id: "herat",
      name: "Herat",
      capital: "Herat",
      capitalCoordinates: { lat: 34.3510, lng: 62.2041 },
      flag: "🕌",
      flagEmoji: "🕌",
      language: "fa",
      majorCities: ["Herat", "Islam Qala", "Ghoryan"],
      population: 1967000,
      area: 54778
    },
    {
      id: "balkh",
      name: "Balkh",
      capital: "Mazar-i-Sharif",
      capitalCoordinates: { lat: 36.7096, lng: 67.1062 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "fa",
      languages: ["fa", "uz"],
      majorCities: ["Mazar-i-Sharif", "Balkh", "Hairatan"],
      population: 1476000,
      area: 17249
    },
    {
      id: "kandahar",
      name: "Kandahar",
      capital: "Kandahar",
      capitalCoordinates: { lat: 31.6289, lng: 65.7372 },
      flag: "🏜️",
      flagEmoji: "🏜️",
      language: "ps",
      majorCities: ["Kandahar", "Spin Boldak", "Panjwai"],
      population: 1343000,
      area: 54844
    },
    {
      id: "nangarhar",
      name: "Nangarhar",
      capital: "Jalalabad",
      capitalCoordinates: { lat: 34.4305, lng: 70.4515 },
      flag: "⛰️",
      flagEmoji: "⛰️",
      language: "ps",
      majorCities: ["Jalalabad", "Torkham", "Behsud"],
      population: 1667000,
      area: 7727
    }
  ],

  // Kazakhstan - Regions (Oblystar)
  KZ: [
    {
      id: "almaty-city",
      name: "Almaty",
      capital: "Almaty",
      capitalCoordinates: { lat: 43.2220, lng: 76.8512 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "kk",
      languages: ["kk", "ru"],
      majorCities: ["Almaty"],
      population: 1977011,
      area: 682
    },
    {
      id: "astana",
      name: "Astana",
      capital: "Astana",
      capitalCoordinates: { lat: 51.1694, lng: 71.4491 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "kk",
      languages: ["kk", "ru"],
      majorCities: ["Astana"],
      population: 1184469,
      area: 797
    },
    {
      id: "shymkent",
      name: "Shymkent",
      capital: "Shymkent",
      capitalCoordinates: { lat: 42.3167, lng: 69.5972 },
      flag: "🌇",
      flagEmoji: "🌇",
      language: "kk",
      majorCities: ["Shymkent"],
      population: 1074000,
      area: 1170
    },
    {
      id: "east-kazakhstan",
      name: "East Kazakhstan",
      capital: "Oskemen",
      capitalCoordinates: { lat: 49.9454, lng: 82.6084 },
      flag: "⛰️",
      flagEmoji: "⛰️",
      language: "kk",
      majorCities: ["Oskemen", "Semey", "Ridder"],
      population: 1364900,
      area: 283226
    }
  ],

  // Uzbekistan - Regions (Viloyatlar)
  UZ: [
    {
      id: "tashkent-city",
      name: "Tashkent City",
      capital: "Tashkent",
      capitalCoordinates: { lat: 41.2995, lng: 69.2401 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "uz",
      majorCities: ["Tashkent"],
      population: 2571668,
      area: 335
    },
    {
      id: "samarkand",
      name: "Samarkand",
      capital: "Samarkand",
      capitalCoordinates: { lat: 39.6542, lng: 66.9597 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "uz",
      majorCities: ["Samarkand", "Kattakurgan", "Urgut"],
      population: 3877000,
      area: 16773
    },
    {
      id: "bukhara",
      name: "Bukhara",
      capital: "Bukhara",
      capitalCoordinates: { lat: 39.7681, lng: 64.4556 },
      flag: "🕌",
      flagEmoji: "🕌",
      language: "uz",
      majorCities: ["Bukhara", "Kogon", "Gazli"],
      population: 1930000,
      area: 39400
    },
    {
      id: "fergana",
      name: "Fergana",
      capital: "Fergana",
      capitalCoordinates: { lat: 40.3842, lng: 71.7870 },
      flag: "🌾",
      flagEmoji: "🌾",
      language: "uz",
      majorCities: ["Fergana", "Kokand", "Margilan", "Andijan"],
      population: 3687000,
      area: 6800
    }
  ],

  // Turkmenistan - Regions (Welaýatlar)
  TM: [
    {
      id: "ashgabat",
      name: "Ashgabat",
      capital: "Ashgabat",
      capitalCoordinates: { lat: 37.9601, lng: 58.3261 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "tk",
      majorCities: ["Ashgabat"],
      population: 1031992,
      area: 470
    },
    {
      id: "lebap",
      name: "Lebap",
      capital: "Turkmenabat",
      capitalCoordinates: { lat: 39.0729, lng: 63.5787 },
      flag: "🏭",
      flagEmoji: "🏭",
      language: "tk",
      majorCities: ["Turkmenabat", "Atamurat", "Farap"],
      population: 1400000,
      area: 93730
    },
    {
      id: "mary",
      name: "Mary",
      capital: "Mary",
      capitalCoordinates: { lat: 37.5936, lng: 61.8283 },
      flag: "🏛️",
      flagEmoji: "🏛️",
      language: "tk",
      majorCities: ["Mary", "Bayramali"],
      population: 1950000,
      area: 87150
    }
  ],

  // Tajikistan - Regions (Viloyatho)
  TJ: [
    {
      id: "dushanbe",
      name: "Dushanbe",
      capital: "Dushanbe",
      capitalCoordinates: { lat: 38.5598, lng: 68.7870 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "tg",
      majorCities: ["Dushanbe"],
      population: 863400,
      area: 125
    },
    {
      id: "sughd",
      name: "Sughd",
      capital: "Khujand",
      capitalCoordinates: { lat: 40.2828, lng: 69.6170 },
      flag: "⛰️",
      flagEmoji: "⛰️",
      language: "tg",
      majorCities: ["Khujand", "Istaravshan", "Panjakent"],
      population: 2700000,
      area: 25400
    },
    {
      id: "khatlon",
      name: "Khatlon",
      capital: "Bokhtar",
      capitalCoordinates: { lat: 37.8368, lng: 68.7770 },
      flag: "🌾",
      flagEmoji: "🌾",
      language: "tg",
      majorCities: ["Bokhtar", "Kulob", "Danghara"],
      population: 3350000,
      area: 24800
    }
  ],

  // Kyrgyzstan - Regions (Oblasttar)
  KG: [
    {
      id: "bishkek",
      name: "Bishkek",
      capital: "Bishkek",
      capitalCoordinates: { lat: 42.8746, lng: 74.5698 },
      flag: "🏙️",
      flagEmoji: "🏙️",
      language: "ky",
      languages: ["ky", "ru"],
      majorCities: ["Bishkek"],
      population: 1053915,
      area: 127
    },
    {
      id: "osh-city",
      name: "Osh",
      capital: "Osh",
      capitalCoordinates: { lat: 40.5283, lng: 72.7985 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "ky",
      majorCities: ["Osh"],
      population: 299500,
      area: 182
    },
    {
      id: "chuy",
      name: "Chuy",
      capital: "Bishkek",
      capitalCoordinates: { lat: 42.8746, lng: 74.5698 },
      flag: "🌾",
      flagEmoji: "🌾",
      language: "ky",
      majorCities: ["Tokmok", "Kant", "Kara-Balta"],
      population: 959800,
      area: 20200
    },
    {
      id: "issyk-kul",
      name: "Issyk-Kul",
      capital: "Karakol",
      capitalCoordinates: { lat: 42.4907, lng: 78.3936 },
      flag: "🏔️",
      flagEmoji: "🏔️",
      language: "ky",
      majorCities: ["Karakol", "Cholpon-Ata", "Balykchy"],
      population: 489900,
      area: 43144
    }
  ]
};

// Administrative division terminology by country
export const ADMINISTRATIVE_TERMS: Record<string, { singular: string; plural: string; subDivision?: string }> = {
  // Countries with States
  US: { singular: "State", plural: "States", subDivision: "County" },
  IN: { singular: "State", plural: "States", subDivision: "District" },
  AU: { singular: "State/Territory", plural: "States & Territories" },
  BR: { singular: "Estado", plural: "Estados" },
  MX: { singular: "Estado", plural: "Estados" },
  NG: { singular: "State", plural: "States" },
  MY: { singular: "State", plural: "States" },
  
  // Countries with Provinces
  CN: { singular: "Province", plural: "Provinces", subDivision: "Prefecture" },
  CA: { singular: "Province/Territory", plural: "Provinces & Territories" },
  PK: { singular: "Province", plural: "Provinces" },
  ZA: { singular: "Province", plural: "Provinces" },
  AR: { singular: "Provincia", plural: "Provincias" },
  ID: { singular: "Provinsi", plural: "Provinsi" },
  
  // Countries with Regions/Departments
  FR: { singular: "Région", plural: "Régions", subDivision: "Département" },
  IT: { singular: "Regione", plural: "Regioni", subDivision: "Provincia" },
  ES: { singular: "Comunidad Autónoma", plural: "Comunidades Autónomas" },
  
  // Countries with Länder/Bundesländer
  DE: { singular: "Bundesland", plural: "Bundesländer" },
  
  // Countries with Prefectures
  JP: { singular: "Prefecture", plural: "Prefectures" },
  
  // Countries with Constituent Countries/Nations
  GB: { singular: "Nation", plural: "Nations" },
  
  // Countries with Federal Subjects
  RU: { singular: "Federal Subject", plural: "Federal Subjects" },
  
  // Countries with Do/Special Cities
  KR: { singular: "Province/City", plural: "Provinces & Cities" },
  
  // Countries with İller (Provinces)
  TR: { singular: "İl", plural: "İller" },
  
  // Countries with Voivodeships
  PL: { singular: "Voivodeship", plural: "Voivodeships" },
  
  // Countries with Oblasts
  UA: { singular: "Oblast", plural: "Oblasts" },
  
  // Southeast Asian countries
  KH: { singular: "Province", plural: "Provinces" },
  MM: { singular: "Region/State", plural: "Regions & States" },
  LA: { singular: "Province", plural: "Provinces" },
  NP: { singular: "Province", plural: "Provinces" },
  LK: { singular: "Province", plural: "Provinces" },
  
  // Middle East & Central Asia
  IR: { singular: "Ostan", plural: "Ostans" },
  IQ: { singular: "Governorate", plural: "Governorates" },
  AF: { singular: "Province", plural: "Provinces" },
  KZ: { singular: "Region", plural: "Regions" },
  UZ: { singular: "Viloyat", plural: "Viloyatlar" },
  TM: { singular: "Welaýat", plural: "Welaýatlar" },
  TJ: { singular: "Viloyat", plural: "Viloyatho" },
  KG: { singular: "Oblast", plural: "Oblasttar" },
  
  // Default fallback
  DEFAULT: { singular: "Region", plural: "Regions" }
};

// Country metadata with capital, continent, and key info
export interface CountryMetadata {
  code: string;
  name: string;
  flag: string;
  capital: string;
  capitalCoordinates: { lat: number; lng: number };
  continent: string;
  continentCode: string;
  population?: number;
  area?: number; // km²
  currency?: string;
  currencySymbol?: string;
  callingCode?: string;
  drivingSide?: "left" | "right";
  timezone?: string;
}

export const COUNTRY_METADATA: Record<string, CountryMetadata> = {
  US: {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    capital: "Washington, D.C.",
    capitalCoordinates: { lat: 38.9072, lng: -77.0369 },
    continent: "North America",
    continentCode: "NA",
    population: 331002651,
    currency: "USD",
    currencySymbol: "$",
    callingCode: "+1",
    drivingSide: "right"
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    capital: "London",
    capitalCoordinates: { lat: 51.5074, lng: -0.1278 },
    continent: "Europe",
    continentCode: "EU",
    population: 67886011,
    currency: "GBP",
    currencySymbol: "£",
    callingCode: "+44",
    drivingSide: "left"
  },
  DE: {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    capital: "Berlin",
    capitalCoordinates: { lat: 52.5200, lng: 13.4050 },
    continent: "Europe",
    continentCode: "EU",
    population: 83783942,
    currency: "EUR",
    currencySymbol: "€",
    callingCode: "+49",
    drivingSide: "right"
  },
  FR: {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    capital: "Paris",
    capitalCoordinates: { lat: 48.8566, lng: 2.3522 },
    continent: "Europe",
    continentCode: "EU",
    population: 65273511,
    currency: "EUR",
    currencySymbol: "€",
    callingCode: "+33",
    drivingSide: "right"
  },
  JP: {
    code: "JP",
    name: "Japan",
    flag: "🇯🇵",
    capital: "Tokyo",
    capitalCoordinates: { lat: 35.6762, lng: 139.6503 },
    continent: "Asia",
    continentCode: "AS",
    population: 126476461,
    currency: "JPY",
    currencySymbol: "¥",
    callingCode: "+81",
    drivingSide: "left"
  },
  CN: {
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    capital: "Beijing",
    capitalCoordinates: { lat: 39.9042, lng: 116.4074 },
    continent: "Asia",
    continentCode: "AS",
    population: 1439323776,
    currency: "CNY",
    currencySymbol: "¥",
    callingCode: "+86",
    drivingSide: "right"
  },
  IN: {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    capital: "New Delhi",
    capitalCoordinates: { lat: 28.6139, lng: 77.2090 },
    continent: "Asia",
    continentCode: "AS",
    population: 1380004385,
    currency: "INR",
    currencySymbol: "₹",
    callingCode: "+91",
    drivingSide: "left"
  },
  AU: {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    capital: "Canberra",
    capitalCoordinates: { lat: -35.2809, lng: 149.1300 },
    continent: "Oceania",
    continentCode: "OC",
    population: 25499884,
    currency: "AUD",
    currencySymbol: "$",
    callingCode: "+61",
    drivingSide: "left"
  },
  CA: {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    capital: "Ottawa",
    capitalCoordinates: { lat: 45.4215, lng: -75.6972 },
    continent: "North America",
    continentCode: "NA",
    population: 37742154,
    currency: "CAD",
    currencySymbol: "$",
    callingCode: "+1",
    drivingSide: "right"
  },
  BR: {
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    capital: "Brasília",
    capitalCoordinates: { lat: -15.8267, lng: -47.9218 },
    continent: "South America",
    continentCode: "SA",
    population: 212559417,
    currency: "BRL",
    currencySymbol: "R$",
    callingCode: "+55",
    drivingSide: "right"
  },
  RU: {
    code: "RU",
    name: "Russia",
    flag: "🇷🇺",
    capital: "Moscow",
    capitalCoordinates: { lat: 55.7558, lng: 37.6173 },
    continent: "Europe/Asia",
    continentCode: "EU",
    population: 145934462,
    currency: "RUB",
    currencySymbol: "₽",
    callingCode: "+7",
    drivingSide: "right"
  },
  MX: {
    code: "MX",
    name: "Mexico",
    flag: "🇲🇽",
    capital: "Mexico City",
    capitalCoordinates: { lat: 19.4326, lng: -99.1332 },
    continent: "North America",
    continentCode: "NA",
    population: 128932753,
    currency: "MXN",
    currencySymbol: "$",
    callingCode: "+52",
    drivingSide: "right"
  },
  ID: {
    code: "ID",
    name: "Indonesia",
    flag: "🇮🇩",
    capital: "Jakarta",
    capitalCoordinates: { lat: -6.2088, lng: 106.8456 },
    continent: "Asia",
    continentCode: "AS",
    population: 273523615,
    currency: "IDR",
    currencySymbol: "Rp",
    callingCode: "+62",
    drivingSide: "left"
  },
  ZA: {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    capital: "Pretoria",
    capitalCoordinates: { lat: -25.7461, lng: 28.1881 },
    continent: "Africa",
    continentCode: "AF",
    population: 59308690,
    currency: "ZAR",
    currencySymbol: "R",
    callingCode: "+27",
    drivingSide: "left"
  },
  TR: {
    code: "TR",
    name: "Turkey",
    flag: "🇹🇷",
    capital: "Ankara",
    capitalCoordinates: { lat: 39.9334, lng: 32.8597 },
    continent: "Europe/Asia",
    continentCode: "AS",
    population: 84339067,
    currency: "TRY",
    currencySymbol: "₺",
    callingCode: "+90",
    drivingSide: "right"
  },
  KR: {
    code: "KR",
    name: "South Korea",
    flag: "🇰🇷",
    capital: "Seoul",
    capitalCoordinates: { lat: 37.5665, lng: 126.9780 },
    continent: "Asia",
    continentCode: "AS",
    population: 51780579,
    currency: "KRW",
    currencySymbol: "₩",
    callingCode: "+82",
    drivingSide: "right"
  },
  ES: {
    code: "ES",
    name: "Spain",
    flag: "🇪🇸",
    capital: "Madrid",
    capitalCoordinates: { lat: 40.4168, lng: -3.7038 },
    continent: "Europe",
    continentCode: "EU",
    population: 46754778,
    currency: "EUR",
    currencySymbol: "€",
    callingCode: "+34",
    drivingSide: "right"
  },
  IT: {
    code: "IT",
    name: "Italy",
    flag: "🇮🇹",
    capital: "Rome",
    capitalCoordinates: { lat: 41.9028, lng: 12.4964 },
    continent: "Europe",
    continentCode: "EU",
    population: 60461826,
    currency: "EUR",
    currencySymbol: "€",
    callingCode: "+39",
    drivingSide: "right"
  },
  SA: {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    capital: "Riyadh",
    capitalCoordinates: { lat: 24.7136, lng: 46.6753 },
    continent: "Asia",
    continentCode: "AS",
    population: 34813871,
    currency: "SAR",
    currencySymbol: "﷼",
    callingCode: "+966",
    drivingSide: "right"
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    capital: "Abu Dhabi",
    capitalCoordinates: { lat: 24.4539, lng: 54.3773 },
    continent: "Asia",
    continentCode: "AS",
    population: 9890402,
    currency: "AED",
    currencySymbol: "د.إ",
    callingCode: "+971",
    drivingSide: "right"
  },
  SG: {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    capital: "Singapore",
    capitalCoordinates: { lat: 1.3521, lng: 103.8198 },
    continent: "Asia",
    continentCode: "AS",
    population: 5850342,
    currency: "SGD",
    currencySymbol: "$",
    callingCode: "+65",
    drivingSide: "left"
  },
  TH: {
    code: "TH",
    name: "Thailand",
    flag: "🇹🇭",
    capital: "Bangkok",
    capitalCoordinates: { lat: 13.7563, lng: 100.5018 },
    continent: "Asia",
    continentCode: "AS",
    population: 69799978,
    currency: "THB",
    currencySymbol: "฿",
    callingCode: "+66",
    drivingSide: "left"
  },
  MY: {
    code: "MY",
    name: "Malaysia",
    flag: "🇲🇾",
    capital: "Kuala Lumpur",
    capitalCoordinates: { lat: 3.1390, lng: 101.6869 },
    continent: "Asia",
    continentCode: "AS",
    population: 32365999,
    currency: "MYR",
    currencySymbol: "RM",
    callingCode: "+60",
    drivingSide: "left"
  },
  PH: {
    code: "PH",
    name: "Philippines",
    flag: "🇵🇭",
    capital: "Manila",
    capitalCoordinates: { lat: 14.5995, lng: 120.9842 },
    continent: "Asia",
    continentCode: "AS",
    population: 109581078,
    currency: "PHP",
    currencySymbol: "₱",
    callingCode: "+63",
    drivingSide: "right"
  },
  VN: {
    code: "VN",
    name: "Vietnam",
    flag: "🇻🇳",
    capital: "Hanoi",
    capitalCoordinates: { lat: 21.0278, lng: 105.8342 },
    continent: "Asia",
    continentCode: "AS",
    population: 97338579,
    currency: "VND",
    currencySymbol: "₫",
    callingCode: "+84",
    drivingSide: "right"
  },
  NG: {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    capital: "Abuja",
    capitalCoordinates: { lat: 9.0765, lng: 7.3986 },
    continent: "Africa",
    continentCode: "AF",
    population: 206139589,
    currency: "NGN",
    currencySymbol: "₦",
    callingCode: "+234",
    drivingSide: "right"
  },
  EG: {
    code: "EG",
    name: "Egypt",
    flag: "🇪🇬",
    capital: "Cairo",
    capitalCoordinates: { lat: 30.0444, lng: 31.2357 },
    continent: "Africa",
    continentCode: "AF",
    population: 102334404,
    currency: "EGP",
    currencySymbol: "£",
    callingCode: "+20",
    drivingSide: "right"
  },
  PK: {
    code: "PK",
    name: "Pakistan",
    flag: "🇵🇰",
    capital: "Islamabad",
    capitalCoordinates: { lat: 33.6844, lng: 73.0479 },
    continent: "Asia",
    continentCode: "AS",
    population: 220892340,
    currency: "PKR",
    currencySymbol: "₨",
    callingCode: "+92",
    drivingSide: "left"
  },
  BD: {
    code: "BD",
    name: "Bangladesh",
    flag: "🇧🇩",
    capital: "Dhaka",
    capitalCoordinates: { lat: 23.8103, lng: 90.4125 },
    continent: "Asia",
    continentCode: "AS",
    population: 164689383,
    currency: "BDT",
    currencySymbol: "৳",
    callingCode: "+880",
    drivingSide: "left"
  },
  NL: {
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    capital: "Amsterdam",
    capitalCoordinates: { lat: 52.3676, lng: 4.9041 },
    continent: "Europe",
    continentCode: "EU",
    population: 17134872,
    currency: "EUR",
    currencySymbol: "€",
    callingCode: "+31",
    drivingSide: "right"
  },
  PL: {
    code: "PL",
    name: "Poland",
    flag: "🇵🇱",
    capital: "Warsaw",
    capitalCoordinates: { lat: 52.2297, lng: 21.0122 },
    continent: "Europe",
    continentCode: "EU",
    population: 37846611,
    currency: "PLN",
    currencySymbol: "zł",
    callingCode: "+48",
    drivingSide: "right"
  },
  UA: {
    code: "UA",
    name: "Ukraine",
    flag: "🇺🇦",
    capital: "Kyiv",
    capitalCoordinates: { lat: 50.4501, lng: 30.5234 },
    continent: "Europe",
    continentCode: "EU",
    population: 43733762,
    currency: "UAH",
    currencySymbol: "₴",
    callingCode: "+380",
    drivingSide: "right"
  },
  SE: {
    code: "SE",
    name: "Sweden",
    flag: "🇸🇪",
    capital: "Stockholm",
    capitalCoordinates: { lat: 59.3293, lng: 18.0686 },
    continent: "Europe",
    continentCode: "EU",
    population: 10099265,
    currency: "SEK",
    currencySymbol: "kr",
    callingCode: "+46",
    drivingSide: "right"
  },
  NO: {
    code: "NO",
    name: "Norway",
    flag: "🇳🇴",
    capital: "Oslo",
    capitalCoordinates: { lat: 59.9139, lng: 10.7522 },
    continent: "Europe",
    continentCode: "EU",
    population: 5421241,
    currency: "NOK",
    currencySymbol: "kr",
    callingCode: "+47",
    drivingSide: "right"
  },
  DK: {
    code: "DK",
    name: "Denmark",
    flag: "🇩🇰",
    capital: "Copenhagen",
    capitalCoordinates: { lat: 55.6761, lng: 12.5683 },
    continent: "Europe",
    continentCode: "EU",
    population: 5792202,
    currency: "DKK",
    currencySymbol: "kr",
    callingCode: "+45",
    drivingSide: "right"
  },
  FI: {
    code: "FI",
    name: "Finland",
    flag: "🇫🇮",
    capital: "Helsinki",
    capitalCoordinates: { lat: 60.1699, lng: 24.9384 },
    continent: "Europe",
    continentCode: "EU",
    population: 5540720,
    currency: "EUR",
    currencySymbol: "€",
    callingCode: "+358",
    drivingSide: "right"
  },
  IL: {
    code: "IL",
    name: "Israel",
    flag: "🇮🇱",
    capital: "Jerusalem",
    capitalCoordinates: { lat: 31.7683, lng: 35.2137 },
    continent: "Asia",
    continentCode: "AS",
    population: 8655535,
    currency: "ILS",
    currencySymbol: "₪",
    callingCode: "+972",
    drivingSide: "right"
  },
  QA: {
    code: "QA",
    name: "Qatar",
    flag: "🇶🇦",
    capital: "Doha",
    capitalCoordinates: { lat: 25.2854, lng: 51.5310 },
    continent: "Asia",
    continentCode: "AS",
    population: 2881053,
    currency: "QAR",
    currencySymbol: "﷼",
    callingCode: "+974",
    drivingSide: "right"
  },
  AR: {
    code: "AR",
    name: "Argentina",
    flag: "🇦🇷",
    capital: "Buenos Aires",
    capitalCoordinates: { lat: -34.6037, lng: -58.3816 },
    continent: "South America",
    continentCode: "SA",
    population: 45195774,
    currency: "ARS",
    currencySymbol: "$",
    callingCode: "+54",
    drivingSide: "right"
  },
  KH: {
    code: "KH",
    name: "Cambodia",
    flag: "🇰🇭",
    capital: "Phnom Penh",
    capitalCoordinates: { lat: 11.5564, lng: 104.9282 },
    continent: "Asia",
    continentCode: "AS",
    population: 16718965,
    currency: "KHR",
    currencySymbol: "៛",
    callingCode: "+855",
    drivingSide: "right"
  },
  MM: {
    code: "MM",
    name: "Myanmar",
    flag: "🇲🇲",
    capital: "Naypyidaw",
    capitalCoordinates: { lat: 19.7633, lng: 96.0785 },
    continent: "Asia",
    continentCode: "AS",
    population: 54409800,
    currency: "MMK",
    currencySymbol: "K",
    callingCode: "+95",
    drivingSide: "right"
  },
  LA: {
    code: "LA",
    name: "Laos",
    flag: "🇱🇦",
    capital: "Vientiane",
    capitalCoordinates: { lat: 17.9757, lng: 102.6331 },
    continent: "Asia",
    continentCode: "AS",
    population: 7275560,
    currency: "LAK",
    currencySymbol: "₭",
    callingCode: "+856",
    drivingSide: "right"
  },
  NP: {
    code: "NP",
    name: "Nepal",
    flag: "🇳🇵",
    capital: "Kathmandu",
    capitalCoordinates: { lat: 27.7172, lng: 85.3240 },
    continent: "Asia",
    continentCode: "AS",
    population: 29136808,
    currency: "NPR",
    currencySymbol: "₨",
    callingCode: "+977",
    drivingSide: "left"
  },
  LK: {
    code: "LK",
    name: "Sri Lanka",
    flag: "🇱🇰",
    capital: "Sri Jayawardenepura Kotte",
    capitalCoordinates: { lat: 6.9271, lng: 79.8612 },
    continent: "Asia",
    continentCode: "AS",
    population: 21413249,
    currency: "LKR",
    currencySymbol: "Rs",
    callingCode: "+94",
    drivingSide: "left"
  },
  // Middle East
  IR: {
    code: "IR",
    name: "Iran",
    flag: "🇮🇷",
    capital: "Tehran",
    capitalCoordinates: { lat: 35.6892, lng: 51.3890 },
    continent: "Asia",
    continentCode: "AS",
    population: 83992949,
    currency: "IRR",
    currencySymbol: "﷼",
    callingCode: "+98",
    drivingSide: "right"
  },
  IQ: {
    code: "IQ",
    name: "Iraq",
    flag: "🇮🇶",
    capital: "Baghdad",
    capitalCoordinates: { lat: 33.3152, lng: 44.3661 },
    continent: "Asia",
    continentCode: "AS",
    population: 40222493,
    currency: "IQD",
    currencySymbol: "ع.د",
    callingCode: "+964",
    drivingSide: "right"
  },
  AF: {
    code: "AF",
    name: "Afghanistan",
    flag: "🇦🇫",
    capital: "Kabul",
    capitalCoordinates: { lat: 34.5553, lng: 69.2075 },
    continent: "Asia",
    continentCode: "AS",
    population: 38928346,
    currency: "AFN",
    currencySymbol: "؋",
    callingCode: "+93",
    drivingSide: "right"
  },
  // Central Asia
  KZ: {
    code: "KZ",
    name: "Kazakhstan",
    flag: "🇰🇿",
    capital: "Astana",
    capitalCoordinates: { lat: 51.1694, lng: 71.4491 },
    continent: "Asia",
    continentCode: "AS",
    population: 18776707,
    currency: "KZT",
    currencySymbol: "₸",
    callingCode: "+7",
    drivingSide: "right"
  },
  UZ: {
    code: "UZ",
    name: "Uzbekistan",
    flag: "🇺🇿",
    capital: "Tashkent",
    capitalCoordinates: { lat: 41.2995, lng: 69.2401 },
    continent: "Asia",
    continentCode: "AS",
    population: 33469203,
    currency: "UZS",
    currencySymbol: "лв",
    callingCode: "+998",
    drivingSide: "right"
  },
  TM: {
    code: "TM",
    name: "Turkmenistan",
    flag: "🇹🇲",
    capital: "Ashgabat",
    capitalCoordinates: { lat: 37.9601, lng: 58.3261 },
    continent: "Asia",
    continentCode: "AS",
    population: 6031200,
    currency: "TMT",
    currencySymbol: "m",
    callingCode: "+993",
    drivingSide: "right"
  },
  TJ: {
    code: "TJ",
    name: "Tajikistan",
    flag: "🇹🇯",
    capital: "Dushanbe",
    capitalCoordinates: { lat: 38.5598, lng: 68.7870 },
    continent: "Asia",
    continentCode: "AS",
    population: 9537645,
    currency: "TJS",
    currencySymbol: "SM",
    callingCode: "+992",
    drivingSide: "right"
  },
  KG: {
    code: "KG",
    name: "Kyrgyzstan",
    flag: "🇰🇬",
    capital: "Bishkek",
    capitalCoordinates: { lat: 42.8746, lng: 74.5698 },
    continent: "Asia",
    continentCode: "AS",
    population: 6524195,
    currency: "KGS",
    currencySymbol: "лв",
    callingCode: "+996",
    drivingSide: "right"
  }
};

// Get country metadata
export function getCountryMetadata(countryCode: string): CountryMetadata | undefined {
  return COUNTRY_METADATA[countryCode.toUpperCase()];
}

// Get administrative term for a country
export function getAdministrativeTerm(countryCode: string): { singular: string; plural: string; subDivision?: string } {
  return ADMINISTRATIVE_TERMS[countryCode.toUpperCase()] || ADMINISTRATIVE_TERMS.DEFAULT;
}

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
  AF: [
    { code: "ps", name: "Pashto", nativeName: "پښتو", script: "Arabic" },
    { code: "fa", name: "Dari", nativeName: "دری", script: "Arabic" },
  ],
  KZ: [
    { code: "kk", name: "Kazakh", nativeName: "Қазақша", script: "Cyrillic" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
  ],
  UZ: [
    { code: "uz", name: "Uzbek", nativeName: "Oʻzbekcha" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
  ],
  TM: [
    { code: "tk", name: "Turkmen", nativeName: "Türkmen" },
  ],
  TJ: [
    { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ", script: "Cyrillic" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
  ],
  KG: [
    { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча", script: "Cyrillic" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
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
  AR: [
    { name: "Clarín", url: "https://www.clarin.com/rss/lo-ultimo/", language: "es" },
    { name: "La Nación", url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/", language: "es" },
    { name: "Infobae Argentina", url: "https://www.infobae.com/feeds/rss/", language: "es" },
  ],
  KH: [
    { name: "Khmer Times", url: "https://www.khmertimeskh.com/feed/", language: "en" },
    { name: "The Phnom Penh Post", url: "https://www.phnompenhpost.com/rss/", language: "en" },
  ],
  MM: [
    { name: "The Irrawaddy", url: "https://www.irrawaddy.com/feed", language: "en" },
    { name: "Myanmar Now", url: "https://myanmar-now.org/feed/", language: "en" },
  ],
  LA: [
    { name: "Vientiane Times", url: "https://www.vientianetimes.org.la/rss/", language: "en" },
  ],
  NP: [
    { name: "The Kathmandu Post", url: "https://kathmandupost.com/rss", language: "en" },
    { name: "The Himalayan Times", url: "https://thehimalayantimes.com/feed/", language: "en" },
    { name: "Republica", url: "https://myrepublica.nagariknetwork.com/feed", language: "en" },
  ],
  LK: [
    { name: "Daily Mirror Sri Lanka", url: "https://www.dailymirror.lk/RSS_Feed/rss", language: "en" },
    { name: "The Island", url: "https://island.lk/feed/", language: "en" },
    { name: "Ada Derana", url: "https://www.adaderana.lk/rss/", language: "en" },
  ],
  // Middle East
  IR: [
    { name: "Tehran Times", url: "https://www.tehrantimes.com/rss", language: "en" },
    { name: "Iran Daily", url: "https://www.iran-daily.com/rss", language: "en" },
    { name: "Press TV", url: "https://www.presstv.ir/rss", language: "en" },
  ],
  IQ: [
    { name: "Iraq News", url: "https://www.iraqnews.com/feed/", language: "en" },
    { name: "Kurdistan24", url: "https://www.kurdistan24.net/rss", language: "en" },
    { name: "Iraqi News Agency", url: "https://ina.iq/rss/", language: "ar" },
  ],
  AF: [
    { name: "TOLOnews", url: "https://tolonews.com/rss", language: "en" },
    { name: "Pajhwok Afghan News", url: "https://pajhwok.com/feed/", language: "en" },
    { name: "Khaama Press", url: "https://www.khaama.com/feed/", language: "en" },
  ],
  // Central Asia
  KZ: [
    { name: "Astana Times", url: "https://astanatimes.com/feed/", language: "en" },
    { name: "Tengri News", url: "https://en.tengrinews.kz/rss/", language: "en" },
    { name: "Inform.kz", url: "https://www.inform.kz/rss", language: "en" },
  ],
  UZ: [
    { name: "UzDaily", url: "https://www.uzdaily.com/rss", language: "en" },
    { name: "Gazeta.uz", url: "https://www.gazeta.uz/rss", language: "en" },
  ],
  TM: [
    { name: "Chronicles of Turkmenistan", url: "https://www.hronikatm.com/feed/", language: "en" },
  ],
  TJ: [
    { name: "Asia-Plus", url: "https://asiaplustj.info/en/rss", language: "en" },
  ],
  KG: [
    { name: "24.kg", url: "https://24.kg/rss/", language: "en" },
    { name: "Kabar", url: "https://kabar.kg/rss/", language: "en" },
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
