import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RefreshCw, CreditCard, AlertCircle, Mail, Clock, CheckCircle2 } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
                <RefreshCw className="w-4 h-4" />
                Legal Document
              </div>
              <h1 className="font-display text-4xl font-bold mb-4">Refund Policy</h1>
              <p className="text-muted-foreground">
                Last updated: January 10, 2026
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  Service Notice
                </h2>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 not-prose">
                  <p className="text-lg font-medium text-green-600 dark:text-green-400 mb-2">
                    NEWSTACK is Accessible to All
                  </p>
                  <p className="text-muted-foreground">
                    NEWSTACK is a news intelligence platform accessible to everyone. We do not charge subscription fees for core features. Since there are no mandatory paid services, refunds are generally not applicable.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <CreditCard className="w-6 h-6 text-primary" />
                  Voluntary Donations
                </h2>
                <p>
                  NEWSTACK operates on a donation-based model. Users may choose to support us through voluntary donations via our Support page.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Donation Refund Policy</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Donations are voluntary:</strong> All donations are made voluntarily to support NEWSTACK's operations.</li>
                  <li><strong>Non-refundable by default:</strong> Donations are generally non-refundable as they represent support for our service.</li>
                  <li><strong>Exceptions:</strong> We may consider refunds in cases of:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Duplicate charges</li>
                      <li>Unauthorized transactions</li>
                      <li>Technical errors resulting in incorrect amounts</li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                  Refund Request Timeline
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Refund requests must be submitted within <strong>7 days</strong> of the transaction</li>
                  <li>We will review requests within <strong>3-5 business days</strong></li>
                  <li>Approved refunds will be processed within <strong>5-10 business days</strong></li>
                  <li>Refunds will be credited to the original payment method</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <AlertCircle className="w-6 h-6 text-primary" />
                  Non-Refundable Situations
                </h2>
                <p>Refunds will not be provided for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Change of mind after making a voluntary donation</li>
                  <li>Donations made more than 7 days ago</li>
                  <li>Requests without valid proof of transaction</li>
                  <li>Account violations or terminations due to Terms of Service breaches</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">How to Request a Refund</h2>
                <p>To request a refund:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Email us at <strong>support@newstack.live</strong></li>
                  <li>Include your transaction ID or payment receipt</li>
                  <li>Provide the email address used for the donation</li>
                  <li>Explain the reason for your refund request</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Future Premium Services</h2>
                <p>
                  If we introduce premium features in the future, this Refund Policy will be updated to include specific terms for paid subscriptions. Any such changes will be communicated to users in advance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                  Contact Us
                </h2>
                <p>
                  For refund inquiries or questions about this policy:
                </p>
                <ul className="list-none pl-0 mt-4 space-y-2">
                  <li><strong>Email:</strong> support@newstack.live</li>
                  <li><strong>Subject Line:</strong> "Refund Request - [Your Transaction ID]"</li>
                  <li><strong>Company:</strong> Cropxon Innovations Pvt Ltd</li>
                </ul>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
