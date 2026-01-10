import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Headphones, Coffee, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TTSLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  usedCount: number;
  maxCount: number;
}

export function TTSLimitModal({ isOpen, onClose, usedCount, maxCount }: TTSLimitModalProps) {
  const handleDonate = () => {
    // In production, integrate with Razorpay
    window.open("https://razorpay.com", "_blank");
    onClose();
  };

  const handleUpgrade = () => {
    window.location.href = "/pricing";
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          {/* Decorative header */}
          <div className="h-32 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-xl"
            >
              <Headphones className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <div className="p-6 text-center">
            <h2 className="font-display text-2xl font-bold mb-2">
              You've reached today's limit
            </h2>
            <p className="text-muted-foreground mb-2">
              {usedCount} of {maxCount} free audio plays used
            </p>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-gradient-to-r from-primary to-purple-500"
                style={{ width: `${(usedCount / maxCount) * 100}%` }}
              />
            </div>

            <div className="p-4 rounded-xl bg-muted/50 mb-6 text-left">
              <p className="text-sm leading-relaxed">
                <strong className="text-primary">NEWSTACK is free and independent.</strong>
                <br /><br />
                We don't use paywalls or force subscriptions. Your support keeps quality journalism accessible to everyone.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                onClick={handleDonate}
              >
                <Heart className="w-5 h-5 fill-current" />
                Support NEWSTACK
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 gap-2"
                onClick={handleUpgrade}
              >
                <Sparkles className="w-5 h-5" />
                Upgrade to Premium
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={onClose}
              >
                Continue Reading Instead
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Your limit resets at midnight. Premium members get unlimited audio.
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
