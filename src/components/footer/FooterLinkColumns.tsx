import { Link } from "react-router-dom";
import { footerLinks } from "@/components/footer/footer-config";

export function FooterLinkColumns() {
  return (
    <>
      {Object.entries(footerLinks).map(([title, links]) => (
        <div key={title}>
          <h4 className="font-display font-semibold mb-4 text-sm">{title}</h4>
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.name}>
                <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
