export type OrgChartNodeKind = "role" | "legend" | "tip" | "company";

export type OrgChartCanvasNode = {
  id: string;
  name: string;
  position: string;
  parentId: string | null;
  createdAt: number;
  x: number;
  y: number;
  note: string;
  logoUrl?: string;
  kind?: OrgChartNodeKind;
};

export type OrgChartViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type OrgChartCanvasPayload = {
  nodes: OrgChartCanvasNode[];
  viewport: OrgChartViewport;
  meta?: {
    version?: number;
    updatedAt?: number;
  };
};

export const ORG_CHART_CANVAS_STORAGE_KEY = "tclass_admin_org_chart_canvas_v1";
export const ORG_CHART_CANVAS_VERSION = 2;
export const ROLE_TASK_PLACEHOLDER = "Describe this member's key responsibilities and expected outcomes in the company.";
const LEGACY_ROLE_TASK_PLACEHOLDER = "Add a task here to represent this team member!";

export const DEFAULT_ORG_CHART_VIEWPORT: OrgChartViewport = {
  x: 0,
  y: 0,
  zoom: 0.9,
};

const ALLOWED_KINDS = new Set<OrgChartNodeKind>(["role", "legend", "tip", "company"]);

function normalizeKind(raw: unknown): OrgChartNodeKind {
  if (typeof raw !== "string") return "role";
  const value = raw.trim().toLowerCase() as OrgChartNodeKind;
  return ALLOWED_KINDS.has(value) ? value : "role";
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNode(input: unknown, fallbackCreatedAt: number): OrgChartCanvasNode | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Partial<OrgChartCanvasNode>;

  const id = String(row.id ?? "").trim();
  const position = String(row.position ?? "").trim();
  if (!id || !position) return null;

  const createdAt = toFiniteNumber(row.createdAt) ?? fallbackCreatedAt;
  const x = toFiniteNumber(row.x);
  const y = toFiniteNumber(row.y);
  const kind = normalizeKind(row.kind);

  const noteFallback = kind === "role" ? ROLE_TASK_PLACEHOLDER : "";
  const rawNote = String(row.note ?? noteFallback);
  const normalizedRoleNote = rawNote.trim() === LEGACY_ROLE_TASK_PLACEHOLDER ? ROLE_TASK_PLACEHOLDER : rawNote;

  return {
    id,
    name: String(row.name ?? "").trim(),
    position,
    parentId: row.parentId ? String(row.parentId) : null,
    createdAt,
    x: x ?? Number.NaN,
    y: y ?? Number.NaN,
    note: normalizedRoleNote,
    logoUrl: row.logoUrl ? String(row.logoUrl) : undefined,
    kind,
  };
}

function normalizeViewport(input: unknown): OrgChartViewport {
  if (!input || typeof input !== "object") return DEFAULT_ORG_CHART_VIEWPORT;
  const row = input as Partial<OrgChartViewport>;
  const x = toFiniteNumber(row.x);
  const y = toFiniteNumber(row.y);
  const zoom = toFiniteNumber(row.zoom);
  return {
    x: x ?? DEFAULT_ORG_CHART_VIEWPORT.x,
    y: y ?? DEFAULT_ORG_CHART_VIEWPORT.y,
    zoom: zoom ?? DEFAULT_ORG_CHART_VIEWPORT.zoom,
  };
}

function stripOrphanParents(nodes: OrgChartCanvasNode[]): OrgChartCanvasNode[] {
  const idSet = new Set(nodes.map((node) => node.id));
  return nodes.map((node) => {
    if (!node.parentId) return node;
    if (!idSet.has(node.parentId) || node.parentId === node.id) {
      return { ...node, parentId: null };
    }
    return node;
  });
}

function sortNodes(nodes: OrgChartCanvasNode[]): OrgChartCanvasNode[] {
  return [...nodes].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id.localeCompare(b.id);
  });
}

function buildChildrenMap(nodes: OrgChartCanvasNode[]): Record<string, OrgChartCanvasNode[]> {
  const buckets: Record<string, OrgChartCanvasNode[]> = {};
  for (const node of nodes) {
    if (!node.parentId) continue;
    if (!buckets[node.parentId]) buckets[node.parentId] = [];
    buckets[node.parentId].push(node);
  }
  for (const key of Object.keys(buckets)) {
    buckets[key] = sortNodes(buckets[key]);
  }
  return buckets;
}

