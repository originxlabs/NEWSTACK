import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Twitter, Github, Linkedin, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = {
  Product: [
    { name: "Features", href: "#" },
    { name: "Pricing", href: "#" },
    { name: "API", href: "#" },
    { name: "Mobile App", href: "#" },
  ],
  Company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
  ],
  Resources: [
    { name: "Help Center", href: "#" },
    { name: "Guidelines", href: "#" },
    { name: "Partners", href: "#" },
    { name: "Developers", href: "#" },
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "Cookies", href: "#" },
    { name: "Licenses", href: "#" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-sm">N</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                NEW<span className="text-primary">STACK</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              The world's most intelligent news platform. AI-powered, personalized, and always up to date.
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <Button key={social.label} variant="ghost" size="iconSm" asChild>
                  <a href={social.href} aria-label={social.label}>
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
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 NEWSTACK. All rights reserved.
          </p>
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
