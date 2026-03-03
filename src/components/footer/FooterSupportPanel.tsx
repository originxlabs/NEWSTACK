import { Link } from "react-router-dom";
import { HeartHandshake, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportDonationModal } from "@/components/support/SupportDonationModal";

export function FooterSupportPanel() {
  return (
    <div className="mb-8 rounded-2xl border border-primary/25 bg-primary/5 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">Support OpenNews and Unbiased Journalism</p>
          <p className="text-sm text-muted-foreground mt-1">
            Fund independent reporting and file structured public grievances by sector with ticket tracking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SupportDonationModal
            trigger={
              <Button className="inline-flex items-center gap-2">
              <HeartHandshake className="w-4 h-4" />
              Support OpenNews
              </Button>
            }
          />
          <Button asChild variant="outline">
            <Link to="/public-grievances" className="inline-flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4" />
              Public Grievances
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
