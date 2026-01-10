import React, { createContext, useContext, useEffect, useState } from "react";
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
  setCountry: (code: string) => Promise<void>;
  detectLocation: () => Promise<void>;
  loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY_LANGUAGE = "newstack_language";
const STORAGE_KEY_COUNTRY = "newstack_country";

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

  // Load preferences from profile or localStorage
  useEffect(() => {
    if (languages.length === 0 || countries.length === 0) return;

    const loadPreferences = async () => {
      let langCode = "en";
      let countryCode = "US";

      if (profile) {
        // Use profile preferences if logged in
        langCode = profile.language_code || "en";
        countryCode = profile.country_code || "US";
      } else {
        // Use localStorage for non-logged in users
        langCode = localStorage.getItem(STORAGE_KEY_LANGUAGE) || "en";
        countryCode = localStorage.getItem(STORAGE_KEY_COUNTRY) || "";
        
        if (!countryCode) {
          // Detect location if no stored preference
          await detectLocation();
          return;
        }
      }

      const lang = languages.find((l) => l.code === langCode);
      const ctry = countries.find((c) => c.code === countryCode);
      
      if (lang) setLanguageState(lang);
      if (ctry) setCountryState(ctry);
    };

    loadPreferences();
  }, [profile, languages, countries]);

  const detectLocation = async () => {
    try {
      // Use a free geolocation API
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      
      if (data.country_code) {
        const ctry = countries.find((c) => c.code === data.country_code);
        if (ctry) {
          setCountryState(ctry);
          localStorage.setItem(STORAGE_KEY_COUNTRY, ctry.code);
          
          // Set language based on country default
          if (ctry.default_language) {
            const lang = languages.find((l) => l.code === ctry.default_language);
            if (lang) {
              setLanguageState(lang);
              localStorage.setItem(STORAGE_KEY_LANGUAGE, lang.code);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to detect location:", error);
      // Default to US/English
      const usCountry = countries.find((c) => c.code === "US");
      const enLang = languages.find((l) => l.code === "en");
      if (usCountry) setCountryState(usCountry);
      if (enLang) setLanguageState(enLang);
    }
  };

  const setLanguage = async (code: string) => {
    const lang = languages.find((l) => l.code === code);
    if (!lang) return;

    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY_LANGUAGE, code);

    if (user && profile) {
      await updateProfile({ language_code: code });
    }
  };

  const setCountry = async (code: string) => {
    const ctry = countries.find((c) => c.code === code);
    if (!ctry) return;

    setCountryState(ctry);
    localStorage.setItem(STORAGE_KEY_COUNTRY, code);

    if (user && profile) {
      await updateProfile({ country_code: code });
    }
  };

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
