import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { usePreferences } from "@/contexts/PreferencesContext";
import { toast } from "sonner";

export function LanguageSelector() {
  const { language, country, languages, countries, setLanguage, setCountry } = usePreferences();
  const [open, setOpen] = useState(false);

  const handleCountryChange = async (code: string) => {
    await setCountry(code, true); // Auto-switch language
    const newCountry = countries.find(c => c.code === code);
    if (newCountry) {
      toast.success(`Switched to ${newCountry.flag_emoji} ${newCountry.name}`);
    }
    setOpen(false);
  };

  const handleLanguageChange = async (code: string) => {
    await setLanguage(code);
    const newLang = languages.find(l => l.code === code);
    if (newLang) {
      toast.success(`Language: ${newLang.native_name}`);
    }
  };

  // Group languages by region
  const indianLanguages = languages.filter(l => 
    ["hi", "ta", "te", "kn", "ml", "mr", "gu", "bn", "pa", "or"].includes(l.code)
  );
  const otherLanguages = languages.filter(l => 
    !["hi", "ta", "te", "kn", "ml", "mr", "gu", "bn", "pa", "or"].includes(l.code)
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="h-4 w-4" />
          {country && (
            <span className="absolute -bottom-0.5 -right-0.5 text-xs">
              {country.flag_emoji}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto bg-popover">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Language & Region
        </DropdownMenuLabel>
        
        {/* Current selection */}
        {country && language && (
          <div className="px-2 py-2 text-sm text-muted-foreground bg-muted/50 rounded mx-2 mb-2">
            <div className="flex items-center gap-2">
              <span>{country.flag_emoji}</span>
              <span>{country.name}</span>
              <span className="text-muted-foreground">•</span>
              <span>{language.native_name}</span>
            </div>
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Countries first */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Country (auto-switches language)
        </DropdownMenuLabel>
        {countries.map((ctry) => (
          <DropdownMenuItem
            key={ctry.code}
            onClick={() => handleCountryChange(ctry.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{ctry.flag_emoji}</span>
              <span>{ctry.name}</span>
            </span>
            {country?.code === ctry.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        {/* Global Languages */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Global Languages
        </DropdownMenuLabel>
        {otherLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>
              {lang.native_name} <span className="text-muted-foreground text-xs">({lang.name})</span>
            </span>
            {language?.code === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}

        {/* Indian Languages */}
        {indianLanguages.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
              🇮🇳 Indian Languages (Sarvam AI)
            </DropdownMenuLabel>
            {indianLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>
                  {lang.native_name} <span className="text-muted-foreground text-xs">({lang.name})</span>
                </span>
                {language?.code === lang.code && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
