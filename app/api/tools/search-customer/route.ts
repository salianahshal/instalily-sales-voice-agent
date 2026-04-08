import { NextRequest, NextResponse } from "next/server";
import type { CustomerRecord } from "@/lib/types";

// Mock customer database
const mockCustomers: CustomerRecord[] = [
  {
    id: "cust_1",
    name: "Sarah Chen",
    company: "TechFlow Inc.",
    last_contact: "2026-03-28",
    deal_stage: "proposal",
    deal_value: "$45,000",
    notes: [
      "Interested in enterprise plan",
      "Needs SSO integration",
      "Budget approved for Q2",
      "Decision maker is VP of Engineering",
    ],
  },
  {
    id: "cust_2",
    name: "Marcus Johnson",
    company: "RetailPro Solutions",
    last_contact: "2026-04-01",
    deal_stage: "negotiation",
    deal_value: "$120,000",
    notes: [
      "Multi-year deal discussion",
      "Wants volume discount",
      "Legal review in progress",
      "Champions: Marcus + CFO Diana",
    ],
  },
  {
    id: "cust_3",
    name: "Emily Rodriguez",
    company: "HealthFirst Medical",
    last_contact: "2026-03-15",
    deal_stage: "qualification",
    deal_value: "$28,000",
    notes: [
      "HIPAA compliance is a requirement",
      "Currently using competitor product",
      "Pain point: reporting limitations",
      "Next step: technical demo scheduled April 10",
    ],
  },
  {
    id: "cust_4",
    name: "David Kim",
    company: "Nexus Financial",
    last_contact: "2026-04-03",
    deal_stage: "prospecting",
    deal_value: "$75,000",
    notes: [
      "Inbound lead from webinar",
      "Interested in analytics module",
      "Has budget but timeline unclear",
      "Referred by existing customer at Acme Corp",
    ],
  },
  {
    id: "cust_5",
    name: "Lisa Thompson",
    company: "GreenEnergy Co",
    last_contact: "2026-03-20",
    deal_stage: "closed_won",
    deal_value: "$62,000",
    notes: [
      "Closed March 20 - annual contract",
      "Onboarding starts April 7",
      "Upsell opportunity for API access",
      "Very positive experience, potential case study",
    ],
  },
];

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  const q = (query || "").toLowerCase();

  const results = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.notes.some((n) => n.toLowerCase().includes(q)) ||
      c.deal_stage.toLowerCase().includes(q)
  );

  return NextResponse.json({
    success: true,
    query,
    results,
    message:
      results.length > 0
        ? `Found ${results.length} matching record(s).`
        : "No matching customers found.",
  });
}
