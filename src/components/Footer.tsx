import { ExternalLink, Globe } from "lucide-react";
import { OpenNewsGlobalCTA } from "@/components/OpenNewsGlobalCTA";
import { FooterBrand } from "@/components/footer/FooterBrand";
import { FooterLinkColumns } from "@/components/footer/FooterLinkColumns";
import { FooterSupportPanel } from "@/components/footer/FooterSupportPanel";

export function Footer() {
  return (
    <>
      <OpenNewsGlobalCTA />
      <footer className="border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            <FooterBrand />
            <FooterLinkColumns />
          </div>

          <FooterSupportPanel />

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-background/30 backdrop-blur-md p-4 flex items-center gap-4">
              <img
                src="/qr/newstack-ios-soon.svg"
                alt="NEWSTACK iOS app QR code placeholder"
                className="w-20 h-20 rounded-lg border border-border/40 bg-background p-1"
              />
              <div>
                <p className="font-medium text-sm">iOS App Store</p>
                <p className="text-xs text-muted-foreground">Download via QR (Coming Soon)</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/30 backdrop-blur-md p-4 flex items-center gap-4">
              <img
                src="/qr/newstack-playstore-soon.svg"
                alt="NEWSTACK Play Store QR code placeholder"
                className="w-20 h-20 rounded-lg border border-border/40 bg-background p-1"
              />
              <div>
                <p className="font-medium text-sm">Google Play Store</p>
                <p className="text-xs text-muted-foreground">Download via QR (Coming Soon)</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <p className="text-sm text-muted-foreground">© 2026 NEWSTACK</p>
              <span className="hidden sm:inline text-muted-foreground">·</span>
              <a
                href="https://originxlabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                A product of <span className="font-medium">ORIGINX LABS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Made with</span>
              <span className="inline-block animate-[pulse_1.2s_ease-in-out_infinite] text-destructive text-sm">♥</span>
              <span>by</span>
              <a
                href="https://www.abhishekpanda.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors underline underline-offset-2"
              >
                Abhishek Panda
              </a>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-foreground transition-colors" type="button">
                <Globe className="w-4 h-4" />
                English
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
