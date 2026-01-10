import { useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
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

export function LanguageSelector() {
  const { language, country, languages, countries, setLanguage, setCountry } = usePreferences();
  const [open, setOpen] = useState(false);

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
      <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto bg-popover">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Language & Region
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Language
        </DropdownMenuLabel>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between"
          >
            <span>
              {lang.native_name} <span className="text-muted-foreground">({lang.name})</span>
            </span>
            {language?.code === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Country
        </DropdownMenuLabel>
        {countries.map((ctry) => (
          <DropdownMenuItem
            key={ctry.code}
            onClick={() => setCountry(ctry.code)}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span>{ctry.flag_emoji}</span>
              <span>{ctry.name}</span>
            </span>
            {country?.code === ctry.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
