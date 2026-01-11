import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, Lock, Cookie, Eye, Database, Mail, Newspaper } from "lucide-react";

export default function PrivacyPolicy() {
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
                <Shield className="w-4 h-4" />
                Legal Document
              </div>
              <h1 className="font-display text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground">
                Last updated: January 11, 2026
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {/* Philosophy Section */}
              <section className="mb-8 p-6 bg-primary/5 rounded-2xl border border-primary/20">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Newspaper className="w-6 h-6 text-primary" />
                  Media: The Main Pillar of Modern Humanity
                </h2>
                <p className="text-foreground/80">
                  In an age where information shapes our understanding of the world, media stands as the primary pillar of an informed society. At NEWSTACK, we recognize the immense responsibility that comes with aggregating and presenting news to millions. We are committed to transparency not just in our news sourcing, but also in how we handle your personal information. Your privacy is as sacred to us as the truth in journalism.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                  Introduction
                </h2>
                <p>
                  NEWSTACK ("we," "our," or "us"), a product of <strong>CROPXON INNOVATIONS PVT LTD</strong>, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our news aggregation platform available at newstack.live (the "Service").
                </p>
                <p>
                  By using NEWSTACK, you agree to the collection and use of information in accordance with this policy. We will not use or share your information with anyone except as described in this Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Database className="w-6 h-6 text-primary" />
                  Information We Collect
                </h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Information You Provide</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Information:</strong> When you create an account, we collect your email address, display name, and password.</li>
                  <li><strong>Newsletter Subscription:</strong> If you subscribe to our newsletter, we collect your email address.</li>
                  <li><strong>Preferences:</strong> Your selected topics, language preferences, and location settings.</li>
                  <li><strong>User Content:</strong> Comments and discussions you post on news articles.</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Information Collected Automatically</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Usage Data:</strong> Articles read, audio plays, time spent on pages.</li>
                  <li><strong>Device Information:</strong> Browser type, device type, operating system.</li>
                  <li><strong>Location Data:</strong> Approximate location for local news (only with permission).</li>
                  <li><strong>Cookies:</strong> Essential cookies for functionality and analytics cookies (with consent).</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                  How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and personalize the Service</li>
                  <li>Deliver local and relevant news based on your preferences</li>
                  <li>Send newsletters (if subscribed)</li>
                  <li>Improve our AI-powered features</li>
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Prevent fraud and ensure security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  Data Protection
                </h2>
                <p>
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All data transmitted via HTTPS encryption</li>
                  <li>Passwords are hashed and never stored in plain text</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication for all systems</li>
                  <li>Data stored in secure, compliant cloud infrastructure</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Cookie className="w-6 h-6 text-primary" />
                  Cookies
                </h2>
                <p>
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, preferences).</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how users interact with NEWSTACK (with consent).</li>
                </ul>
                <p className="mt-4">
                  You can control cookies through your browser settings. Note that disabling essential cookies may affect functionality.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and data</li>
                  <li>Export your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Withdraw consent for data processing</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
                <p>We use the following third-party services:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Cloud Infrastructure:</strong> Secure database and authentication services</li>
                  <li><strong>News APIs:</strong> To aggregate news from verified publishers</li>
                  <li><strong>Text-to-Speech:</strong> For audio news features</li>
                </ul>
                <p className="mt-4">
                  Each third-party service has its own privacy policy, and we encourage you to review them.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
                <p>
                  NEWSTACK is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                  Contact Us
                </h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <ul className="list-none pl-0 mt-4 space-y-2">
                  <li><strong>Email:</strong> privacy@newstack.live</li>
                  <li><strong>Parent Company:</strong> CROPXON INNOVATIONS PVT LTD</li>
                  <li><strong>Website:</strong> <a href="https://cropxon.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">cropxon.com</a></li>
                </ul>
              </section>

              {/* Copyright Notice */}
              <section className="mt-12 p-6 bg-muted/50 rounded-2xl border border-border text-center">
                <p className="text-sm text-muted-foreground">
                  © 2026 NEWSTACK. All Rights Reserved.
                </p>
                <p className="text-sm font-semibold mt-2">
                  A Product of CROPXON INNOVATIONS PVT LTD
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
