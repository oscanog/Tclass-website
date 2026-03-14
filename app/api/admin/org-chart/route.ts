import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  ORG_CHART_CANVAS_VERSION,
  getOrgChartSeedPayload,
  normalizeOrgChartPayload,
  withUpgradedLayout,
} from "@/lib/org-chart-canvas";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "org-chart.json");

async function readPayload() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(content) as unknown;
    const normalized = normalizeOrgChartPayload(parsed);
    if (normalized.nodes.length === 0) {
      return normalizeOrgChartPayload(getOrgChartSeedPayload());
    }
    return withUpgradedLayout(normalized);
  } catch {
    return normalizeOrgChartPayload(getOrgChartSeedPayload());
  }
}

export async function GET() {
  const payload = await readPayload();
  return NextResponse.json({
    nodes: payload.nodes,
    viewport: payload.viewport,
    meta: {
      version: ORG_CHART_CANVAS_VERSION,
      updatedAt: Date.now(),
      ...payload.meta,
    },
  });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const normalized = withUpgradedLayout(normalizeOrgChartPayload(body));
    const payload = {
      nodes: normalized.nodes,
      viewport: normalized.viewport,
      meta: {
        version: ORG_CHART_CANVAS_VERSION,
        updatedAt: Date.now(),
        ...normalized.meta,
      },
    };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf8");
    return NextResponse.json({ ok: true, ...payload });
  } catch {
    return NextResponse.json({ message: "Failed to save organizational chart." }, { status: 500 });
  }
}


