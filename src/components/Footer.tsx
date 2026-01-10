import { Link } from "react-router-dom";
import { Twitter, Github, Linkedin, Mail, Globe, ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const footerLinks = {
  Product: [
    { name: "Feed", href: "/" },
    { name: "Listen", href: "/listen" },
    { name: "Places", href: "/places" },
    { name: "World", href: "/world" },
  ],
  Explore: [
    { name: "World News", href: "/world" },
    { name: "Topics", href: "/topics" },
    { name: "Places", href: "/places" },
    { name: "Profile", href: "/profile" },
  ],
  Support: [
    { name: "Support Us", href: "/support" },
    { name: "Donate", href: "/support" },
    { name: "Help Center", href: "/support" },
    { name: "Contact", href: "/support" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Licenses", href: "/licenses" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/newstack", label: "Twitter" },
  { icon: Github, href: "https://github.com/cropxon", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/company/cropxon", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@newstack.live", label: "Email" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Newsletter Section */}
        <div className="mb-12 pb-12 border-b border-border/50">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-display text-2xl font-bold mb-2">Stay Informed</h3>
            <p className="text-muted-foreground mb-6">
              Get the latest news and updates delivered to your inbox.
            </p>
            <NewsletterSignup />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Logo size="md" className="mb-4" />
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              The world's most intelligent news and place intelligence platform. AI-powered, personalized, and always up to date.
            </p>
            <div className="flex items-center gap-2 mb-4">
              {socialLinks.map((social) => (
                <Button key={social.label} variant="ghost" size="icon" asChild>
                  <a href={social.href} aria-label={social.label} target="_blank" rel="noopener noreferrer">
                    <social.icon className="w-4 h-4" />
                  </a>
                </Button>
              ))}
            </div>
            <Link 
              to="/support" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-colors"
            >
              <Heart className="w-4 h-4" />
              Support NEWSTACK
            </Link>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 NEWSTACK. All rights reserved.
            </p>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <a 
              href="https://cropxon.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Powered by <span className="font-semibold text-primary">Cropxon Innovations Pvt Ltd</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Globe className="w-4 h-4" />
              English
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
