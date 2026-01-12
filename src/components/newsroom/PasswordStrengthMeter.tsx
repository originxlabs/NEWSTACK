import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p) => /\d/.test(p) },
  { label: "Contains special character", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const analysis = useMemo(() => {
    const passed = requirements.filter((r) => r.test(password)).length;
    const total = requirements.length;
    const percentage = (passed / total) * 100;

    let strength: "weak" | "fair" | "good" | "strong" = "weak";
    let color = "bg-red-500";

    if (passed >= 5) {
      strength = "strong";
      color = "bg-emerald-500";
    } else if (passed >= 4) {
      strength = "good";
      color = "bg-green-500";
    } else if (passed >= 3) {
      strength = "fair";
      color = "bg-amber-500";
    } else {
      strength = "weak";
      color = "bg-red-500";
    }

    return { passed, total, percentage, strength, color };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              "font-medium capitalize",
              analysis.strength === "strong" && "text-emerald-500",
              analysis.strength === "good" && "text-green-500",
              analysis.strength === "fair" && "text-amber-500",
              analysis.strength === "weak" && "text-red-500"
            )}
          >
            {analysis.strength}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", analysis.color)}
            style={{ width: `${analysis.percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <div
              key={req.label}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                passed ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <X className="w-3 h-3 text-muted-foreground/50" />
              )}
              {req.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
