import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { socialLinks } from "@/components/footer/footer-config";

function ThreadsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <path
        d="M15.5 10.5c-.3-2.4-1.9-3.8-4.5-3.8-2.6 0-4.4 1.8-4.4 4.4v1.8c0 2.7 1.8 4.4 4.6 4.4 2.2 0 3.8-1.1 4.4-3.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15.8" cy="12.2" r="2.7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.8 9.5v5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FooterBrand() {
  return (
    <div className="col-span-2">
      <Logo size="md" className="mb-4" />
      <p className="text-sm text-muted-foreground mb-4 max-w-xs leading-relaxed">
        An open, neutral intelligence layer built from public sources.
        We organize facts without partisan bias.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {socialLinks.map((social) => (
          <Button
            key={social.label}
            variant="ghost"
            size="icon"
            asChild
            className="rounded-xl border border-border/50 bg-background/30 backdrop-blur-md hover:bg-background/70 transition-all"
          >
            <a href={social.href} aria-label={social.label} target="_blank" rel="noopener noreferrer">
              <social.icon className="w-4 h-4" />
            </a>
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="rounded-xl border border-border/50 bg-background/30 backdrop-blur-md hover:bg-background/70 transition-all"
        >
          <a href="https://www.threads.net/@newstacklive" aria-label="Threads" target="_blank" rel="noopener noreferrer">
            <ThreadsIcon />
          </a>
        </Button>
      </div>
    </div>
  );
}
