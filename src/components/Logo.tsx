import { Link } from "react-router-dom";
import { NLogoSquare } from "./NLogo";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 48, text: "text-3xl" },
  };

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center text-foreground">
        <NLogoSquare size={sizes[size].icon} />
      </div>
      {showText && (
        <span className={`font-display font-bold ${sizes[size].text} tracking-tight`}>
          NEW<span className="text-primary">STACK</span>
        </span>
      )}
    </Link>
  );
}
