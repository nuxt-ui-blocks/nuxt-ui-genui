/**
 * Deterministic mock programs for the Operations Center demo. Each entry is a
 * complete, valid OpenUI Lang program. The no-key path streams these verbatim
 * so the demo renders real UI without any provider. keyword matching is
 * intentionally crude — this is a demo, not an NLU layer.
 */

export const DEMO_PROGRAMS: Record<string, string> = {
  launch: [
    'root = Card("Launch readiness — Falcon 9", [stats, rollout, milestones, nextSteps, note, form])',
    'stats = Stats([rev, orders, aov, growth])',
    'rev = StatsCard("Error budget", "99.95%", "within target", "flat")',
    'orders = StatsCard("Champions engaged", "18", "+4 this week", "up")',
    'aov = StatsCard("Open risks", "3", "2 mitigated", "down")',
    'growth = StatsCard("Rollout", "82%", "canary to general", "up")',
    'rollout = Progress(82, "Global rollout")',
    'milestones = DataTable([{ key: "phase", label: "Phase" }, { key: "when", label: "When" }, { key: "owner", label: "Owner" }], [["Stage 1: canary", "Nov 12", "SRE"], ["Stage 2: 50%", "Nov 18", "SRE"], ["Stage 3: 100%", "Nov 25", "Launch Eng"]])',
    'nextSteps = Timeline([{ title: "Freeze window opens", date: "Nov 14" }, { title: "Go/no-go review", date: "Nov 21", description: "VP Eng chairs" }, { title: "General availability", date: "Nov 25" }])',
    'note = TextContent("Fuel load within margin. **Two open issues** remain on the telemetry pipeline; owners are assigned.")',
    'form = Form("launch-readiness", "Go / no-go", "Approve launch", [email, confirm])',
    'email = Input("approver_email", "Approver email", "sre-lead@example.com", null, { required: true, email: true })',
    'confirm = Checkbox("confirm_ready", "I have verified the checklist", true)'
  ].join('\n'),

  incident: [
    'root = Card("INC-2041 — API latency", [sev, alert, stats, steps, timeline, note])',
    'stats = Stats([team, impact, ttd, mttr])',
    'sev = Badge("SEV 1", "error")',
    'alert = Alert("Read replicas saturated", "P99 latency crossed 900ms at 03:12 UTC; failover engaged.", "error")',
    'team = StatsCard("Sev commander", "Ana Silva", "primary, paged", "up")',
    'impact = StatsCard("Error rate", "4.2%", "down from 6.1%", "down")',
    'ttd = StatsCard("Detect", "2m 10s", "within SLO", "flat")',
    'mttr = StatsCard("Mitigate", "18m", "ETA 6m", "down")',
    'steps = Stepper([{ title: "Triage", description: "replicas" }, { title: "Failover", description: "to SRE-2" }, { title: "Root cause", description: "in progress" }], 2)',
    'timeline = Timeline([{ title: "03:12 UTC — alert fired" }, { title: "03:14 UTC — failover started", description: "read replicas saturated" }, { title: "03:30 UTC — error rate normalising" }])',
    'note = TextContent("Follow-up: capacity review for the read fleet; SLO breach postmortem scheduled.")'
  ].join('\n'),

  vendor: [
    'root = Card("Vendor comparison — observability", [table, chart, note, form])',
    'table = DataTable([{ key: "vendor", label: "Vendor" }, { key: "cost", label: "Annual cost" }, { key: "fit", label: "Fit" }], [["Datadog", "$84k", "full-stack"], ["Grafana Cloud", "$46k", "metrics-first"], ["Honeycomb", "$58k", "tracing-native"]])',
    'chart = Chart("Annual cost (USD k)", "bar", ["Datadog", "Grafana Cloud", "Honeycomb"], [{ name: "Cost", data: [84, 46, 58] }])',
    'note = TextContent("Grafana Cloud is **46% cheaper**; validate query P95 before deciding.")',
    'form = Form("vendor-pick", "Pick a vendor", "Submit decision", [choice, email])',
    'choice = RadioGroup("winner", "Preferred vendor", ["Datadog", "Grafana Cloud", "Honeycomb"], "Grafana Cloud")',
    'email = Input("approver_email", "Approver email", "procurement@example.com", null, { required: true, email: true })'
  ].join('\n'),

  kpi: [
    'root = Card("Q4 KPI review", [stats, trend, tabs, note])',
    'stats = Stats([rev, ret, churn, nps])',
    'rev = StatsCard("NRR", "118%", "+3 vs Q3", "up")',
    'ret = StatsCard("Retention", "94.1%", "logo", "flat")',
    'churn = StatsCard("Churn", "1.6%", "down from 2.2%", "down")',
    'nps = StatsCard("NPS", "62", "+5", "up")',
    'trend = Chart("NRR by month", "line", ["Aug", "Sep", "Oct", "Nov"], [{ name: "NRR", data: [112, 114, 116, 118] }])',
    'tabs = Tabs([{ label: "Revenue", content: "NRR driven by expansion in two enterprise accounts; pipeline coverage is 4.1x." }, { label: "Retention", content: "Gross churn concentrated in SMB; win-back program starts Dec 1." }], 0)',
    'note = TextContent("Overall: **healthy** with SMB churn risk. Expansion revenue masks flat new-logo acquisition.")'
  ].join('\n'),

  deploy: [
    'root = Card("Deploy plan — v2.14.0", [status, bar, steps, note, form])',
    'status = Badge("Ready for review", "warning")',
    'bar = Progress(64, "Pipeline progress")',
    'steps = Stepper([{ title: "Build", description: "done" }, { title: "Staging soak", description: "2h window" }, { title: "Canary", description: "5% traffic" }], 1)',
    'note = TextContent("Rollback plan rehearsed **Oct 30**. Feature flags cover both backend and web changes.")',
    'form = Form("deploy-confirm", "Confirm deploy", "Approve deploy", [email, soak])',
    'email = Input("approver_email", "Approver email", "platform@example.com", null, { required: true, email: true })',
    'soak = Checkbox("confirm_soak", "Staging soak passed", true)'
  ].join('\n'),

  approval: [
    'root = Card("Approval — production deploy", [alert, what, form])',
    'alert = Alert("Production change window", "Deploy v2.14.0 to production. Change freeze lifts Nov 13 02:00 UTC.", "warning")',
    'what = TextContent("Changes: **feature flags**, billing hotfix, infra bump. Rollback rehearsed Oct 30; SLO impact expected to be nil.")',
    'form = Form("prod-approval", "Human approval required", "Approve production deploy", [email, confirm])',
    'email = Input("approver_email", "Approver email", "vp-eng@example.com", null, { required: true, email: true })',
    'confirm = Checkbox("confirm_read", "I have read the rollback plan", true)'
  ].join('\n'),

  default: [
    'root = Card("Operations overview", [stats, sales, note, link])',
    'stats = Stats([rev, orders, aov, growth])',
    'rev = StatsCard("MRR", "$128,430", "+12.5%", "up")',
    'orders = StatsCard("Deploys (7d)", "42", "+8 vs last week", "up")',
    'aov = StatsCard("MTTR", "11m", "-23%", "down")',
    'growth = StatsCard("Cloud spend", "$18.2k", "+6%", "flat")',
    'sales = Chart("Deploys per day", "bar", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], [{ name: "Deploys", data: [4, 6, 9, 8, 7, 3, 5] }])',
    'note = TextContent("Two services degraded this week; see **INC-2041**. Everything else within SLO.")',
    'link = Button("Open runbook", { type: "open_url", url: "https://example.com/runbook" }, "outline")'
  ].join('\n')
}

/** Pick the mock program whose keywords appear in the user text. */
export function pickProgram(text: string): string {
  const t = text.toLowerCase()
  if (/incident|sev[ -]?[0-9]|latency|outage|page on-call/.test(t)) return DEMO_PROGRAMS.incident!
  if (/vendor|observability|datadog|grafana|honeycomb|procure/.test(t)) return DEMO_PROGRAMS.vendor!
  if (/kpi|nrr|retention|churn|metric|quarter|q[1-4]/.test(t)) return DEMO_PROGRAMS.kpi!
  if (/deploy|release|v2\.14|rollout|ship/.test(t)) return DEMO_PROGRAMS.deploy!
  if (/launch|readiness|go.?\/?no-?go|falcon/.test(t)) return DEMO_PROGRAMS.launch!
  if (/approv/.test(t)) return DEMO_PROGRAMS.approval!
  return DEMO_PROGRAMS.default!
}
