import { z } from 'zod/v4'
import { defineGenUIComponent, type GenUIComponentGroup } from '@nuxt-ui-genui/core'
import { CARD_CHILD_NAMES, createNuxtUILibrary } from '@nuxt-ui-genui/components'

export const weatherCardDef = defineGenUIComponent({
  name: 'WeatherCard',
  props: z.object({ city: z.string(), temp: z.string(), condition: z.string() }),
  description: 'Weather card for a city. condition: e.g. "Sunny", "Cloudy".'
})

export const promptOptions = {
  tools: [
    {
      name: 'get_server_health',
      description: 'Get live health metrics for an application server (status, uptime, p99 latency in ms, region).',
      inputSchema: {
        type: 'object',
        properties: {
          server_id: { type: 'string', description: 'The server identifier, e.g. "prod-eu-west-1".' }
        },
        required: ['server_id']
      },
      outputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['operational', 'degraded', 'down'] },
          uptime: { type: 'number', description: 'Days continuously up' },
          latency_ms: { type: 'number', description: 'p99 request latency in milliseconds' },
          region: { type: 'string', description: 'Cloud region id' }
        }
      }
    }
  ],
  additionalRules: [
    'Card is the only root container. Never nest Card inside Card.',
    'StatsCard value must be a single string, e.g. "$128,430" or "98.2%".',
    'Live infrastructure: when the user asks for server health, latency, uptime or a health check, emit `health = Query("get_server_health", { server_id: "..." }, { status: "operational", uptime: 30, latency_ms: 120, region: "eu-west-1" })` and reference `health.<field>`; never invent live numbers yourself.',
    'Each Chart series object is { name: string, data: number[] } inline literals; data must align 1:1 with labels.',
    'Use DataTable for order lists; keep at most 6 rows in examples.',
    'Prefer Stats([...StatsCards]) + one Chart + one DataTable for dashboard requests.',
    'Dashboard KPI rows: emit one Stats([...StatsCard]) as a single Card child. Never put StatsCard inside Buttons — Buttons is for Button components only.',
    'Forms: emit one Form as a single child of Card; children must be form field components only; every field needs a unique name. Values are submitted to the host via a submit_form action — never interpreted as code.',
    'A field that must be filled needs `rules: { required: true }` as its LAST positional argument, e.g. Input(..., { required: true }), Textarea(..., { required: true, minLength: 2 }), InputDate("when", "When", null, null, null, { required: true }), InputTime("when", "When", null, { required: true }), Checkbox("agree", "I agree", false, { required: true }), Switch("ok", "OK", false, { required: true }), CheckboxGroup("reasons", "Reason", [...], null, { required: true }), RadioGroup("level", "Level", [...], null, { required: true }), Select("x", "X", [...], "y", { required: true }), SelectMenu("x", "X", null, [...], null, { required: true }), InputMenu("x", "X", null, [...], null, { required: true }), InputTags("t", "T", null, null, null, { required: true }), PinInput("p", "P", null, null, null, { required: true }), InputRating("r", "R", 5, null, { required: true }), Slider("s", "S", 0, 100, 1, 50, { required: true }), ColorPicker("c", "C", null, { required: true }).',
    'Optional positional arguments may be omitted only from the end; to skip one in the middle write `null`. Never write the bareword `undefined` (OpenUI Lang has no such literal — it parses as an unresolved reference).'
  ],
  examples: [
    'root = Card("Revenue Overview", [rev, chart])\nrev = StatsCard("Total Revenue", "$128,430", "+12.5%", "up")\nchart = Chart("Monthly Revenue", "bar", ["Jan","Feb","Mar"], [{ name: "Revenue", data: [42, 51, 63] }])',
    'root = Card("Orders", [tbl])\ntbl = DataTable([{ key: "id", label: "ID" }, { key: "customer", label: "Customer" }, { key: "amount", label: "Amount" }], [["#1024", "Ana Silva", "$4,820"], ["#1025", "Bruno Costa", "$1,310"]])',
    'root = Card("Sales Dashboard", [kpis, salesChart, ordersTable, note, weather, summary])\nkpis = Stats([revenue, orders, aov, growth])\nrevenue = StatsCard("Total Revenue", "$128,430", "+12.5%", "up")\norders = StatsCard("Orders", "1,284", "+8.1%", "up")\naov = StatsCard("Avg Order Value", "$100.02", "-2.3%", "down")\ngrowth = StatsCard("Growth", "+12.5%", "vs last quarter", "up")\nsalesChart = Chart("Monthly Revenue", "bar", ["Jun","Jul","Aug","Sep","Oct","Nov"], [{ name: "Revenue", data: [18, 22, 27, 31, 38, 46] }])\nordersTable = DataTable([{ key: "id", label: "Order ID" }, { key: "customer", label: "Customer" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }], [["#1024", "Ana Silva", "$4,820", "Paid"], ["#1023", "Bruno Costa", "$1,310", "Shipped"], ["#1022", "Carla Nunes", "$2,940", "Processing"], ["#1021", "Dário Mendes", "$780", "Paid"], ["#1020", "Elena Rocha", "$1,150", "Delivered"]])\nnote = TextContent("Q3 performance is healthy. Revenue is **up 12.5%** with average order value slightly down. Watch enterprise orders next week.")\nweather = WeatherCard("Lisbon", "23°C", "Sunny")\nsummary = Button("Get a summary")',
    'root = Card("Weekly Traffic", [chart, note])\nchart = Chart("Visitors", "line", ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], [{ name: "Visitors", data: [820, 932, 1101, 1034, 1290, 1330, 1120] }])\nnote = TextContent("Traffic peaked on **Saturday**, up 9% week-over-week.")',
    'root = Card("Deploy Status", [status, note, rollout])\nstatus = Badge("Production", "success")\nnote = TextContent("Deploy #482 finished in 4m 12s with no errors.")\nrollout = Progress(100, "Rollout complete")',
    'root = Card("Billing", [alert, note])\nalert = Alert("Invoice overdue", "Invoice #INV-2041 is 7 days past due.", "warning")\nnote = TextContent("Update the payment method to avoid service interruption. Questions? Contact **billing@example.com**.")',
    'root = Card("Docs", [note, link])\nnote = TextContent("Read the migration guide before upgrading to Nuxt UI 4.")\nlink = Button("Open migration guide", { type: "open_url", url: "https://ui.nuxt.com/getting-started/installation" }, "outline")',
    'root = Card("FAQ", [acc])\nacc = Accordion([{ label: "Refunds", content: "Refunds are processed within 5 business days." }, { label: "Shipping", content: "Orders ship in 2-3 business days." }], "single")',
    'root = Card("Launch readiness", [form, note])\nform = Form("launch-readiness", "Launch approval", "Approve launch", [email, env, notes])\nemail = Input("approver_email", "Approver email", "ops@company.com", null, { required: true, email: true })\nenv = Select("target_env", "Target environment", ["staging", "production"], "staging")\nnotes = Textarea("notes", "Notes for the deploy", null, null, 2)\nnote = TextContent("Submitting records the approval in the operations log.")'
  ]
}

