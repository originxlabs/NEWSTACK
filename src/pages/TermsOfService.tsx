import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, Shield, AlertTriangle, Users, Ban, Scale, Mail } from "lucide-react";

export default function TermsOfService() {
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
                <FileText className="w-4 h-4" />
                Legal Document
              </div>
              <h1 className="font-display text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">
                Last updated: January 10, 2026
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p>
                  Welcome to NEWSTACK. By accessing or using our Service at newstack.live, you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
                </p>
                <p>
                  NEWSTACK is operated by Cropxon Innovations Pvt Ltd. These Terms govern your use of our AI-powered news aggregation platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  2. Description of Service
                </h2>
                <p>NEWSTACK provides:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>AI-powered news aggregation from verified sources</li>
                  <li>Text-to-speech audio news playback (50 free plays/day)</li>
                  <li>Place-based intelligence and local news</li>
                  <li>Community discussions on news articles</li>
                  <li>Personalized news recommendations</li>
                </ul>
                <p className="mt-4">
                  The Service is provided "as is" without warranties of any kind. We aggregate news from third-party sources and do not create original news content.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Users className="w-6 h-6 text-primary" />
                  3. User Accounts
                </h2>
                <p>When you create an account with us, you must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your password</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
                <p className="mt-4">
                  You must be at least 13 years old to use this Service. By using NEWSTACK, you represent that you meet this age requirement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Ban className="w-6 h-6 text-primary" />
                  4. Prohibited Uses
                </h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Service for any unlawful purpose</li>
                  <li>Post false, misleading, or defamatory content</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Scrape or collect data without permission</li>
                  <li>Use automated systems to access the Service excessively</li>
                  <li>Impersonate any person or entity</li>
                  <li>Interfere with the proper operation of the Service</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
                <h3 className="text-xl font-semibold mt-6 mb-3">Our Content</h3>
                <p>
                  The NEWSTACK name, logo, and platform design are owned by Cropxon Innovations Pvt Ltd. You may not use our branding without written permission.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">News Content</h3>
                <p>
                  News articles aggregated on NEWSTACK belong to their respective publishers. We provide links and citations to original sources. We do not claim ownership of third-party content.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">User Content</h3>
                <p>
                  You retain ownership of content you post (discussions, comments). By posting, you grant us a license to display and distribute your content on the platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Free Service</h2>
                <p>
                  NEWSTACK is free to use. We offer:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Unlimited news reading</li>
                  <li>50 free audio plays per day</li>
                  <li>Full access to all features</li>
                </ul>
                <p className="mt-4">
                  We may introduce premium features in the future, but core functionality will remain free.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                  7. Disclaimers
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>News content is provided by third-party sources. We are not responsible for accuracy.</li>
                  <li>AI summaries may contain errors. Always verify with original sources.</li>
                  <li>The Service may be unavailable due to maintenance or technical issues.</li>
                  <li>We do not guarantee uninterrupted access to the Service.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Scale className="w-6 h-6 text-primary" />
                  8. Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by law, NEWSTACK and Cropxon Innovations Pvt Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
                <p>
                  We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the Service will cease immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
                <p>
                  These Terms shall be governed by the laws of India. Any disputes shall be resolved in the courts of Bangalore, Karnataka.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">11. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or in-app notification. Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                  12. Contact Us
                </h2>
                <p>
                  For questions about these Terms, contact us at:
                </p>
                <ul className="list-none pl-0 mt-4 space-y-2">
                  <li><strong>Email:</strong> legal@newstack.live</li>
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
