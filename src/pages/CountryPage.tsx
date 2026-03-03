import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WorldCountryDashboard } from "@/components/world/WorldCountryDashboard";
import { 
  getCountryByCode,
} from "@/lib/geo-hierarchy";

// Country flag/info database
const COUNTRY_INFO: Record<string, { name: string; flag: string }> = {
  US: { name: "United States", flag: "🇺🇸" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  IN: { name: "India", flag: "🇮🇳" },
  CN: { name: "China", flag: "🇨🇳" },
  JP: { name: "Japan", flag: "🇯🇵" },
  DE: { name: "Germany", flag: "🇩🇪" },
  FR: { name: "France", flag: "🇫🇷" },
  AU: { name: "Australia", flag: "🇦🇺" },
  CA: { name: "Canada", flag: "🇨🇦" },
  BR: { name: "Brazil", flag: "🇧🇷" },
  RU: { name: "Russia", flag: "🇷🇺" },
  IT: { name: "Italy", flag: "🇮🇹" },
  ES: { name: "Spain", flag: "🇪🇸" },
  MX: { name: "Mexico", flag: "🇲🇽" },
  KR: { name: "South Korea", flag: "🇰🇷" },
  ID: { name: "Indonesia", flag: "🇮🇩" },
  NL: { name: "Netherlands", flag: "🇳🇱" },
  SA: { name: "Saudi Arabia", flag: "🇸🇦" },
  AE: { name: "UAE", flag: "🇦🇪" },
  SG: { name: "Singapore", flag: "🇸🇬" },
  ZA: { name: "South Africa", flag: "🇿🇦" },
  NG: { name: "Nigeria", flag: "🇳🇬" },
  EG: { name: "Egypt", flag: "🇪🇬" },
  PK: { name: "Pakistan", flag: "🇵🇰" },
  BD: { name: "Bangladesh", flag: "🇧🇩" },
  VN: { name: "Vietnam", flag: "🇻🇳" },
  TH: { name: "Thailand", flag: "🇹🇭" },
  MY: { name: "Malaysia", flag: "🇲🇾" },
  PH: { name: "Philippines", flag: "🇵🇭" },
  QA: { name: "Qatar", flag: "🇶🇦" },
  // Middle East
  IR: { name: "Iran", flag: "🇮🇷" },
  IQ: { name: "Iraq", flag: "🇮🇶" },
  AF: { name: "Afghanistan", flag: "🇦🇫" },
  // Central Asia
  KZ: { name: "Kazakhstan", flag: "🇰🇿" },
  UZ: { name: "Uzbekistan", flag: "🇺🇿" },
  TM: { name: "Turkmenistan", flag: "🇹🇲" },
  TJ: { name: "Tajikistan", flag: "🇹🇯" },
  KG: { name: "Kyrgyzstan", flag: "🇰🇬" },
  // South America
  AR: { name: "Argentina", flag: "🇦🇷" },
  // Europe
  PL: { name: "Poland", flag: "🇵🇱" },
  UA: { name: "Ukraine", flag: "🇺🇦" },
  TR: { name: "Turkey", flag: "🇹🇷" },
  // Southeast Asia
  KH: { name: "Cambodia", flag: "🇰🇭" },
  MM: { name: "Myanmar", flag: "🇲🇲" },
  LA: { name: "Laos", flag: "🇱🇦" },
  NP: { name: "Nepal", flag: "🇳🇵" },
  LK: { name: "Sri Lanka", flag: "🇱🇰" },
};

export default function CountryPage() {
  const { countryCode } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();

  const upperCountryCode = countryCode?.toUpperCase() || "";
  const countryInfo = COUNTRY_INFO[upperCountryCode];
  const countryFromGeo = getCountryByCode(upperCountryCode);
  
  const countryName = countryInfo?.name || countryFromGeo?.name || countryCode || "Country";
  const countryFlag = countryInfo?.flag || countryFromGeo?.flag || "🌍";

  // Redirect to India page for IN
  if (upperCountryCode === "IN") {
    navigate("/india");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-14" />
      
      <main className="container mx-auto px-4 py-6">
        <WorldCountryDashboard
          countryCode={upperCountryCode}
          countryName={countryName}
          countryFlag={countryFlag}
        />
      </main>

      <Footer />
    </div>
  );
}
