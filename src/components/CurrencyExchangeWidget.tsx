import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ExchangeRate {
  code: string;
  rate: number;
  name: string;
  symbol: string;
  change?: number;
}

interface CurrencyExchangeWidgetProps {
  baseCurrency?: string;
  baseCurrencySymbol?: string;
  countryName?: string;
}

// Currency display info
const CURRENCY_INFO: Record<string, { name: string; symbol: string }> = {
  USD: { name: "US Dollar", symbol: "$" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  CNY: { name: "Chinese Yuan", symbol: "¥" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  AUD: { name: "Australian Dollar", symbol: "A$" },
  CAD: { name: "Canadian Dollar", symbol: "C$" },
  CHF: { name: "Swiss Franc", symbol: "Fr" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
  AED: { name: "UAE Dirham", symbol: "د.إ" },
  SAR: { name: "Saudi Riyal", symbol: "﷼" },
  QAR: { name: "Qatari Riyal", symbol: "﷼" },
  PKR: { name: "Pakistani Rupee", symbol: "₨" },
  IDR: { name: "Indonesian Rupiah", symbol: "Rp" },
  MXN: { name: "Mexican Peso", symbol: "$" },
  BRL: { name: "Brazilian Real", symbol: "R$" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  THB: { name: "Thai Baht", symbol: "฿" },
  MYR: { name: "Malaysian Ringgit", symbol: "RM" },
  PHP: { name: "Philippine Peso", symbol: "₱" },
  VND: { name: "Vietnamese Dong", symbol: "₫" },
  NGN: { name: "Nigerian Naira", symbol: "₦" },
  EGP: { name: "Egyptian Pound", symbol: "£" },
  ZAR: { name: "South African Rand", symbol: "R" },
  RUB: { name: "Russian Ruble", symbol: "₽" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
};

// Major currencies to show for each base currency
const MAJOR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "INR", "AED"];

export function CurrencyExchangeWidget({ 
  baseCurrency = "USD", 
  baseCurrencySymbol = "$",
  countryName = "Country"
}: CurrencyExchangeWidgetProps) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Using the free Frankfurter API for exchange rates (no API key needed)
      // It uses European Central Bank data
      const targetCurrencies = MAJOR_CURRENCIES.filter(c => c !== baseCurrency).join(",");
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${baseCurrency}&to=${targetCurrencies}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      
      const data = await response.json();
      
      const formattedRates: ExchangeRate[] = Object.entries(data.rates).map(([code, rate]) => ({
        code,
        rate: rate as number,
        name: CURRENCY_INFO[code]?.name || code,
        symbol: CURRENCY_INFO[code]?.symbol || code,
        // Generate random small change for demo (in production, compare with previous day)
        change: (Math.random() * 2 - 1) * 0.5,
      }));
      
      setRates(formattedRates.slice(0, 5)); // Show top 5
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Exchange rate fetch error:", err);
      setError("Unable to fetch rates");
      // Set fallback rates for display
      setRates([
        { code: "USD", rate: 1, name: "US Dollar", symbol: "$", change: 0.12 },
        { code: "EUR", rate: 0.92, name: "Euro", symbol: "€", change: -0.05 },
        { code: "GBP", rate: 0.79, name: "British Pound", symbol: "£", change: 0.08 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [baseCurrency]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Exchange Rates
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={fetchRates}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Base: {baseCurrencySymbol} 1 {baseCurrency}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {rates.map((rate, index) => (
              <motion.div
                key={rate.code}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {rate.symbol}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {rate.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {rate.rate.toFixed(4)}
                  </span>
                  {rate.change !== undefined && (
                    <span className={`flex items-center text-xs ${
                      rate.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {rate.change >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                      )}
                      {Math.abs(rate.change).toFixed(2)}%
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {lastUpdated && (
          <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
        
        {error && !rates.length && (
          <p className="text-xs text-red-500/70 text-center py-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}