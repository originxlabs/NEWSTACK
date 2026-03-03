import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Bot, Users, Globe2, Scale, Rocket } from "lucide-react";

const pillars = [
  {
    icon: Bot,
    title: "AI Agents-First Scoring",
    description:
      "Every submission is processed by multiple agents: source-check, risk-detection, bias-signal, controversy, and summary quality before major feed reach.",
  },
  {
    icon: ShieldCheck,
    title: "Guardrail-Based Publication",
    description:
      "Guardrails hard-block high-risk text, queue uncertain claims, and only allow clean or reviewed posts into high-visibility timelines.",
  },
  {
    icon: Users,
    title: "AI + Human Collaboration",
    description:
      "AI agents deliver scale and speed. Journalists, moderators, and citizens add context, appeals, and policy improvements in the loop.",
  },
  {
    icon: Scale,
    title: "Bias Resistance by Design",
    description:
      "India-first civic context with transparent scoring, multi-source verification, and auditable moderation states to reduce bias and fake narratives.",
  },
  {
    icon: Globe2,
    title: "Free and Open Core",
    description:
      "OpenNews is free and open at the core, so communities, journalists, and builders can inspect, improve, and scale trust together.",
  },
  {
    icon: Rocket,
    title: "Built for 2026 and Beyond",
    description:
      "Built for the future of media where journalists, politicians, researchers, and citizens can publish and verify transparently in real time.",
  },
];

const comparisonRows = [
  {
    dimension: "Core model",
    opennews: "Public-interest journalism and political transparency",
    x: "General-purpose social stream",
  },
  {
    dimension: "Publishing flow",
    opennews: "Guardrail + AI-agent pipeline before broad surfacing",
    x: "Mostly instant publish",
  },
  {
    dimension: "Verification",
    opennews: "Multi-source and risk-scored pipeline",
    x: "Varies by account and community context",
  },
  {
    dimension: "Governance intent",
    opennews: "Open, community-improvable, India-first civic use cases",
    x: "Global social platform priorities",
  },
  {
    dimension: "Trust visibility",
    opennews: "Controversy score, credibility signals, moderation states",
    x: "Less explicit trust telemetry in feed",
  },
];

export function OpenNewsOverviewRoute() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline">OpenNews</Badge>
          <Badge variant="outline">India-based</Badge>
          <Badge variant="outline">AI Guardrails</Badge>
          <Badge variant="outline">Open Source Core</Badge>
        </div>
        <h2 className="font-display text-2xl md:text-4xl font-bold leading-tight">
          OpenNews is India's AI-guardrailed media layer for 2026 and beyond.
        </h2>
        <p className="text-muted-foreground mt-4 max-w-4xl">
          OpenNews keeps the speed of social conversation but adds strong publication discipline.
          Instead of raw virality-first posting, content passes through multiple AI agents and policy guardrails, then enters community + journalist review flows.
          The mission is to reduce fake and biased narratives, increase source accuracy, and make media better day by day.
        </p>
        <p className="text-muted-foreground mt-3 max-w-4xl">
          This is free, open-source at the core, and designed for collaboration: AI agents and humans working together for better public discourse.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          <Button asChild>
            <Link to="/opennews/latest">Enter OpenNews Feed</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/opennews/political-tracker">Explore Political Tracker</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/opennews/verified-journalists">Verified Journalists</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <pillar.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">{pillar.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4 md:p-6">
        <h3 className="font-display text-xl font-semibold mb-3">How OpenNews Publishes</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          <div className="rounded-lg border border-border/50 p-3">
            <p className="font-medium">1. Intake Agent</p>
            <p className="text-muted-foreground mt-1">Parses claim, structure, language, metadata.</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <p className="font-medium">2. Source Agent</p>
            <p className="text-muted-foreground mt-1">Checks source diversity and reporting quality.</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <p className="font-medium">3. Risk Agent</p>
            <p className="text-muted-foreground mt-1">Scores hate, violence, incitement, misinformation.</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <p className="font-medium">4. Guardrail Policy</p>
            <p className="text-muted-foreground mt-1">Blocks, queues, or allows with watch state.</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <p className="font-medium">5. Human + Community</p>
            <p className="text-muted-foreground mt-1">Appeals, moderation override, improvement loops.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4 md:p-6">
        <h3 className="font-display text-xl font-semibold mb-3">OpenNews vs X (Twitter) - Product Direction</h3>
        <p className="text-sm text-muted-foreground mb-4">
          OpenNews does not compete on noise. It competes on trust, verification, and civic relevance for India and global news communities.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th className="py-2 pr-4">Dimension</th>
                <th className="py-2 pr-4">OpenNews</th>
                <th className="py-2">X / Twitter</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.dimension} className="border-b border-border/30 align-top">
                  <td className="py-3 pr-4 font-medium">{row.dimension}</td>
                  <td className="py-3 pr-4 text-foreground/90">{row.opennews}</td>
                  <td className="py-3 text-muted-foreground">{row.x}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 md:p-6">
        <h3 className="font-semibold mb-2">Community Statement</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          OpenNews improves with community participation. Journalists, citizens, moderators, researchers, and policy communities can contribute
          to source coverage, guardrail tuning, and governance design. The platform is designed to evolve every day, not remain static.
        </p>
      </section>
    </div>
  );
}
