// Geographic Hierarchy Data Structure
// World → Continents → Countries → States → Cities → Localities

export interface Locality {
  id: string;
  name: string;
  type: "capital" | "hub" | "district" | "area";
}

export interface City {
  id: string;
  name: string;
  isCapital?: boolean;
  localities: Locality[];
}

export interface State {
  id: string;
  name: string;
  code?: string;
  cities: City[];
}

export interface Country {
  id: string;
  name: string;
  code: string; // ISO 2-letter code
  flag: string;
  states: State[];
}

export interface Continent {
  id: string;
  name: string;
  countries: Country[];
}

// 7 Continents with major countries, states, cities, localities
export const GEO_HIERARCHY: Continent[] = [
  {
    id: "asia",
    name: "Asia",
    countries: [
      {
        id: "in",
        name: "India",
        code: "IN",
        flag: "🇮🇳",
        states: [
          {
            id: "mh",
            name: "Maharashtra",
            code: "MH",
            cities: [
              {
                id: "mumbai",
                name: "Mumbai",
                isCapital: false,
                localities: [
                  { id: "bkc", name: "Bandra Kurla Complex", type: "hub" },
                  { id: "nariman", name: "Nariman Point", type: "hub" },
                  { id: "andheri", name: "Andheri", type: "district" },
                  { id: "powai", name: "Powai", type: "district" },
                ],
              },
              {
                id: "pune",
                name: "Pune",
                localities: [
                  { id: "hinjewadi", name: "Hinjewadi IT Park", type: "hub" },
                  { id: "koregaon", name: "Koregaon Park", type: "district" },
                ],
              },
            ],
          },
          {
            id: "dl",
            name: "Delhi NCR",
            code: "DL",
            cities: [
              {
                id: "newdelhi",
                name: "New Delhi",
                isCapital: true,
                localities: [
                  { id: "cp", name: "Connaught Place", type: "hub" },
                  { id: "southdelhi", name: "South Delhi", type: "district" },
                  { id: "parliament", name: "Parliament Street", type: "capital" },
                ],
              },
              {
                id: "gurgaon",
                name: "Gurugram",
                localities: [
                  { id: "cybercity", name: "Cyber City", type: "hub" },
                  { id: "dlf", name: "DLF Phase", type: "district" },
                ],
              },
              {
                id: "noida",
                name: "Noida",
                localities: [
                  { id: "sector62", name: "Sector 62", type: "hub" },
                ],
              },
            ],
          },
          {
            id: "ka",
            name: "Karnataka",
            code: "KA",
            cities: [
              {
                id: "bangalore",
                name: "Bengaluru",
                isCapital: true,
                localities: [
                  { id: "whitefield", name: "Whitefield", type: "hub" },
                  { id: "electronic-city", name: "Electronic City", type: "hub" },
                  { id: "mg-road", name: "MG Road", type: "district" },
                  { id: "koramangala", name: "Koramangala", type: "district" },
                ],
              },
            ],
          },
          {
            id: "tn",
            name: "Tamil Nadu",
            code: "TN",
            cities: [
              {
                id: "chennai",
                name: "Chennai",
                isCapital: true,
                localities: [
                  { id: "tidel", name: "Tidel Park", type: "hub" },
                  { id: "anna-nagar", name: "Anna Nagar", type: "district" },
                ],
              },
            ],
          },
          {
            id: "ts",
            name: "Telangana",
            code: "TS",
            cities: [
              {
                id: "hyderabad",
                name: "Hyderabad",
                isCapital: true,
                localities: [
                  { id: "hitec-city", name: "HITEC City", type: "hub" },
                  { id: "gachibowli", name: "Gachibowli", type: "hub" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "cn",
        name: "China",
        code: "CN",
        flag: "🇨🇳",
        states: [
          {
            id: "beijing-m",
            name: "Beijing Municipality",
            cities: [
              {
                id: "beijing",
                name: "Beijing",
                isCapital: true,
                localities: [
                  { id: "zhongguancun", name: "Zhongguancun", type: "hub" },
                  { id: "cbd", name: "Central Business District", type: "hub" },
                ],
              },
            ],
          },
          {
            id: "shanghai-m",
            name: "Shanghai Municipality",
            cities: [
              {
                id: "shanghai",
                name: "Shanghai",
                localities: [
                  { id: "pudong", name: "Pudong", type: "hub" },
                  { id: "lujiazui", name: "Lujiazui", type: "hub" },
                ],
              },
            ],
          },
          {
            id: "guangdong",
            name: "Guangdong",
            cities: [
              { id: "shenzhen", name: "Shenzhen", localities: [{ id: "nanshan", name: "Nanshan", type: "hub" }] },
              { id: "guangzhou", name: "Guangzhou", localities: [{ id: "tianhe", name: "Tianhe", type: "district" }] },
            ],
          },
        ],
      },
      {
        id: "jp",
        name: "Japan",
        code: "JP",
        flag: "🇯🇵",
        states: [
          {
            id: "tokyo-p",
            name: "Tokyo Prefecture",
            cities: [
              {
                id: "tokyo",
                name: "Tokyo",
                isCapital: true,
                localities: [
                  { id: "shibuya", name: "Shibuya", type: "district" },
                  { id: "shinjuku", name: "Shinjuku", type: "district" },
                  { id: "marunouchi", name: "Marunouchi", type: "hub" },
                ],
              },
            ],
          },
          {
            id: "osaka-p",
            name: "Osaka Prefecture",
            cities: [
              { id: "osaka", name: "Osaka", localities: [{ id: "umeda", name: "Umeda", type: "hub" }] },
            ],
          },
        ],
      },
      {
        id: "kr",
        name: "South Korea",
        code: "KR",
        flag: "🇰🇷",
        states: [
          {
            id: "seoul-m",
            name: "Seoul Metropolitan",
            cities: [
              {
                id: "seoul",
                name: "Seoul",
                isCapital: true,
                localities: [
                  { id: "gangnam", name: "Gangnam", type: "district" },
                  { id: "yeouido", name: "Yeouido", type: "hub" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "sg",
        name: "Singapore",
        code: "SG",
        flag: "🇸🇬",
        states: [
          {
            id: "singapore-c",
            name: "Singapore",
            cities: [
              {
                id: "singapore",
                name: "Singapore",
                isCapital: true,
                localities: [
                  { id: "cbd-sg", name: "Central Business District", type: "hub" },
                  { id: "marina-bay", name: "Marina Bay", type: "hub" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "ae",
        name: "UAE",
        code: "AE",
        flag: "🇦🇪",
        states: [
          {
            id: "dubai-e",
            name: "Dubai Emirate",
            cities: [
              {
                id: "dubai",
                name: "Dubai",
                localities: [
                  { id: "difc", name: "DIFC", type: "hub" },
                  { id: "downtown", name: "Downtown Dubai", type: "hub" },
                ],
              },
            ],
          },
          {
            id: "abudhabi-e",
            name: "Abu Dhabi Emirate",
            cities: [
              {
                id: "abudhabi",
                name: "Abu Dhabi",
                isCapital: true,
                localities: [{ id: "adgm", name: "ADGM", type: "hub" }],
              },
            ],
          },
        ],
      },
      {
        id: "sa",
        name: "Saudi Arabia",
        code: "SA",
        flag: "🇸🇦",
        states: [
          {
            id: "riyadh-r",
            name: "Riyadh Region",
            cities: [
              { id: "riyadh", name: "Riyadh", isCapital: true, localities: [{ id: "kafd", name: "KAFD", type: "hub" }] },
            ],
          },
        ],
      },
      {
        id: "qa",
        name: "Qatar",
        code: "QA",
        flag: "🇶🇦",
        states: [
          {
            id: "doha-m",
            name: "Doha Municipality",
            cities: [
              { id: "doha", name: "Doha", isCapital: true, localities: [{ id: "westbay", name: "West Bay", type: "hub" }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "europe",
    name: "Europe",
    countries: [
      {
        id: "gb",
        name: "United Kingdom",
        code: "GB",
        flag: "🇬🇧",
        states: [
          {
            id: "england",
            name: "England",
            cities: [
              {
                id: "london",
                name: "London",
                isCapital: true,
                localities: [
                  { id: "city-of-london", name: "City of London", type: "hub" },
                  { id: "canary-wharf", name: "Canary Wharf", type: "hub" },
                  { id: "westminster", name: "Westminster", type: "capital" },
                  { id: "tech-city", name: "Tech City", type: "hub" },
                ],
              },
              { id: "manchester", name: "Manchester", localities: [{ id: "spinningfields", name: "Spinningfields", type: "hub" }] },
              { id: "birmingham", name: "Birmingham", localities: [] },
            ],
          },
          {
            id: "scotland",
            name: "Scotland",
            cities: [
              { id: "edinburgh", name: "Edinburgh", isCapital: true, localities: [] },
              { id: "glasgow", name: "Glasgow", localities: [] },
            ],
          },
        ],
      },
      {
        id: "de",
        name: "Germany",
        code: "DE",
        flag: "🇩🇪",
        states: [
          {
            id: "berlin-s",
            name: "Berlin",
            cities: [
              {
                id: "berlin",
                name: "Berlin",
                isCapital: true,
                localities: [
                  { id: "mitte", name: "Mitte", type: "hub" },
                  { id: "kreuzberg", name: "Kreuzberg", type: "district" },
                ],
              },
            ],
          },
          {
            id: "bavaria",
            name: "Bavaria",
            cities: [
              { id: "munich", name: "Munich", localities: [{ id: "maxvorstadt", name: "Maxvorstadt", type: "district" }] },
            ],
          },
          {
            id: "hessen",
            name: "Hessen",
            cities: [
              { id: "frankfurt", name: "Frankfurt", localities: [{ id: "bankenviertel", name: "Bankenviertel", type: "hub" }] },
            ],
          },
        ],
      },
      {
        id: "fr",
        name: "France",
        code: "FR",
        flag: "🇫🇷",
        states: [
          {
            id: "ile-de-france",
            name: "Île-de-France",
            cities: [
              {
                id: "paris",
                name: "Paris",
                isCapital: true,
                localities: [
                  { id: "la-defense", name: "La Défense", type: "hub" },
                  { id: "champs-elysees", name: "Champs-Élysées", type: "district" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "nl",
        name: "Netherlands",
        code: "NL",
        flag: "🇳🇱",
        states: [
          {
            id: "north-holland",
            name: "North Holland",
            cities: [
              {
                id: "amsterdam",
                name: "Amsterdam",
                isCapital: true,
                localities: [{ id: "zuidas", name: "Zuidas", type: "hub" }],
              },
            ],
          },
        ],
      },
      {
        id: "ch",
        name: "Switzerland",
        code: "CH",
        flag: "🇨🇭",
        states: [
          {
            id: "zurich-c",
            name: "Zurich Canton",
            cities: [
              { id: "zurich", name: "Zurich", localities: [{ id: "bahnhofstrasse", name: "Bahnhofstrasse", type: "hub" }] },
            ],
          },
          {
            id: "geneva-c",
            name: "Geneva Canton",
            cities: [
              { id: "geneva", name: "Geneva", localities: [] },
            ],
          },
        ],
      },
      {
        id: "it",
        name: "Italy",
        code: "IT",
        flag: "🇮🇹",
        states: [
          {
            id: "lazio",
            name: "Lazio",
            cities: [{ id: "rome", name: "Rome", isCapital: true, localities: [] }],
          },
          {
            id: "lombardy",
            name: "Lombardy",
            cities: [{ id: "milan", name: "Milan", localities: [{ id: "porta-nuova", name: "Porta Nuova", type: "hub" }] }],
          },
        ],
      },
      {
        id: "es",
        name: "Spain",
        code: "ES",
        flag: "🇪🇸",
        states: [
          {
            id: "madrid-c",
            name: "Community of Madrid",
            cities: [{ id: "madrid", name: "Madrid", isCapital: true, localities: [] }],
          },
          {
            id: "catalonia",
            name: "Catalonia",
            cities: [{ id: "barcelona", name: "Barcelona", localities: [{ id: "22-at", name: "22@", type: "hub" }] }],
          },
        ],
      },
    ],
  },
  {
    id: "north-america",
    name: "North America",
    countries: [
      {
        id: "us",
        name: "United States",
        code: "US",
        flag: "🇺🇸",
        states: [
          {
            id: "ca",
            name: "California",
            code: "CA",
            cities: [
              {
                id: "sf",
                name: "San Francisco",
                localities: [
                  { id: "soma", name: "SoMa", type: "hub" },
                  { id: "fidi", name: "Financial District", type: "hub" },
                ],
              },
              {
                id: "la",
                name: "Los Angeles",
                localities: [
                  { id: "hollywood", name: "Hollywood", type: "district" },
                  { id: "dtla", name: "Downtown LA", type: "hub" },
                  { id: "silicon-beach", name: "Silicon Beach", type: "hub" },
                ],
              },
              {
                id: "sanjose",
                name: "San Jose",
                localities: [{ id: "north-sj", name: "North San Jose", type: "hub" }],
              },
            ],
          },
          {
            id: "ny",
            name: "New York",
            code: "NY",
            cities: [
              {
                id: "nyc",
                name: "New York City",
                localities: [
                  { id: "manhattan", name: "Manhattan", type: "hub" },
                  { id: "wall-street", name: "Wall Street", type: "hub" },
                  { id: "midtown", name: "Midtown", type: "district" },
                  { id: "brooklyn", name: "Brooklyn", type: "district" },
                ],
              },
            ],
          },
          {
            id: "tx",
            name: "Texas",
            code: "TX",
            cities: [
              { id: "austin", name: "Austin", isCapital: true, localities: [{ id: "downtown-austin", name: "Downtown", type: "hub" }] },
              { id: "houston", name: "Houston", localities: [{ id: "energy-corridor", name: "Energy Corridor", type: "hub" }] },
              { id: "dallas", name: "Dallas", localities: [] },
            ],
          },
          {
            id: "wa",
            name: "Washington",
            code: "WA",
            cities: [
              {
                id: "seattle",
                name: "Seattle",
                localities: [
                  { id: "south-lake-union", name: "South Lake Union", type: "hub" },
                  { id: "downtown-seattle", name: "Downtown", type: "hub" },
                ],
              },
            ],
          },
          {
            id: "ma",
            name: "Massachusetts",
            code: "MA",
            cities: [
              {
                id: "boston",
                name: "Boston",
                isCapital: true,
                localities: [
                  { id: "cambridge", name: "Cambridge", type: "hub" },
                  { id: "seaport", name: "Seaport", type: "hub" },
                ],
              },
            ],
          },
          {
            id: "dc",
            name: "Washington D.C.",
            code: "DC",
            cities: [
              {
                id: "washington",
                name: "Washington D.C.",
                isCapital: true,
                localities: [
                  { id: "capitol-hill", name: "Capitol Hill", type: "capital" },
                  { id: "k-street", name: "K Street", type: "hub" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "ca",
        name: "Canada",
        code: "CA",
        flag: "🇨🇦",
        states: [
          {
            id: "ontario",
            name: "Ontario",
            cities: [
              {
                id: "toronto",
                name: "Toronto",
                localities: [
                  { id: "bay-street", name: "Bay Street", type: "hub" },
                  { id: "downtown-toronto", name: "Downtown", type: "hub" },
                ],
              },
              { id: "ottawa", name: "Ottawa", isCapital: true, localities: [] },
            ],
          },
          {
            id: "bc",
            name: "British Columbia",
            cities: [
              { id: "vancouver", name: "Vancouver", localities: [{ id: "downtown-van", name: "Downtown", type: "hub" }] },
            ],
          },
          {
            id: "quebec-p",
            name: "Quebec",
            cities: [
              { id: "montreal", name: "Montreal", localities: [] },
            ],
          },
        ],
      },
      {
        id: "mx",
        name: "Mexico",
        code: "MX",
        flag: "🇲🇽",
        states: [
          {
            id: "cdmx",
            name: "Mexico City",
            cities: [
              {
                id: "mexico-city",
                name: "Mexico City",
                isCapital: true,
                localities: [{ id: "polanco", name: "Polanco", type: "hub" }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "south-america",
    name: "South America",
    countries: [
      {
        id: "br",
        name: "Brazil",
        code: "BR",
        flag: "🇧🇷",
        states: [
          {
            id: "sao-paulo-s",
            name: "São Paulo State",
            cities: [
              {
                id: "sao-paulo",
                name: "São Paulo",
                localities: [{ id: "faria-lima", name: "Faria Lima", type: "hub" }],
              },
            ],
          },
          {
            id: "rio-s",
            name: "Rio de Janeiro State",
            cities: [
              { id: "rio", name: "Rio de Janeiro", localities: [] },
            ],
          },
        ],
      },
      {
        id: "ar",
        name: "Argentina",
        code: "AR",
        flag: "🇦🇷",
        states: [
          {
            id: "buenos-aires-p",
            name: "Buenos Aires Province",
            cities: [
              { id: "buenos-aires", name: "Buenos Aires", isCapital: true, localities: [{ id: "puerto-madero", name: "Puerto Madero", type: "hub" }] },
            ],
          },
        ],
      },
      {
        id: "cl",
        name: "Chile",
        code: "CL",
        flag: "🇨🇱",
        states: [
          {
            id: "santiago-r",
            name: "Santiago Metropolitan",
            cities: [{ id: "santiago", name: "Santiago", isCapital: true, localities: [] }],
          },
        ],
      },
      {
        id: "co",
        name: "Colombia",
        code: "CO",
        flag: "🇨🇴",
        states: [
          {
            id: "bogota-d",
            name: "Bogotá D.C.",
            cities: [{ id: "bogota", name: "Bogotá", isCapital: true, localities: [] }],
          },
        ],
      },
    ],
  },
  {
    id: "africa",
    name: "Africa",
    countries: [
      {
        id: "za",
        name: "South Africa",
        code: "ZA",
        flag: "🇿🇦",
        states: [
          {
            id: "gauteng",
            name: "Gauteng",
            cities: [
              { id: "johannesburg", name: "Johannesburg", localities: [{ id: "sandton", name: "Sandton", type: "hub" }] },
              { id: "pretoria", name: "Pretoria", isCapital: true, localities: [] },
            ],
          },
          {
            id: "western-cape",
            name: "Western Cape",
            cities: [{ id: "cape-town", name: "Cape Town", localities: [] }],
          },
        ],
      },
      {
        id: "ng",
        name: "Nigeria",
        code: "NG",
        flag: "🇳🇬",
        states: [
          {
            id: "lagos-s",
            name: "Lagos State",
            cities: [
              { id: "lagos", name: "Lagos", localities: [{ id: "victoria-island", name: "Victoria Island", type: "hub" }] },
            ],
          },
        ],
      },
      {
        id: "ke",
        name: "Kenya",
        code: "KE",
        flag: "🇰🇪",
        states: [
          {
            id: "nairobi-c",
            name: "Nairobi County",
            cities: [{ id: "nairobi", name: "Nairobi", isCapital: true, localities: [] }],
          },
        ],
      },
      {
        id: "eg",
        name: "Egypt",
        code: "EG",
        flag: "🇪🇬",
        states: [
          {
            id: "cairo-g",
            name: "Cairo Governorate",
            cities: [{ id: "cairo", name: "Cairo", isCapital: true, localities: [] }],
          },
        ],
      },
    ],
  },
  {
    id: "oceania",
    name: "Oceania",
    countries: [
      {
        id: "au",
        name: "Australia",
        code: "AU",
        flag: "🇦🇺",
        states: [
          {
            id: "nsw",
            name: "New South Wales",
            code: "NSW",
            cities: [
              {
                id: "sydney",
                name: "Sydney",
                localities: [
                  { id: "cbd-sydney", name: "CBD", type: "hub" },
                  { id: "north-sydney", name: "North Sydney", type: "hub" },
                ],
              },
            ],
          },
          {
            id: "vic",
            name: "Victoria",
            code: "VIC",
            cities: [
              { id: "melbourne", name: "Melbourne", localities: [{ id: "docklands", name: "Docklands", type: "hub" }] },
            ],
          },
          {
            id: "act",
            name: "Australian Capital Territory",
            code: "ACT",
            cities: [{ id: "canberra", name: "Canberra", isCapital: true, localities: [] }],
          },
        ],
      },
      {
        id: "nz",
        name: "New Zealand",
        code: "NZ",
        flag: "🇳🇿",
        states: [
          {
            id: "auckland-r",
            name: "Auckland Region",
            cities: [{ id: "auckland", name: "Auckland", localities: [] }],
          },
          {
            id: "wellington-r",
            name: "Wellington Region",
            cities: [{ id: "wellington", name: "Wellington", isCapital: true, localities: [] }],
          },
        ],
      },
    ],
  },
  {
    id: "antarctica",
    name: "Antarctica",
    countries: [], // No permanent population
  },
];

// Helper functions
export function getContinentById(id: string): Continent | undefined {
  return GEO_HIERARCHY.find(c => c.id === id);
}

export function getCountryById(id: string): Country | undefined {
  for (const continent of GEO_HIERARCHY) {
    const country = continent.countries.find(c => c.id === id);
    if (country) return country;
  }
  return undefined;
}

export function getCountryByCode(code: string): Country | undefined {
  for (const continent of GEO_HIERARCHY) {
    const country = continent.countries.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (country) return country;
  }
  return undefined;
}

export function getStateById(countryId: string, stateId: string): State | undefined {
  const country = getCountryById(countryId);
  return country?.states.find(s => s.id === stateId);
}

export function getCityById(countryId: string, stateId: string, cityId: string): City | undefined {
  const state = getStateById(countryId, stateId);
  return state?.cities.find(c => c.id === cityId);
}

export function getAllCountries(): Country[] {
  return GEO_HIERARCHY.flatMap(continent => continent.countries);
}

export function getContinentForCountry(countryCode: string): Continent | undefined {
  return GEO_HIERARCHY.find(continent => 
    continent.countries.some(c => c.code.toLowerCase() === countryCode.toLowerCase())
  );
}

// Map country codes to continent IDs for filtering
export const COUNTRY_TO_CONTINENT: Record<string, string> = {};
GEO_HIERARCHY.forEach(continent => {
  continent.countries.forEach(country => {
    COUNTRY_TO_CONTINENT[country.code.toUpperCase()] = continent.id;
  });
});

// Export continent list for quick access
export const CONTINENTS = GEO_HIERARCHY.map(c => ({ id: c.id, name: c.name, countryCount: c.countries.length }));