function layoutRoleNodes(nodes: OrgChartCanvasNode[]): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const roleNodes = sortNodes(nodes.filter((node) => (node.kind ?? "role") === "role"));
  const childrenByParent = buildChildrenMap(roleNodes);
  const roots = roleNodes.filter((node) => !node.parentId || !roleNodes.some((row) => row.id === node.parentId));
  const H_GAP = 300;
  const V_GAP = 190;
  let leafIndex = 0;

  const visit = (node: OrgChartCanvasNode, depth: number): number => {
    const children = childrenByParent[node.id] ?? [];
    if (!children.length) {
      const x = leafIndex * H_GAP;
      leafIndex += 1;
      map.set(node.id, { x, y: depth * V_GAP });
      return x;
    }

    const childXs = children.map((child) => visit(child, depth + 1));
    const x = childXs.reduce((sum, value) => sum + value, 0) / childXs.length;
    map.set(node.id, { x, y: depth * V_GAP });
    return x;
  };

  for (const root of roots) {
    visit(root, 0);
    leafIndex += 1;
  }

  return map;
}

function layoutOverlayNodes(nodes: OrgChartCanvasNode[]): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const overlays = sortNodes(nodes.filter((node) => (node.kind ?? "role") !== "role"));
  const preset: Record<OrgChartNodeKind, { x: number; y: number }> = {
    legend: { x: -540, y: -120 },
    tip: { x: -160, y: 110 },
    company: { x: 290, y: -170 },
    role: { x: 0, y: 0 },
  };

  const counters: Record<OrgChartNodeKind, number> = { legend: 0, tip: 0, company: 0, role: 0 };
  for (const node of overlays) {
    const kind = node.kind ?? "role";
    const slot = preset[kind];
    const offset = counters[kind] * 64;
    counters[kind] += 1;
    map.set(node.id, { x: slot.x + offset, y: slot.y + offset });
  }

  return map;
}

export function requiresLayoutUpgrade(nodes: OrgChartCanvasNode[]): boolean {
  return nodes.some((node) => !Number.isFinite(node.x) || !Number.isFinite(node.y) || !node.note.trim());
}

export function applyDeterministicLayout(nodes: OrgChartCanvasNode[]): OrgChartCanvasNode[] {
  const roleLayout = layoutRoleNodes(nodes);
  const overlayLayout = layoutOverlayNodes(nodes);
  return nodes.map((node) => {
    const kind = node.kind ?? "role";
    const layout = kind === "role" ? roleLayout.get(node.id) : overlayLayout.get(node.id);
    const fallbackNote = kind === "role" ? ROLE_TASK_PLACEHOLDER : "";
    const normalizedNote = node.note.trim() === LEGACY_ROLE_TASK_PLACEHOLDER ? ROLE_TASK_PLACEHOLDER : node.note;
    return {
      ...node,
      x: Number.isFinite(node.x) ? node.x : layout?.x ?? 0,
      y: Number.isFinite(node.y) ? node.y : layout?.y ?? 0,
      note: normalizedNote.trim() ? normalizedNote : fallbackNote,
    };
  });
}

export function normalizeOrgChartPayload(input: unknown): OrgChartCanvasPayload {
  const payload = (input && typeof input === "object" ? input : {}) as {
    nodes?: unknown;
    viewport?: unknown;
    meta?: unknown;
  };

  const rawNodes = Array.isArray(payload.nodes) ? payload.nodes : Array.isArray(input) ? input : [];
  const parsedNodes = rawNodes
    .map((row, index) => normalizeNode(row, Date.now() + index))
    .filter((row): row is OrgChartCanvasNode => Boolean(row));
  const sorted = sortNodes(stripOrphanParents(parsedNodes));
  const viewport = normalizeViewport(payload.viewport);
  const meta = payload.meta && typeof payload.meta === "object" ? (payload.meta as OrgChartCanvasPayload["meta"]) : undefined;
  return { nodes: sorted, viewport, meta };
}

