import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Loader2, Mail, ShieldAlert, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePreferences } from "@/contexts/PreferencesContext";

interface Sector {
  key: string;
  name: string;
  description: string;
}

interface Authority {
  id: string;
  country_code: string;
  region_code: string;
  sector_key: string;
  authority_name: string;
  department_level: string;
  contact_email: string | null;
  contact_phone: string | null;
  grievance_url: string;
  website_url: string | null;
  escalation_contacts: Array<{ level?: string; label?: string; email?: string | null; portal?: string }>;
  source_url: string | null;
  data_version: string;
  last_verified_at: string;
  data_refreshed_at: string;
  is_active: boolean;
}

const COUNTRIES = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "CA", label: "Canada" },
];

const INDIA_REGIONS = [
  { code: "national", label: "National" },
  { code: "AN", label: "Andaman and Nicobar Islands" },
  { code: "AP", label: "Andhra Pradesh" },
  { code: "AR", label: "Arunachal Pradesh" },
  { code: "AS", label: "Assam" },
  { code: "BR", label: "Bihar" },
  { code: "CH", label: "Chandigarh" },
  { code: "CG", label: "Chhattisgarh" },
  { code: "DN", label: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", label: "Delhi" },
  { code: "GA", label: "Goa" },
  { code: "GJ", label: "Gujarat" },
  { code: "HR", label: "Haryana" },
  { code: "HP", label: "Himachal Pradesh" },
  { code: "JK", label: "Jammu and Kashmir" },
  { code: "JH", label: "Jharkhand" },
  { code: "KA", label: "Karnataka" },
  { code: "KL", label: "Kerala" },
  { code: "LA", label: "Ladakh" },
  { code: "LD", label: "Lakshadweep" },
  { code: "MP", label: "Madhya Pradesh" },
  { code: "MH", label: "Maharashtra" },
  { code: "MN", label: "Manipur" },
  { code: "ML", label: "Meghalaya" },
  { code: "MZ", label: "Mizoram" },
  { code: "NL", label: "Nagaland" },
  { code: "OD", label: "Odisha" },
  { code: "PY", label: "Puducherry" },
  { code: "PB", label: "Punjab" },
  { code: "RJ", label: "Rajasthan" },
  { code: "SK", label: "Sikkim" },
  { code: "TN", label: "Tamil Nadu" },
  { code: "TG", label: "Telangana" },
  { code: "TR", label: "Tripura" },
  { code: "UP", label: "Uttar Pradesh" },
  { code: "UK", label: "Uttarakhand" },
  { code: "WB", label: "West Bengal" },
];

const FALLBACK_SECTORS: Sector[] = [
  { key: "auth", name: "Auth & Identity", description: "Identity, Aadhaar, digital identity and authentication grievances." },
  { key: "agriculture", name: "Agriculture", description: "Farming, crop support, agri credit and irrigation grievances." },
  { key: "defence", name: "Defence", description: "Defence-related public grievances and ex-servicemen support routes." },
  { key: "railways", name: "Railways", description: "Rail operations, passenger issues and station service complaints." },
  { key: "power-energy", name: "Power & Energy", description: "Power distribution, billing and energy service escalation." },
  { key: "telecom", name: "Telecom & Digital", description: "Telecom service quality, connectivity and digital service issues." },
  { key: "education", name: "Education", description: "School and higher education grievances and policy channels." },
  { key: "health", name: "Health & Public Health", description: "Healthcare delivery, hospital access and public health complaints." },
  { key: "finance-tax", name: "Finance & Tax", description: "Taxation, banking, public finance and financial grievance pathways." },
  { key: "consumer-affairs", name: "Consumer Affairs", description: "Consumer rights, fraud and unfair trade complaints." },
  { key: "labour", name: "Labour & Employment", description: "Labour welfare, workplace and employment grievance routes." },
  { key: "women-child", name: "Women & Child Welfare", description: "Women and child protection, support and welfare grievance channels." },
  { key: "environment", name: "Environment", description: "Pollution, forest, climate and environmental governance complaints." },
  { key: "law-order", name: "Law, Order & Cyber", description: "Police, legal process and cybercrime complaint channels." },
  { key: "politics-governance", name: "Politics & Governance", description: "Governance conduct and policy grievance pathways." },
  { key: "local-civic", name: "Local Civic Services", description: "Municipal, sanitation, roads, water and urban local service complaints." },
  { key: "transport", name: "Transport", description: "Road transport and civil aviation service grievance channels." },
  { key: "housing-urban", name: "Housing & Urban Affairs", description: "Housing schemes and urban administration grievances." },
  { key: "rural-development", name: "Rural Development", description: "Rural schemes, panchayat and village infrastructure grievances." },
  { key: "social-justice", name: "Social Justice", description: "Social justice, empowerment and inclusion grievance channels." },
  { key: "minority-affairs", name: "Minority Affairs", description: "Minority welfare and inclusion scheme grievance routes." },
  { key: "tribal-affairs", name: "Tribal Affairs", description: "Tribal welfare, rights and scheme-related grievance channels." },
  { key: "food-public-distribution", name: "Food & Public Distribution", description: "Ration, PDS and food supply grievance escalation." },
  { key: "water-sanitation", name: "Water & Sanitation", description: "Drinking water and sanitation service grievances." },
  { key: "disaster-management", name: "Disaster Management", description: "Relief, disaster response and resilience service complaints." },
  { key: "judiciary-legal", name: "Judiciary & Legal Services", description: "Legal aid and justice service grievance pathways." },
  { key: "immigration-passport", name: "Immigration & Passport", description: "Passport, immigration and consular grievance routes." },
  { key: "pensions-senior-citizens", name: "Pensions & Senior Citizens", description: "Pension and senior citizen service grievance channels." },
  { key: "business-msme", name: "Business & MSME", description: "MSME, industry services and business facilitation grievances." },
  { key: "tourism-culture", name: "Tourism & Culture", description: "Tourism infrastructure, culture and heritage service complaints." },
];

const FALLBACK_AUTHORITIES: Authority[] = [
  {
    id: "fallback-cpgrams-auth",
    country_code: "IN",
    region_code: "national",
    sector_key: "auth",
    authority_name: "UIDAI + CPGRAMS Identity Grievance Route",
    department_level: "national",
    contact_email: "help@uidai.gov.in",
    contact_phone: "1947",
    grievance_url: "https://pgportal.gov.in/",
    website_url: "https://uidai.gov.in/",
    escalation_contacts: [{ level: "L1", label: "UIDAI Helpline", email: "help@uidai.gov.in", portal: "https://uidai.gov.in/" }],
    source_url: "https://uidai.gov.in/",
    data_version: "2026-03-03",
    last_verified_at: "2026-03-03",
    data_refreshed_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: "fallback-cpgrams-governance",
    country_code: "IN",
    region_code: "national",
    sector_key: "politics-governance",
    authority_name: "CPGRAMS - Central Public Grievance Redress And Monitoring System",
    department_level: "national",
    contact_email: null,
    contact_phone: "1800-11-1555",
    grievance_url: "https://pgportal.gov.in/",
    website_url: "https://darpg.gov.in/",
    escalation_contacts: [{ level: "L1", label: "CPGRAMS", email: null, portal: "https://pgportal.gov.in/" }],
    source_url: "https://pgportal.gov.in/",
    data_version: "2026-03-03",
    last_verified_at: "2026-03-03",
    data_refreshed_at: new Date().toISOString(),
    is_active: true,
  },
];

export default function PublicGrievances() {
  const { country: preferredCountry } = usePreferences();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [countryCode, setCountryCode] = useState("IN");
  const [regionCode, setRegionCode] = useState("national");
  const [sectorKey, setSectorKey] = useState("auth");
  const [search, setSearch] = useState("");
  const [selectedAuthorityId, setSelectedAuthorityId] = useState("none");

  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDetails, setIssueDetails] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailTo, setMailTo] = useState("");
  const [mailCc, setMailCc] = useState("");
  const [ticketNo, setTicketNo] = useState<string | null>(null);

  useEffect(() => {
    if (preferredCountry?.code) {
      setCountryCode(preferredCountry.code);
    }
  }, [preferredCountry?.code]);

  useEffect(() => {
    let ignore = false;
    const detect = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (ignore || !data) return;

        if (typeof data.country_code === "string" && data.country_code.length === 2) {
          setCountryCode(data.country_code.toUpperCase());
        }
        if (typeof data.region_code === "string" && data.region_code.length >= 2) {
          setRegionCode(data.region_code.toUpperCase());
        }
      } catch {
        // Keep defaults from preferences.
      }
    };
    detect();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (countryCode !== "IN") {
      setRegionCode("national");
    }
  }, [countryCode]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("public-grievances", {
          body: {
            action: "list",
            countryCode,
            regionCode: regionCode === "all" ? undefined : regionCode,
            sectorKey: sectorKey === "all" ? undefined : sectorKey,
            query: search || undefined,
          },
        });

        if (error) throw error;
        const loadedSectors = (data?.sectors || []) as Sector[];
        const mergedSectors = [...loadedSectors];
        for (const fallback of FALLBACK_SECTORS) {
          if (!mergedSectors.some((sector) => sector.key === fallback.key)) {
            mergedSectors.push(fallback);
          }
        }
        mergedSectors.sort((a, b) => a.name.localeCompare(b.name));

        const loadedAuthorities = (data?.authorities || []) as Authority[];
        const mergedAuthorities = loadedAuthorities.length ? loadedAuthorities : FALLBACK_AUTHORITIES;

        setSectors(mergedSectors);
        setAuthorities(mergedAuthorities);
        setLastSyncedAt(data?.lastSyncedAt || null);
      } catch (err) {
        console.error("public-grievances edge invocation failed, falling back to table queries", err);
        try {
          const [{ data: sectorRows }, { data: authorityRows, error: authorityErr }, { data: latest }] =
            await Promise.all([
              supabase.from("public_grievance_sectors").select("key,name,description").order("name", { ascending: true }),
              supabase
                .from("public_grievance_authorities")
                .select(
                  "id,country_code,region_code,sector_key,authority_name,department_level,contact_email,contact_phone,grievance_url,website_url,escalation_contacts,source_url,data_version,last_verified_at,data_refreshed_at,is_active",
                )
                .eq("is_active", true)
                .eq("country_code", countryCode)
                .in("region_code", regionCode === "all" ? ["national"] : [regionCode, "national"])
                .order("sector_key", { ascending: true })
                .order("authority_name", { ascending: true })
                .limit(500),
              supabase
                .from("public_grievance_authorities")
                .select("data_refreshed_at")
                .eq("is_active", true)
                .order("data_refreshed_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            ]);

          if (authorityErr) throw authorityErr;

          const loadedSectors = (sectorRows || []) as Sector[];
          const mergedSectors = [...loadedSectors];
          for (const fallback of FALLBACK_SECTORS) {
            if (!mergedSectors.some((sector) => sector.key === fallback.key)) {
              mergedSectors.push(fallback);
            }
          }
          mergedSectors.sort((a, b) => a.name.localeCompare(b.name));

          const loadedAuthorities = (authorityRows || []) as Authority[];
          setSectors(mergedSectors);
          setAuthorities(loadedAuthorities.length ? loadedAuthorities : FALLBACK_AUTHORITIES.filter((a) => a.country_code === countryCode));
          setLastSyncedAt(latest?.data_refreshed_at || null);
          toast.warning("Using fallback grievance data source");
        } catch (fallbackErr) {
          console.error(fallbackErr);
          setSectors(FALLBACK_SECTORS);
          setAuthorities(FALLBACK_AUTHORITIES.filter((a) => a.country_code === countryCode));
          toast.error("Failed to load public grievance directory");
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [countryCode, regionCode, sectorKey, search]);

  const filteredAuthorities = useMemo(() => {
    return authorities.filter((entry) => {
      if (countryCode && entry.country_code !== countryCode) return false;
      if (regionCode !== "all" && regionCode !== "national" && ![regionCode, "national"].includes(entry.region_code)) return false;
      if (regionCode === "national" && entry.region_code !== "national") return false;
      if (sectorKey !== "all" && entry.sector_key !== sectorKey) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        entry.authority_name.toLowerCase().includes(q) ||
        entry.sector_key.toLowerCase().includes(q) ||
        entry.region_code.toLowerCase().includes(q)
      );
    });
  }, [authorities, countryCode, regionCode, sectorKey, search]);

  useEffect(() => {
    if (!filteredAuthorities.length) {
      setSelectedAuthorityId("none");
      return;
    }
    if (!filteredAuthorities.some((entry) => entry.id === selectedAuthorityId)) {
      setSelectedAuthorityId(filteredAuthorities[0].id);
    }
  }, [filteredAuthorities, selectedAuthorityId]);

  const availableRegions = useMemo(() => {
    if (countryCode === "IN") return INDIA_REGIONS;
    return [{ code: "national", label: "National" }];
  }, [countryCode]);

  const selectedAuthority = filteredAuthorities.find((entry) => entry.id === selectedAuthorityId);

  useEffect(() => {
    if (selectedAuthority) {
      setMailTo(selectedAuthority.contact_email || "");
    }
  }, [selectedAuthority]);

  const handleDraft = async () => {
    if (!issueTitle.trim() || !issueDetails.trim()) {
      toast.error("Add title and issue details first");
      return;
    }

    setIsDrafting(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-grievances", {
        body: {
          action: "draft",
          title: issueTitle,
          details: issueDetails,
          countryCode,
          sectorName: sectors.find((sector) => sector.key === sectorKey)?.name,
          authorityName: selectedAuthority?.authority_name,
          authorityEmail: selectedAuthority?.contact_email,
        },
      });

      if (error) throw error;
      const draft = data?.draft;
      if (draft?.subject) setMailSubject(draft.subject);
      if (draft?.body) setMailBody(draft.body);
      if (Array.isArray(draft?.to)) setMailTo(draft.to.join(", "));
      if (Array.isArray(draft?.cc)) setMailCc(draft.cc.join(", "));
      toast.success("AI draft generated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI draft");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSubmit = async () => {
    if (!requesterName.trim() || !requesterEmail.trim()) {
      toast.error("Requester name and email are required");
      return;
    }
    if (!mailSubject.trim() || !mailBody.trim()) {
      toast.error("Subject and body are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-grievances", {
        body: {
          action: "submit",
          requesterName,
          requesterEmail,
          requesterPhone,
          countryCode,
          regionCode: selectedAuthority?.region_code || "national",
          sectorKey: sectorKey === "all" ? (selectedAuthority?.sector_key || "politics-governance") : sectorKey,
          authorityId: selectedAuthority?.id,
          authorityName: selectedAuthority?.authority_name,
          authorityEmail: selectedAuthority?.contact_email,
          subject: mailSubject,
          body: mailBody,
          to: mailTo.split(",").map((entry) => entry.trim()).filter(Boolean),
          cc: mailCc.split(",").map((entry) => entry.trim()).filter(Boolean),
          aiAssisted: true,
        },
      });

      if (error) throw error;
      setTicketNo(data?.ticketNo || null);
      toast.success(`Grievance submitted successfully (${data?.ticketNo || "ticket created"})`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to submit grievance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      <div className="h-14" />

      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <section className="rounded-2xl border border-border/60 bg-background/80 backdrop-blur-lg p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Public Grievances</h1>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                File structured grievances by sector from agriculture to defence and governance. OpenNews routes your issue
                with AI-assisted drafting, ticketing, and escalation metadata from the current public directory baseline.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">Baseline: 2026-03-03</Badge>
                {lastSyncedAt && (
                  <Badge variant="outline">Synced: {new Date(lastSyncedAt).toLocaleString()}</Badge>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 max-w-xs">
              Official channels can change. Review authority links before final submission.
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Sector Directory</CardTitle>
              <CardDescription>
                Explore government and sector grievance routes with contact details and source links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>State / Region</Label>
                  <Select value={regionCode} onValueChange={setRegionCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRegions.map((region) => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sector</Label>
                  <Select value={sectorKey} onValueChange={setSectorKey}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sectors</SelectItem>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.key} value={sector.key}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Search</Label>
                  <Input
                    placeholder="Search authority"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{countryCode}</Badge>
                <Badge variant="outline">{regionCode}</Badge>
                <Badge variant="outline">{sectorKey === "all" ? "all sectors" : sectorKey}</Badge>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading directory...
                </div>
              ) : (
                <div className="space-y-3 max-h-[540px] overflow-auto pr-1">
                  {filteredAuthorities.map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded-xl border p-4 transition-colors cursor-pointer ${
                        selectedAuthorityId === entry.id
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:bg-muted/40"
                      }`}
                      onClick={() => setSelectedAuthorityId(entry.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{entry.authority_name}</p>
                          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                            {entry.country_code} · {entry.region_code} · {entry.sector_key}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {entry.department_level}
                        </Badge>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground space-y-1">
                        {entry.contact_email && <p>Email: {entry.contact_email}</p>}
                        {entry.contact_phone && <p>Phone: {entry.contact_phone}</p>}
                        <a href={entry.grievance_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                          Official grievance link
                        </a>
                        {entry.source_url && (
                          <p>
                            Source: <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{entry.source_url}</a>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {!filteredAuthorities.length && (
                    <div className="text-sm text-muted-foreground py-8 text-center border rounded-xl">
                      No authorities found for this filter.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submit Grievance</CardTitle>
              <CardDescription>
                AI-assisted writing canvas. All submissions receive a NEWSTACK ticket number and email acknowledgement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Your name</Label>
                  <Input value={requesterName} onChange={(event) => setRequesterName(event.target.value)} placeholder="Your full name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Your email</Label>
                  <Input type="email" value={requesterEmail} onChange={(event) => setRequesterEmail(event.target.value)} placeholder="you@example.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Phone (optional)</Label>
                <Input value={requesterPhone} onChange={(event) => setRequesterPhone(event.target.value)} placeholder="+91..." />
              </div>

              <div className="space-y-1.5">
                <Label>Selected authority</Label>
                <Select value={selectedAuthorityId} onValueChange={setSelectedAuthorityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose authority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific authority</SelectItem>
                    {filteredAuthorities.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.authority_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Issue title</Label>
                <Input value={issueTitle} onChange={(event) => setIssueTitle(event.target.value)} placeholder="Short issue summary" />
              </div>

              <div className="space-y-1.5">
                <Label>Issue details</Label>
                <Textarea
                  value={issueDetails}
                  onChange={(event) => setIssueDetails(event.target.value)}
                  placeholder="Explain the full issue, dates, location, impact, and expected resolution."
                  rows={5}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDraft} disabled={isDrafting}>
                  {isDrafting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Draft with Sarvam AI
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label>Email subject</Label>
                <Input value={mailSubject} onChange={(event) => setMailSubject(event.target.value)} placeholder="Generated subject" />
              </div>

              <div className="space-y-1.5">
                <Label>Email To</Label>
                <Input value={mailTo} onChange={(event) => setMailTo(event.target.value)} placeholder="comma separated emails" />
              </div>

              <div className="space-y-1.5">
                <Label>Email CC</Label>
                <Input value={mailCc} onChange={(event) => setMailCc(event.target.value)} placeholder="comma separated emails" />
              </div>

              <div className="space-y-1.5">
                <Label>Email body</Label>
                <Textarea value={mailBody} onChange={(event) => setMailBody(event.target.value)} rows={9} placeholder="Generated body" />
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Delivery flow</p>
                <p>
                  Sent from <code>admin@newstack.live</code> via Resend. Ticket and acknowledgement are mailed to your provided
                  email automatically.
                </p>
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Submit Grievance
              </Button>

              {ticketNo && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">Ticket created: {ticketNo}</p>
                  <p className="text-xs text-muted-foreground mt-1">Please keep this ticket number for future escalation.</p>
                </div>
              )}

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
                <p>
                  Do not include Aadhaar, PAN, bank credentials, or sensitive personal data unless absolutely required by law.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Escalation Matrix Model
            </CardTitle>
            <CardDescription>
              NEWSTACK stores escalation metadata per authority so monthly syncs can update points of contact and channel hierarchy.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Current public beta ships with a verified baseline and monthly refresh pipeline. Run the sync worker monthly to
              refresh authority mappings, channel links, and escalation contacts.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
