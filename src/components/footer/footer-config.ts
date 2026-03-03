import { Github, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";

export const footerLinks = {
  Product: [
    { name: "OpenNews", href: "/opennews" },
    { name: "Public Grievances", href: "/public-grievances" },
    { name: "Open Politics", href: "/open-politics" },
    { name: "News", href: "/news" },
    { name: "Discussions", href: "/discussions" },
    { name: "Trending", href: "/trending" },
    { name: "India", href: "/india" },
    { name: "World", href: "/world" },
    { name: "Places", href: "/places" },
  ],
  Developers: [
    { name: "API Overview", href: "/api" },
    { name: "Documentation", href: "/api/docs" },
    { name: "API Pricing", href: "/api/pricing" },
  ],
  Company: [
    { name: "Contact", href: "/contact" },
    { name: "Newsroom", href: "/newsroom" },
    { name: "RSS Sources", href: "/newsroom/sources" },
    { name: "Ingestion Portal", href: "/ingestion" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Refund Policy", href: "/refund" },
  ],
} as const;

export const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/newstacklive", label: "Instagram" },
  { icon: Twitter, href: "https://x.com/newstacklive", label: "X / Twitter" },
  { icon: Youtube, href: "https://youtube.com/@newstacklive", label: "YouTube" },
  { icon: Linkedin, href: "https://linkedin.com/company/originxlabs", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/originxlabs", label: "GitHub" },
] as const;