export function withUpgradedLayout(input: OrgChartCanvasPayload): OrgChartCanvasPayload {
  const normalized = normalizeOrgChartPayload(input);
  if (!normalized.nodes.length) {
    return { ...normalizeOrgChartPayload(getOrgChartSeedPayload()) };
  }

  const needsLayout = requiresLayoutUpgrade(normalized.nodes);
  if (!needsLayout) return normalized;

  return {
    ...normalized,
    nodes: applyDeterministicLayout(normalized.nodes),
    meta: {
      version: ORG_CHART_CANVAS_VERSION,
      updatedAt: Date.now(),
      ...normalized.meta,
    },
  };
}

export function getOrgChartSeedPayload(): OrgChartCanvasPayload {
  const now = Date.now();
  const rows: OrgChartCanvasNode[] = [
    {
      id: "node-legend",
      kind: "legend",
      name: "Legend",
      position: "LEGEND",
      parentId: null,
      createdAt: now + 1,
      x: -560,
      y: -140,
      note: "Insert Company Logo on the space (Optional)\nPosition or job function of the team member",
    },
    {
      id: "node-tip",
      kind: "tip",
      name: "Pro-tip",
      position: "Pro-tip",
      parentId: null,
      createdAt: now + 2,
      x: -170,
      y: 120,
      note: "Create tasks for each member of the org chart to store key details.",
    },
    {
      id: "node-company",
      kind: "company",
      name: "Company",
      position: "COMPANY NAME",
      parentId: null,
      createdAt: now + 3,
      x: 280,
      y: -190,
      note: "Organizational Chart",
    },
    {
      id: "node-president",
      kind: "role",
      name: "Insert Name",
      position: "President",
      parentId: null,
      createdAt: now + 10,
      x: 280,
      y: -20,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-vp-main",
      kind: "role",
      name: "Insert Name",
      position: "Vice President",
      parentId: "node-president",
      createdAt: now + 11,
      x: 280,
      y: 170,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-exec-assistant",
      kind: "role",
      name: "Insert Name",
      position: "Executive Assistant",
      parentId: "node-president",
      createdAt: now + 12,
      x: 590,
      y: 170,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-vp-marketing",
      kind: "role",
      name: "Insert Name",
      position: "Vice President",
      parentId: "node-vp-main",
      createdAt: now + 13,
      x: -20,
      y: 380,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-vp-it",
      kind: "role",
      name: "Insert Name",
      position: "Vice President",
      parentId: "node-vp-main",
      createdAt: now + 14,
      x: 280,
      y: 380,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-ops-manager",
      kind: "role",
      name: "Insert Name",
      position: "Operations Manager",
      parentId: "node-vp-main",
      createdAt: now + 15,
      x: 600,
      y: 380,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-marketing-supervisor",
      kind: "role",
      name: "Insert Name",
      position: "Marketing Supervisor",
      parentId: "node-vp-marketing",
      createdAt: now + 16,
      x: -20,
      y: 570,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-it-supervisor",
      kind: "role",
      name: "Insert Name",
      position: "IT Supervisor",
      parentId: "node-vp-it",
      createdAt: now + 17,
      x: 280,
      y: 570,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-ops-supervisor",
      kind: "role",
      name: "Insert Name",
      position: "Operations Supervisor",
      parentId: "node-ops-manager",
      createdAt: now + 18,
      x: 600,
      y: 570,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-marketing-staff-1",
      kind: "role",
      name: "Insert Name",
      position: "Marketing Staff",
      parentId: "node-marketing-supervisor",
      createdAt: now + 19,
      x: -220,
      y: 760,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-marketing-staff-2",
      kind: "role",
      name: "Insert Name",
      position: "Marketing Staff",
      parentId: "node-marketing-supervisor",
      createdAt: now + 20,
      x: -20,
      y: 760,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-it-staff",
      kind: "role",
      name: "Insert Name",
      position: "IT Staff",
      parentId: "node-it-supervisor",
      createdAt: now + 21,
      x: 280,
      y: 760,
      note: ROLE_TASK_PLACEHOLDER,
    },
    {
      id: "node-ops-assistant",
      kind: "role",
      name: "Insert Name",
      position: "Operations Assistant",
      parentId: "node-ops-supervisor",
      createdAt: now + 22,
      x: 600,
      y: 760,
      note: ROLE_TASK_PLACEHOLDER,
    },
  ];

  return {
    nodes: rows,
    viewport: {
      x: 120,
      y: 80,
      zoom: 0.72,
    },
    meta: {
      version: ORG_CHART_CANVAS_VERSION,
      updatedAt: Date.now(),
    },
  };
}