export const componentGroups: GenUIComponentGroup[] = [
  {
    name: 'Layout',
    components: ['Card'],
    notes: ['Card is the only content container; never nest Card inside Card.']
  },
  {
    name: 'Data display',
    components: ['Stats', 'StatsCard', 'Chart', 'DataTable', 'Table', 'TextContent', 'User'],
    notes: [
      'Stats is the responsive KPI grid: Stats([...StatsCard]) — 2 columns when narrow, 4 when wide. StatsCard only renders meaningfully inside Stats or directly under Card; never inside Buttons.',
      'Chart series are inline object literals ({ name, data }); each series data array aligns 1:1 with labels.',
      'DataTable positional matrix for custom alignment/striped; Table (UTable-backed) for object rows keyed by accessorKey — prefer Table unless you need matrix cells.',
    ]
  },
  {
    name: 'Feedback & actions',
    components: ['Alert', 'Badge', 'Progress', 'ProgressGroup', 'Button', 'Buttons', 'Toast'],
    notes: [
      'ProgressGroup is a segmented progress bar over inline { label?, value } items; use Progress for a single indeterminate value.',
      'Button action: omit it for continue_conversation, or pass { type: "open_url", url } with an https URL for links.'
    ]
  },
  {
    name: 'Display & feedback',
    components: ['Accordion', 'Avatar', 'AvatarGroup', 'Banner', 'Chip', 'Collapsible', 'Empty', 'Kbd', 'Separator', 'Skeleton', 'Tooltip', 'Marquee'],
    notes: [
      'All Display & feedback components are display-only: string content only, no raw HTML, no slot or child injection, no actions, events, or callbacks.',
      'Accordion/Collapsible take inline string content, never nested OpenUI components. Avatar/AvatarGroup render src as a plain browser image URL. Skeleton is a loading placeholder; prefer StatsCard or TextContent when real content is available.',
      'Kbd shows key hints only. Separator is a purely visual divider. Empty shows an empty state, not an action prompt.'
    ]
  },
  {
    name: 'Forms',
    components: ['Form', 'Input', 'Textarea', 'InputNumber', 'Select', 'Checkbox', 'CheckboxGroup', 'RadioGroup', 'Switch', 'Slider', 'InputRating', 'SelectMenu', 'InputMenu', 'PinInput', 'InputTags', 'ColorPicker', 'InputDate', 'InputTime', 'FileUpload'],
    notes: [
      'Use exactly one Form as a child of Card; Form children must be form fields only.',
      'Every field requires a unique name (first prop). Field scalar props: label?, placeholder?, defaultValue?, options?: string[] (Select/RadioGroup), min/max/step (InputNumber/Slider), rows (Textarea), max (InputRating), rules?: { required?, email?, url?, numeric?, min?, max?, minLength?, maxLength?, pattern? }.',
      'SelectMenu is a searchable single-select over options. InputMenu is a free-text input with a suggestion menu — the value is not restricted to the options; use it for autocomplete-style fields. PinInput renders single-char cells (length default 4). InputTags value is an array of strings. ColorPicker value is a hex color string.',
      'InputDate/InputTime values are ISO yyyy-mm-dd and HH:mm strings. FileUpload uploads through the host-supplied uploader (provideGenUIUploader) when the app configures one, and is disabled otherwise; it does not put file contents into submit_form values — only file metadata refs.',
      'Form validates values in the renderer and submits them to the host via a submit_form action { formId, values }. The host decides what to do with them; they are never echoed to the model or interpreted as code.',
      'Never emit raw HTML, scripts, or event names inside a Form; fields render inside a <form> with a submit button the renderer owns.'
    ]
  },
  {
    name: 'Stateful display',
    components: ['Tabs', 'Stepper', 'Timeline', 'Breadcrumb', 'Pagination', 'NavigationMenu', 'Tree', 'Calendar', 'Listbox', 'Carousel', 'ScrollArea', 'Splitter'],
    notes: [
      'Tabs: items is an inline array of { label, content }; content is plain text/markdown only. defaultIndex optional; state is local to the renderer.',
      'Stepper: items is an inline array of { title, description? }; current is an optional zero-based index (clamped). Timeline: items is an inline array of inline { title, description?, date? }.',
      'Carousel: children is an inline array of card-legal content nodes (one slide per child); arrows/dots default true. Display-only local state.',
      'ScrollArea: children is an inline array of Card-legal content nodes rendered inside a scrollable viewport; orientation optional (vertical default); shadow: optional fade shadows. Not a form child.',
      'Splitter: children is an inline array of Card-legal content nodes, one resizable panel per child; orientation optional (horizontal default); autoSaveId: optional localStorage key to persist panel sizes; disabled: optional. Drag-to-resize is local state. Not a form child.',
      'Breadcrumb: items is an inline array of { label, url? }; url must be https. Non-https urls render as plain text.'
    ]
  },
  {
    name: 'Overlays',
    components: ['Modal', 'Slideover', 'CommandPalette', 'Popover', 'DropdownMenu', 'ContextMenu', 'Drawer'],
    notes: [
      'Modal/Slideover/Drawer: triggerLabel is the only way to open; content is markdown. defaultOpen: optional. Open state is local to the renderer.',
      'Popover: triggerLabel opens a markdown popover; Open state is local.',
      'CommandPalette/DropdownMenu/ContextMenu: items is an inline array of { label, icon?, url?, message?, disabled? }. url must be https; message is sent to the host as continue_conversation.'
    ]
  },
  {
    name: 'Chat',
    components: ['ChatMessage', 'ChatMessages', 'ChatPalette', 'ChatReasoning', 'ChatShimmer', 'ChatTool'],
    notes: [
      'Display-only chat renderers: no transport, persistence, sending, tool execution, or callbacks. Never wire them to real chat state.',
      'Chat components are NOT valid children of Card. They are emitted only when the host selects the ChatPalette chat root; a normal Card response must not contain them.',
      'ChatPalette is only legal as a host-selected chat root and renders children only — no input, send button, transport, or Card placement. Do not claim or use ChatPalette inside a normal Card root.',
      'ChatMessage/ChatMessages render inline { role, text } entries with index-derived ids. ChatTool is a display-only tool summary; ChatReasoning/ChatShimmer are display-only disclosure/loading elements.'
    ]
  }
]

/** Built-in Card children plus the playground's custom component. */
export const PLAYGROUND_CARD_CHILDREN: readonly string[] = [...CARD_CHILD_NAMES, 'WeatherCard']

export function createPlaygroundLibrary(renderers?: Record<string, unknown>) {
  return createNuxtUILibrary({
    renderers: renderers as never,
    extraComponents: [weatherCardDef],
    extraCardChildren: [weatherCardDef],
    componentGroups,
    promptOptions
  })
}
