import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Twitter, Github, Linkedin, Mail, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const footerLinks = {
  Product: [
    { name: "Feed", href: "/" },
    { name: "Listen", href: "/listen" },
    { name: "Places", href: "/places" },
    { name: "Pricing", href: "/pricing" },
  ],
  Explore: [
    { name: "World News", href: "/world" },
    { name: "Topics", href: "/topics" },
    { name: "Places", href: "/places" },
    { name: "AI Insights", href: "/places" },
  ],
  Company: [
    { name: "About Us", href: "#about" },
    { name: "Careers", href: "#careers" },
    { name: "Press", href: "#press" },
    { name: "Contact", href: "#contact" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" },
    { name: "Cookie Policy", href: "#cookies" },
    { name: "Licenses", href: "#licenses" },
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Logo size="md" className="mb-4" />
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              The world's most intelligent news and place intelligence platform. AI-powered, personalized, and always up to date.
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <Button key={social.label} variant="ghost" size="icon" asChild>
                  <a href={social.href} aria-label={social.label} target="_blank" rel="noopener noreferrer">
                    <social.icon className="w-4 h-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
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
