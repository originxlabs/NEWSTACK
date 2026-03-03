import { useState } from "react";
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Copy, Check, Instagram, Link2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SocialShareMenuProps {
  title: string;
  summary?: string;
  url?: string;
  className?: string;
  size?: "sm" | "icon";
}

export function SocialShareMenu({ 
  title, 
  summary, 
  url, 
  className,
  size = "icon" 
}: SocialShareMenuProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = summary ? `${title}\n\n${summary}` : title;
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: summary || title,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fall through to menu
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
    threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
  };

  const openShareWindow = (url: string, name: string) => {
    window.open(url, name, "width=600,height=400,scrollbars=yes");
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== "undefined" && navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={size} 
          className={className}
          onClick={(e) => {
            // Try native share first on mobile
            if (hasNativeShare) {
              e.preventDefault();
              handleNativeShare();
            }
          }}
        >
          <Share2 className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.twitter, "twitter")}>
          <Twitter className="w-4 h-4 mr-2" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.whatsapp, "whatsapp")}>
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.facebook, "facebook")}>
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.linkedin, "linkedin")}>
          <Linkedin className="w-4 h-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.threads, "threads")}>
          <Instagram className="w-4 h-4 mr-2" />
          Threads
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
