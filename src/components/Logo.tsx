import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: { icon: "w-6 h-6", text: "text-lg" },
    md: { icon: "w-8 h-8", text: "text-xl" },
    lg: { icon: "w-12 h-12", text: "text-3xl" },
  };

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes[size].icon} rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25`}>
        <svg viewBox="0 0 24 24" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stacked layers */}
          <rect x="4" y="14" width="16" height="4" rx="1" fill="white" fillOpacity="0.4" />
          <rect x="5" y="9" width="14" height="4" rx="1" fill="white" fillOpacity="0.6" />
          <rect x="6" y="4" width="12" height="4" rx="1" fill="white" />
          {/* Accent */}
          <circle cx="19" cy="5" r="2" fill="#f97316" />
        </svg>
      </div>
      {showText && (
        <span className={`font-display font-bold ${sizes[size].text} tracking-tight`}>
          NEW<span className="text-primary">STACK</span>
        </span>
      )}
    </Link>
  );
}
