import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Language {
  code: string;
  name: string;
  native_name: string;
  direction: "ltr" | "rtl";
}

interface Country {
  code: string;
  name: string;
  native_name: string | null;
  flag_emoji: string | null;
  default_language: string | null;
}

interface PreferencesContextType {
  language: Language | null;
  country: Country | null;
  languages: Language[];
  countries: Country[];
  setLanguage: (code: string) => Promise<void>;
  setCountry: (code: string, autoSwitchLanguage?: boolean) => Promise<void>;
  detectLocation: () => Promise<void>;
  loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY_LANGUAGE = "newstack_language";
const STORAGE_KEY_COUNTRY = "newstack_country";

// Country to default language mapping (including regional languages)
const countryDefaultLanguages: Record<string, string> = {
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  IN: "hi", // India defaults to Hindi
  DE: "de",
  FR: "fr",
  ES: "es",
  IT: "it",
  JP: "ja",
  CN: "zh",
  KR: "ko",
  BR: "pt",
  MX: "es",
  RU: "ru",
  AE: "ar",
  SA: "ar",
  SG: "en",
};

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, updateProfile } = useAuth();
  const [language, setLanguageState] = useState<Language | null>(null);
  const [country, setCountryState] = useState<Country | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch languages and countries on mount
  useEffect(() => {
    const fetchData = async () => {
      const [langResult, countryResult] = await Promise.all([
        supabase.from("languages").select("*"),
        supabase.from("countries").select("*"),
      ]);

      if (langResult.data) {
        setLanguages(langResult.data as Language[]);
      }
      if (countryResult.data) {
        setCountries(countryResult.data as Country[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const setLanguage = useCallback(async (code: string) => {
    const lang = languages.find((l) => l.code === code);
    if (!lang) return;

    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY_LANGUAGE, code);

    if (user && profile) {
      await updateProfile({ language_code: code });
    }
  }, [languages, user, profile, updateProfile]);

  const setCountry = useCallback(async (code: string, autoSwitchLanguage = true) => {
    const ctry = countries.find((c) => c.code === code);
    if (!ctry) return;

    setCountryState(ctry);
    localStorage.setItem(STORAGE_KEY_COUNTRY, code);

    // Auto-switch language based on country
    if (autoSwitchLanguage) {
      const defaultLangCode = countryDefaultLanguages[code] || ctry.default_language || "en";
      const lang = languages.find((l) => l.code === defaultLangCode);
      if (lang) {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY_LANGUAGE, defaultLangCode);
        
        if (user && profile) {
          await updateProfile({ country_code: code, language_code: defaultLangCode });
          return;
        }
      }
    }

    if (user && profile) {
      await updateProfile({ country_code: code });
    }
  }, [countries, languages, user, profile, updateProfile]);

  const detectLocation = useCallback(async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      
      if (data.country_code) {
        const ctry = countries.find((c) => c.code === data.country_code);
        if (ctry) {
          setCountryState(ctry);
          localStorage.setItem(STORAGE_KEY_COUNTRY, ctry.code);
          
          // Set language based on country
          const defaultLangCode = countryDefaultLanguages[ctry.code] || ctry.default_language || "en";
          const lang = languages.find((l) => l.code === defaultLangCode);
          if (lang) {
            setLanguageState(lang);
            localStorage.setItem(STORAGE_KEY_LANGUAGE, lang.code);
          }
        } else {
          // Country not in our list, default to US/English
          const usCountry = countries.find((c) => c.code === "US");
          const enLang = languages.find((l) => l.code === "en");
          if (usCountry) setCountryState(usCountry);
          if (enLang) setLanguageState(enLang);
        }
      }
    } catch (error) {
      console.error("Failed to detect location:", error);
      const usCountry = countries.find((c) => c.code === "US");
      const enLang = languages.find((l) => l.code === "en");
      if (usCountry) setCountryState(usCountry);
      if (enLang) setLanguageState(enLang);
    }
  }, [countries, languages]);

  // Load preferences from profile or localStorage
  useEffect(() => {
    if (languages.length === 0 || countries.length === 0) return;

    const loadPreferences = async () => {
      let langCode = "en";
      let countryCode = "";

      if (profile) {
        langCode = profile.language_code || "en";
        countryCode = profile.country_code || "";
      } else {
        langCode = localStorage.getItem(STORAGE_KEY_LANGUAGE) || "";
        countryCode = localStorage.getItem(STORAGE_KEY_COUNTRY) || "";
      }

      if (!countryCode) {
        await detectLocation();
        return;
      }

      const lang = languages.find((l) => l.code === langCode);
      const ctry = countries.find((c) => c.code === countryCode);
      
      if (ctry) setCountryState(ctry);
      if (lang) {
        setLanguageState(lang);
      } else if (ctry) {
        // If no language set, use country default
        const defaultLangCode = countryDefaultLanguages[ctry.code] || ctry.default_language || "en";
        const defaultLang = languages.find((l) => l.code === defaultLangCode);
        if (defaultLang) setLanguageState(defaultLang);
      }
    };

    loadPreferences();
  }, [profile, languages, countries, detectLocation]);

  return (
    <PreferencesContext.Provider
      value={{
        language,
        country,
        languages,
        countries,
        setLanguage,
        setCountry,
        detectLocation,
        loading,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
