"use client";

import { memo, type ChangeEvent, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyNodeChanges,
  Background,
  type Connection,
  type Edge,
  Handle,
  type Node,
  type NodeChange,
  type NodeTypes,
  type NodeProps,
  Position,
  type ReactFlowInstance,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useNodesState,
  type Viewport,
} from "@xyflow/react";
import {
  ArrowRightLeft,
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Clipboard,
  FileText,
  FormInput,
  Goal,
  Hand,
  Home,
  Image as ImageIcon,
  LayoutTemplate,
  Keyboard,
  MousePointer2,
  PencilLine,
  Plus,
  Redo2,
  Search,
  Settings2,
  Share2,
  StickyNote,
  Target,
  Trash2,
  Undo2,
  UsersRound,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  type OrgChartCanvasNode,
  type OrgChartCanvasPayload,
  type OrgChartNodeKind,
  type OrgChartViewport,
  DEFAULT_ORG_CHART_VIEWPORT,
  ORG_CHART_CANVAS_STORAGE_KEY,
  ORG_CHART_CANVAS_VERSION,
  ROLE_TASK_PLACEHOLDER,
  getOrgChartSeedPayload,
  normalizeOrgChartPayload,
  withUpgradedLayout,
} from "@/lib/org-chart-canvas";
import { ThemeIconButton } from "@/components/ui/theme-icon-button";
import styles from "./org-chart-workspace.module.css";
import "@xyflow/react/dist/style.css";

type ToolMode = "select" | "pan" | "add" | "note" | "text" | "image";
type SaveState = "idle" | "saving" | "saved" | "error";
type NodeEditorDraft = {
  nodeId: string;
  name: string;
  position: string;
  note: string;
};

type InlineEditableField = "position" | "name" | "note";
type ActiveInlineEdit = {
  nodeId: string;
  field: InlineEditableField;
} | null;
type OrgCardDisplayDraft = Pick<NodeEditorDraft, "name" | "position" | "note">;
type OrgCardInlineHandlers = {
  start: (nodeId: string, field: InlineEditableField) => void;
  update: (nodeId: string, field: InlineEditableField, value: string) => void;
  commit: (nodeId: string) => void;
  cancel: (nodeId: string) => void;
};
type DragSessionState = {
  anchorId: string;
  selectedIds: string[];
} | null;

type OrgNodeData = {
  node: OrgChartCanvasNode;
  draft: OrgCardDisplayDraft;
  activeField: InlineEditableField | null;
  inlineHandlers: OrgCardInlineHandlers;
};

type OrgFlowNode = Node<OrgNodeData, "orgCard">;

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 1.8;
const ZOOM_STEP = 0.1;
const INPUT_COMMIT_DEBOUNCE_MS = 420;
const AUTOSAVE_DEBOUNCE_MS = 1400;
const MAX_HISTORY = 40;
const VIEWPORT_EPSILON = 0.0001;
const ROLE_POSITION_PLACEHOLDER = "Position";
const ROLE_NAME_PLACEHOLDER = "Full Name";
const ROLE_DESCRIPTION_PLACEHOLDER = "Describe this member's key responsibilities and expected outcomes in the company.";

const TOOLBAR_ITEMS = [
  { key: "select" as const, icon: MousePointer2, label: "Select", shortcut: "V" },
  { key: "pan" as const, icon: Hand, label: "Hand", shortcut: "H" },
  { key: "add" as const, icon: Plus, label: "Role", shortcut: "N" },
  { key: "note" as const, icon: StickyNote, label: "Note", shortcut: "D" },
  { key: "text" as const, icon: PencilLine, label: "Text", shortcut: "T" },
  { key: "image" as const, icon: ImageIcon, label: "Image", shortcut: "I" },
];

const SHORTCUT_TIPS = [
  { keys: "V", description: "Select tool" },
  { keys: "H", description: "Hand tool" },
  { keys: "N", description: "New role node" },
  { keys: "D", description: "New note node" },
  { keys: "T", description: "New text panel" },
  { keys: "Shift + Click", description: "Toggle multi-select" },
  { keys: "Space + Drag", description: "Pan canvas" },
  { keys: "Delete", description: "Remove selection" },
  { keys: "Ctrl/Cmd + Z/Y", description: "Undo/redo" },
  { keys: "Ctrl/Cmd + 0", description: "Reset zoom" },
];

const LEFT_RAIL_ITEMS = [
  { label: "Home", icon: Home },
  { label: "Planner", icon: Clock3 },
  { label: "AI", icon: Bot },
  { label: "Teams", icon: UsersRound },
  { label: "Docs", icon: FileText },
  { label: "Dashboard", icon: Target },
  { label: "Whiteboards", icon: LayoutTemplate, active: true },
  { label: "Forms", icon: FormInput },
  { label: "Clips", icon: Clipboard },
  { label: "Goals", icon: Goal },
];

function makeNodeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `oc-${crypto.randomUUID()}`;
  }
  return `oc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function areStringSetsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aSet = new Set(a);
  for (const value of b) {
    if (!aSet.has(value)) return false;
  }
  return true;
}

function isViewportEqual(a: OrgChartViewport, b: OrgChartViewport) {
  return (
    Math.abs(a.x - b.x) < VIEWPORT_EPSILON &&
    Math.abs(a.y - b.y) < VIEWPORT_EPSILON &&
    Math.abs(a.zoom - b.zoom) < VIEWPORT_EPSILON
  );
}

function isLegacyPlaceholderName(value: string) {
  return value.trim().toLowerCase() === "insert name";
}

function clonePayload(nodes: OrgChartCanvasNode[], viewport: OrgChartViewport) {
  return {
    nodes: nodes.map((node) => ({ ...node })),
    viewport: { ...viewport },
  };
}

function ensureRoleNodeDefaults(node: OrgChartCanvasNode): OrgChartCanvasNode {
  if ((node.kind ?? "role") !== "role") return node;
  const note = node.note.trim() ? node.note : ROLE_TASK_PLACEHOLDER;
  return { ...node, note, kind: "role" };
}

function createsCycle(nodes: OrgChartCanvasNode[], childId: string, nextParentId: string | null) {
  if (!nextParentId) return false;
  if (childId === nextParentId) return true;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let cursor: string | null = nextParentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === childId) return true;
    if (seen.has(cursor)) return false;
    seen.add(cursor);
    const nextNode = byId.get(cursor);
    cursor = nextNode?.parentId ?? null;
  }
  return false;
}

function getDescendants(nodes: OrgChartCanvasNode[], rootId: string) {
  const descendants = new Set<string>();
  const childrenByParent = new Map<string, string[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const bucket = childrenByParent.get(node.parentId) ?? [];
    bucket.push(node.id);
    childrenByParent.set(node.parentId, bucket);
  }

  const stack = [rootId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const children = childrenByParent.get(current) ?? [];
    for (const childId of children) {
      if (descendants.has(childId)) continue;
      descendants.add(childId);
      stack.push(childId);
    }
  }

  return descendants;
}

function buildFlowNodes(
  modelNodes: OrgChartCanvasNode[],
  options?: {
    editorDraft?: NodeEditorDraft | null;
    activeInlineEdit?: ActiveInlineEdit;
    inlineHandlers?: OrgCardInlineHandlers;
    selectedIds?: string[];
  },
): OrgFlowNode[] {
  const editorDraft = options?.editorDraft ?? null;
  const activeInlineEdit = options?.activeInlineEdit ?? null;
  const inlineHandlers = options?.inlineHandlers ?? {
    start: () => undefined,
    update: () => undefined,
    commit: () => undefined,
    cancel: () => undefined,
  };
  const selectedSet = new Set(options?.selectedIds ?? []);
  return modelNodes.map((node) => {
    const normalizedName = isLegacyPlaceholderName(node.name) ? "" : node.name;
    const draft: OrgCardDisplayDraft =
      editorDraft && editorDraft.nodeId === node.id
        ? {
            name: editorDraft.name,
            position: editorDraft.position,
            note: editorDraft.note,
          }
        : {
            name: normalizedName,
            position: node.position,
            note: node.note,
          };
    const activeField = activeInlineEdit && activeInlineEdit.nodeId === node.id ? activeInlineEdit.field : null;
    const isRole = (node.kind ?? "role") === "role";
    return {
      id: node.id,
      type: "orgCard",
      data: {
        node,
        draft,
        activeField,
        inlineHandlers,
      },
      position: { x: node.x, y: node.y },
      draggable: isRole ? !activeField : true,
      selectable: true,
      selected: selectedSet.has(node.id),
    };
  });
}

function syncRfNodesWithModel(
  modelNodes: OrgChartCanvasNode[],
  prevRfNodes: OrgFlowNode[],
  options?: {
    editorDraft?: NodeEditorDraft | null;
    activeInlineEdit?: ActiveInlineEdit;
    inlineHandlers?: OrgCardInlineHandlers;
    selectedIds?: string[];
    forceModelPositions?: boolean;
  },
): OrgFlowNode[] {
  const editorDraft = options?.editorDraft ?? null;
  const activeInlineEdit = options?.activeInlineEdit ?? null;
  const inlineHandlers = options?.inlineHandlers ?? {
    start: () => undefined,
    update: () => undefined,
    commit: () => undefined,
    cancel: () => undefined,
  };
  const selectedSet = new Set(options?.selectedIds ?? []);
  const forceModelPositions = options?.forceModelPositions ?? false;
  const prevMap = new Map(prevRfNodes.map((node) => [node.id, node]));
  let changed = prevRfNodes.length !== modelNodes.length;

  const nextRfNodes = modelNodes.map((node) => {
    const prev = prevMap.get(node.id);
    const normalizedName = isLegacyPlaceholderName(node.name) ? "" : node.name;
    const draft: OrgCardDisplayDraft =
      editorDraft && editorDraft.nodeId === node.id
        ? {
            name: editorDraft.name,
            position: editorDraft.position,
            note: editorDraft.note,
          }
        : {
            name: normalizedName,
            position: node.position,
            note: node.note,
          };
    const activeField = activeInlineEdit && activeInlineEdit.nodeId === node.id ? activeInlineEdit.field : null;
    const isRole = (node.kind ?? "role") === "role";
    const position =
      forceModelPositions || !prev
        ? { x: node.x, y: node.y }
        : prev.position;

    const nextNode: OrgFlowNode = {
      id: node.id,
      type: "orgCard",
      data: {
        node,
        draft,
        activeField,
        inlineHandlers,
      },
      position,
      draggable: isRole ? !activeField : true,
      selectable: true,
      selected: prev?.selected ?? selectedSet.has(node.id),
    };

    if (
      prev &&
      prev.type === nextNode.type &&
      prev.selected === nextNode.selected &&
      prev.draggable === nextNode.draggable &&
      prev.selectable === nextNode.selectable &&
      Math.abs(prev.position.x - nextNode.position.x) < VIEWPORT_EPSILON &&
      Math.abs(prev.position.y - nextNode.position.y) < VIEWPORT_EPSILON &&
      prev.data.node === nextNode.data.node &&
      prev.data.activeField === nextNode.data.activeField &&
      prev.data.inlineHandlers === nextNode.data.inlineHandlers &&
      prev.data.draft.name === nextNode.data.draft.name &&
      prev.data.draft.position === nextNode.data.draft.position &&
      prev.data.draft.note === nextNode.data.draft.note
    ) {
      return prev;
    }

    changed = true;
    return nextNode;
  });

  return changed ? nextRfNodes : prevRfNodes;
}

function toFlowEdges(nodes: OrgChartCanvasNode[]): Edge[] {
  return nodes
    .filter((node) => Boolean(node.parentId))
    .map((node) => ({
      id: `edge-${node.parentId}-${node.id}`,
      source: node.parentId!,
      target: node.id,
      type: "smoothstep",
      animated: false,
      style: { stroke: "var(--oc-connector)", strokeWidth: 1.35 },
    }));
}

const OrgCardNode = memo(function OrgCardNode({ data, selected, dragging }: NodeProps<OrgFlowNode>) {
  const node = ensureRoleNodeDefaults(data.node);
  const kind = node.kind ?? "role";
  const isSelected = selected;
  const displayName = data.draft.name.trim();
  const displayPosition = data.draft.position.trim();
  const displayTask = data.draft.note.trim() ? data.draft.note.trim() : ROLE_DESCRIPTION_PLACEHOLDER;
  const activeField = data.activeField;

  const handleFieldDoubleClick = (field: InlineEditableField) => (event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    data.inlineHandlers.start(node.id, field);
  };

  const stopPointerPropagation = (event: ReactMouseEvent) => {
    event.stopPropagation();
  };

  const handleFieldKeyDown =
    (field: InlineEditableField) => (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        data.inlineHandlers.cancel(node.id);
        return;
      }

      if (event.key !== "Enter") return;
      if (field === "note" && event.shiftKey) return;

      event.preventDefault();
      data.inlineHandlers.commit(node.id);
    };

  if (kind === "legend") {
    return (
      <div className={`${styles.legendNode} ${isSelected ? styles.nodeSelected : ""}`}>
        <p className={styles.legendTitle}>{node.position}</p>
        <p className={styles.legendBody}>{node.note}</p>
      </div>
    );
  }

  if (kind === "tip") {
    return (
      <div className={`${styles.tipNode} ${isSelected ? styles.nodeSelected : ""}`}>
        <p className={styles.tipBody}>{node.note}</p>
      </div>
    );
  }

  if (kind === "company") {
    return (
      <div className={`${styles.companyNode} ${isSelected ? styles.nodeSelected : ""}`}>
        <div className={styles.companyOrb}>
          <span>Company</span>
          <span>Logo</span>
        </div>
        <p className={styles.companyName}>{node.position}</p>
        <p className={styles.companySubtitle}>{node.note}</p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.roleNode} ${isSelected ? styles.nodeSelected : ""} ${dragging ? styles.roleNodeDragging : ""} ${activeField ? styles.roleNodeEditing : ""}`}
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <div className={styles.rolePositionBand} onDoubleClick={handleFieldDoubleClick("position")}>
        {activeField === "position" ? (
          <input
            className={`nodrag ${styles.inlineCardInput}`}
            value={data.draft.position}
            onChange={(event) => data.inlineHandlers.update(node.id, "position", event.target.value)}
            onBlur={() => data.inlineHandlers.commit(node.id)}
            onKeyDown={handleFieldKeyDown("position")}
            onMouseDown={stopPointerPropagation}
            autoFocus
            placeholder={ROLE_POSITION_PLACEHOLDER}
          />
        ) : (
          <p className={styles.rolePositionText}>{displayPosition || ROLE_POSITION_PLACEHOLDER}</p>
        )}
      </div>
      <div className={styles.roleNameBand} onDoubleClick={handleFieldDoubleClick("name")}>
        {activeField === "name" ? (
          <input
            className={`nodrag ${styles.inlineCardInput} ${styles.inlineCardNameInput}`}
            value={data.draft.name}
            onChange={(event) => data.inlineHandlers.update(node.id, "name", event.target.value)}
            onBlur={() => data.inlineHandlers.commit(node.id)}
            onKeyDown={handleFieldKeyDown("name")}
            onMouseDown={stopPointerPropagation}
            autoFocus
            placeholder={ROLE_NAME_PLACEHOLDER}
          />
        ) : (
          <p className={styles.roleNameText}>{displayName || ROLE_NAME_PLACEHOLDER}</p>
        )}
      </div>
      <div className={styles.roleDescriptionPanel} onDoubleClick={handleFieldDoubleClick("note")}>
        {activeField === "note" ? (
          <textarea
            className={`nodrag nowheel ${styles.inlineCardTextarea}`}
            value={data.draft.note}
            onChange={(event) => data.inlineHandlers.update(node.id, "note", event.target.value)}
            onBlur={() => data.inlineHandlers.commit(node.id)}
            onKeyDown={handleFieldKeyDown("note")}
            onMouseDown={stopPointerPropagation}
            rows={4}
            autoFocus
            placeholder={ROLE_DESCRIPTION_PLACEHOLDER}
          />
        ) : (
          <p className={styles.roleDescriptionText}>{displayTask}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  );
});

OrgCardNode.displayName = "OrgCardNode";

const nodeTypes: NodeTypes = { orgCard: OrgCardNode };

function OrgChartCanvas() {
  const [nodes, setNodes] = useState<OrgChartCanvasNode[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isInspectorSheetOpen, setIsInspectorSheetOpen] = useState(false);
  const [viewport, setViewport] = useState<OrgChartViewport>(DEFAULT_ORG_CHART_VIEWPORT);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("Auto-save enabled");
  const [isReady, setIsReady] = useState(false);
  const [isHydrationFromFallback, setIsHydrationFromFallback] = useState(false);
  const [editorDraft, setEditorDraft] = useState<NodeEditorDraft | null>(null);
  const [activeInlineEdit, setActiveInlineEdit] = useState<ActiveInlineEdit>(null);
  const [activeInspectorNodeId, setActiveInspectorNodeId] = useState<string | null>(null);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [rfNodes, setRfNodes] = useNodesState<OrgFlowNode>([]);

  const flowRef = useRef<ReactFlowInstance<OrgFlowNode, Edge> | null>(null);
  const hasAppliedInitialViewport = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const inputCommitTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const shortcutHelpRef = useRef<HTMLDivElement | null>(null);
  const inspectorEditingRef = useRef(false);
  const inlineEditingRef = useRef(false);
  const editorDraftRef = useRef<NodeEditorDraft | null>(null);
  const rfNodesRef = useRef<OrgFlowNode[]>([]);
  const selectedIdsRef = useRef<string[]>([]);
  const dragSessionRef = useRef<DragSessionState>(null);
  const inlineHandlersRef = useRef<OrgCardInlineHandlers>({
    start: () => undefined,
    update: () => undefined,
    commit: () => undefined,
    cancel: () => undefined,
  });
  const undoStackRef = useRef<Array<{ nodes: OrgChartCanvasNode[]; viewport: OrgChartViewport }>>([]);
  const redoStackRef = useRef<Array<{ nodes: OrgChartCanvasNode[]; viewport: OrgChartViewport }>>([]);
  editorDraftRef.current = editorDraft;
  inlineEditingRef.current = Boolean(activeInlineEdit);
  rfNodesRef.current = rfNodes;
  selectedIdsRef.current = selectedIds;
  const flowEdges = useMemo(() => toFlowEdges(nodes), [nodes]);
  const selectedNodes = useMemo(() => {
    if (selectedIds.length === 0) return [] as OrgChartCanvasNode[];
    const selectedSet = new Set(selectedIds);
    return nodes.filter((node) => selectedSet.has(node.id));
  }, [nodes, selectedIds]);
  const inspectorNode = useMemo(
    () => selectedNodes.find((node) => node.id === activeInspectorNodeId) ?? selectedNodes[0] ?? null,
    [activeInspectorNodeId, selectedNodes],
  );
  const inspectorNodeParentOptions = useMemo(() => {
    if (!inspectorNode) return nodes;
    const blocked = getDescendants(nodes, inspectorNode.id);
    blocked.add(inspectorNode.id);
    return nodes.filter((node) => !blocked.has(node.id));
  }, [inspectorNode, nodes]);
  const toEditorDraftFromNode = useCallback((node: OrgChartCanvasNode): NodeEditorDraft => {
    const normalizedName = isLegacyPlaceholderName(node.name) ? "" : node.name;
    return {
      nodeId: node.id,
      name: normalizedName,
      position: node.position,
      note: node.note,
    };
  }, []);
  const selectedDraft = useMemo(() => {
    if (!inspectorNode) return null;
    if (editorDraft?.nodeId === inspectorNode.id) return editorDraft;
    return toEditorDraftFromNode(inspectorNode);
  }, [editorDraft, inspectorNode, toEditorDraftFromNode]);
  const isCanvasInteractionBlocked = isMobileViewport && isInspectorSheetOpen;

  const captureSnapshot = useCallback(() => clonePayload(nodes, viewport), [nodes, viewport]);

  const pushUndo = useCallback(() => {
    undoStackRef.current.push(captureSnapshot());
    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
  }, [captureSnapshot]);

  const replaceRfNodes = useCallback(
    (updater: OrgFlowNode[] | ((prev: OrgFlowNode[]) => OrgFlowNode[])) => {
      setRfNodes((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        rfNodesRef.current = next;
        return next;
      });
    },
    [setRfNodes],
  );

  const replaceState = useCallback((nextNodes: OrgChartCanvasNode[], nextViewport: OrgChartViewport) => {
    const nextRfNodes = buildFlowNodes(nextNodes, {
      inlineHandlers: inlineHandlersRef.current,
      selectedIds: [],
    });

    setNodes(nextNodes);
    replaceRfNodes(nextRfNodes);
    setViewport(nextViewport);
    selectedIdsRef.current = [];
    setSelectedIds([]);
    setActiveInlineEdit(null);
    setActiveInspectorNodeId(null);
    dragSessionRef.current = null;
    if (flowRef.current) {
      flowRef.current.setViewport(nextViewport, { duration: 120 });
    }
  }, [replaceRfNodes]);

  const setModelNodes = useCallback(
    (updater: OrgChartCanvasNode[] | ((prev: OrgChartCanvasNode[]) => OrgChartCanvasNode[])) => {
      setNodes((prev) => {
        return typeof updater === "function" ? updater(prev) : updater;
      });
    },
    [],
  );

  const syncCanvasSelection = useCallback(
    (nextIds: string[]) => {
      const normalized = Array.from(new Set(nextIds));
      const selectedSet = new Set(normalized);

      selectedIdsRef.current = normalized;
      setSelectedIds((prev) => (areStringSetsEqual(prev, normalized) ? prev : normalized));
      replaceRfNodes((prev) => {
        let changed = false;
        const next = prev.map((node) => {
          const shouldSelect = selectedSet.has(node.id);
          if (node.selected === shouldSelect) {
            return node;
          }
          changed = true;
          return { ...node, selected: shouldSelect };
        });
        return changed ? next : prev;
      });
    },
    [replaceRfNodes],
  );

  const syncInspectorFromSelection = useCallback((nextIds: string[]) => {
    setActiveInlineEdit((active) => (active && !nextIds.includes(active.nodeId) ? null : active));
    setActiveInspectorNodeId((prevActive) => {
      if (nextIds.length === 0) return null;
      if (!prevActive || !nextIds.includes(prevActive)) return nextIds[0] ?? null;
      return prevActive;
    });
  }, []);

  const handleRfNodesChange = useCallback((changes: NodeChange<OrgFlowNode>[]) => {
    const dragActive = Boolean(dragSessionRef.current);
    const filteredChanges = changes.filter((change) => !(dragActive && change.type === "select"));
    if (filteredChanges.length === 0) return;

    const nextRfNodes = applyNodeChanges(filteredChanges, rfNodesRef.current);
    const nextSelectedIds = nextRfNodes.filter((node) => node.selected).map((node) => node.id);

    if (
      !dragActive &&
      nextSelectedIds.length === 0 &&
      selectedIdsRef.current.length > 0 &&
      (inspectorEditingRef.current || inlineEditingRef.current)
    ) {
      return;
    }

    rfNodesRef.current = nextRfNodes;
    setRfNodes(nextRfNodes);

    if (dragActive || areStringSetsEqual(selectedIdsRef.current, nextSelectedIds)) {
      return;
    }

    selectedIdsRef.current = nextSelectedIds;
    setSelectedIds((prev) => (areStringSetsEqual(prev, nextSelectedIds) ? prev : nextSelectedIds));
    syncInspectorFromSelection(nextSelectedIds);
  }, [setRfNodes, syncInspectorFromSelection]);

  const handleUndo = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    redoStackRef.current.push(captureSnapshot());
    replaceState(prev.nodes, prev.viewport);
    setSaveState("saving");
  }, [captureSnapshot, replaceState]);

  const handleRedo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(captureSnapshot());
    replaceState(next.nodes, next.viewport);
    setSaveState("saving");
  }, [captureSnapshot, replaceState]);

  const updateNode = useCallback((nodeId: string, patch: Partial<OrgChartCanvasNode>) => {
    setModelNodes((prev) => prev.map((node) => (node.id === nodeId ? ensureRoleNodeDefaults({ ...node, ...patch }) : node)));
    setSaveState("saving");
  }, [setModelNodes]);

  const commitEditorDraft = useCallback(
    (draft: NodeEditorDraft) => {
      const current = nodes.find((row) => row.id === draft.nodeId);
      if (!current) return;
      if (current.name === draft.name && current.position === draft.position && current.note === draft.note) return;
      setModelNodes((prev) =>
        prev.map((node) =>
          node.id === draft.nodeId
            ? ensureRoleNodeDefaults({
                ...node,
                name: draft.name,
                position: draft.position,
                note: draft.note,
              })
            : node,
        ),
      );
      setSaveState("saving");
    },
    [nodes, setModelNodes],
  );

  const flushEditorDraft = useCallback(() => {
    const draft = editorDraftRef.current;
    if (!draft) return;
    if (inputCommitTimerRef.current) {
      window.clearTimeout(inputCommitTimerRef.current);
      inputCommitTimerRef.current = null;
    }
    commitEditorDraft(draft);
  }, [commitEditorDraft]);

  const updateEditorDraftField = useCallback(
    (nodeId: string, field: InlineEditableField, value: string) => {
      setEditorDraft((prev) => {
        const base = prev?.nodeId === nodeId ? prev : nodes.find((row) => row.id === nodeId);
        if (!base) return prev;
        const nextBase = "id" in base ? toEditorDraftFromNode(base) : base;
        return {
          nodeId,
          name: field === "name" ? value : nextBase.name,
          position: field === "position" ? value : nextBase.position,
          note: field === "note" ? value : nextBase.note,
        };
      });
    },
    [nodes, toEditorDraftFromNode],
  );

  const startInlineEdit = useCallback(
    (nodeId: string, field: InlineEditableField) => {
      const node = nodes.find((row) => row.id === nodeId);
      if (!node || (node.kind ?? "role") !== "role") return;

      const pendingDraft = editorDraftRef.current;
      if (pendingDraft && pendingDraft.nodeId !== nodeId) {
        commitEditorDraft(pendingDraft);
      }

      syncCanvasSelection([nodeId]);
      setActiveInspectorNodeId(nodeId);
      setToolMode("select");
      setEditorDraft((prev) => (prev?.nodeId === nodeId ? prev : toEditorDraftFromNode(node)));
      setActiveInlineEdit({ nodeId, field });
    },
    [commitEditorDraft, nodes, syncCanvasSelection, toEditorDraftFromNode],
  );

  const commitInlineEdit = useCallback(
    (nodeId: string) => {
      const draft = editorDraftRef.current;
      if (draft && draft.nodeId === nodeId) {
        if (inputCommitTimerRef.current) {
          window.clearTimeout(inputCommitTimerRef.current);
          inputCommitTimerRef.current = null;
        }
        commitEditorDraft(draft);
      }
      setActiveInlineEdit((prev) => (prev?.nodeId === nodeId ? null : prev));
    },
    [commitEditorDraft],
  );

  const cancelInlineEdit = useCallback(
    (nodeId: string) => {
      if (inputCommitTimerRef.current) {
        window.clearTimeout(inputCommitTimerRef.current);
        inputCommitTimerRef.current = null;
      }
      const node = nodes.find((row) => row.id === nodeId);
      if (node) {
        setEditorDraft(toEditorDraftFromNode(node));
      }
      setActiveInlineEdit((prev) => (prev?.nodeId === nodeId ? null : prev));
    },
    [nodes, toEditorDraftFromNode],
  );
  inlineHandlersRef.current.start = startInlineEdit;
  inlineHandlersRef.current.update = updateEditorDraftField;
  inlineHandlersRef.current.commit = commitInlineEdit;
  inlineHandlersRef.current.cancel = cancelInlineEdit;

  const addNode = useCallback(
    (kind: OrgChartNodeKind, position?: { x: number; y: number }) => {
      const center = flowRef.current?.screenToFlowPosition({
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.55,
      });

      const x = position?.x ?? center?.x ?? 120;
      const y = position?.y ?? center?.y ?? 200;
      const id = makeNodeId();
      const newNode: OrgChartCanvasNode = ensureRoleNodeDefaults({
        id,
        kind,
        name: kind === "role" ? "" : kind === "company" ? "Company" : "Notes",
        position:
          kind === "role"
            ? "Executive Staff"
            : kind === "legend"
              ? "LEGEND"
              : kind === "company"
                ? "COMPANY NAME"
                : "Pro-tip",
        parentId: null,
        createdAt: Date.now(),
        x,
        y,
        note:
          kind === "role"
            ? ROLE_TASK_PLACEHOLDER
            : kind === "company"
              ? "Organizational Chart"
              : "Type note...",
      });

      pushUndo();
      setModelNodes((prev) => [...prev, newNode]);
      syncCanvasSelection([id]);
      setActiveInlineEdit(null);
      setActiveInspectorNodeId(id);
      setToolMode("select");
      setSaveState("saving");
    },
    [pushUndo, setModelNodes, syncCanvasSelection],
  );

  const quickAddSampleNode = useCallback(() => {
    pushUndo();
    setModelNodes((prev) => [
      ...prev,
      ensureRoleNodeDefaults({
        id: makeNodeId(),
        name: "Full Name",
        position: "Executive Staff",
        parentId: null,
        createdAt: Date.now(),
        x: 640,
        y: 210,
        note: ROLE_TASK_PLACEHOLDER,
        kind: "role",
      }),
    ]);
  }, [pushUndo, setModelNodes]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    pushUndo();
    const removeSet = new Set(selectedIds);
    setModelNodes((prev) =>
      prev
        .filter((node) => !removeSet.has(node.id))
        .map((node) => (node.parentId && removeSet.has(node.parentId) ? { ...node, parentId: null } : node)),
    );
    setActiveInlineEdit((prev) => (prev && removeSet.has(prev.nodeId) ? null : prev));
    syncCanvasSelection([]);
    setActiveInspectorNodeId(null);
    dragSessionRef.current = null;
    setSaveState("saving");
    toast.success("Selected node(s) removed.");
  }, [pushUndo, selectedIds, setModelNodes, syncCanvasSelection]);

  const handleSetParent = useCallback(
    (nodeId: string, parentId: string | null) => {
      setModelNodes((prev) => {
        if (createsCycle(prev, nodeId, parentId)) {
          toast.error("That connection would create a loop.");
          return prev;
        }
        return prev.map((node) => (node.id === nodeId ? { ...node, parentId } : node));
      });
      setSaveState("saving");
    },
    [setModelNodes],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      pushUndo();
      handleSetParent(connection.target, connection.source);
    },
    [handleSetParent, pushUndo],
  );

  const handleReconnect = useCallback(
    (_oldEdge: Edge, connection: Connection) => {
      if (!connection.source || !connection.target) return;
      pushUndo();
      handleSetParent(connection.target, connection.source);
      toast.success("Reporting line updated.");
    },
    [handleSetParent, pushUndo],
  );

  const handlePaneClick = useCallback(
    (event: ReactMouseEvent) => {
      if (isCanvasInteractionBlocked) return;
      if (toolMode !== "add" && toolMode !== "note" && toolMode !== "text") return;
      const pos = flowRef.current?.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      if (!pos) return;
      if (toolMode === "add") addNode("role", pos);
      if (toolMode === "note") addNode("tip", pos);
      if (toolMode === "text") addNode("legend", pos);
    },
    [addNode, isCanvasInteractionBlocked, toolMode],
  );

  const clearSelection = useCallback(() => {
    syncCanvasSelection([]);
    setActiveInspectorNodeId(null);
    setActiveInlineEdit(null);
    dragSessionRef.current = null;
  }, [syncCanvasSelection]);

  const handleNodeClick = useCallback((_event: ReactMouseEvent, node: OrgFlowNode) => {
    setActiveInspectorNodeId(node.id);
  }, []);

  const commitDraggedPositions = useCallback(
    (fallbackNodeId: string) => {
      const session = dragSessionRef.current;
      const idsToCommit = session?.selectedIds.length ? session.selectedIds : [fallbackNodeId];
      const idSet = new Set(idsToCommit);
      const positionById = new Map(rfNodesRef.current.map((node) => [node.id, node.position]));

      setModelNodes((prev) => {
        let changed = false;
        const next = prev.map((row) => {
          if (!idSet.has(row.id)) return row;
          const position = positionById.get(row.id);
          if (!position) return row;
          if (
            Math.abs(row.x - position.x) < VIEWPORT_EPSILON &&
            Math.abs(row.y - position.y) < VIEWPORT_EPSILON
          ) {
            return row;
          }
          changed = true;
          return { ...row, x: position.x, y: position.y };
        });
        return changed ? next : prev;
      });
    },
    [setModelNodes],
  );

  const handleNodeDragStart = useCallback(
    (_event: ReactMouseEvent, node: OrgFlowNode) => {
      pushUndo();
      setActiveInlineEdit(null);
      const activeIds = selectedIdsRef.current;

      if (!activeIds.includes(node.id)) {
        dragSessionRef.current = {
          anchorId: node.id,
          selectedIds: [node.id],
        };
        syncCanvasSelection([node.id]);
        setActiveInspectorNodeId(node.id);
        return;
      }

      dragSessionRef.current = {
        anchorId: node.id,
        selectedIds: activeIds.length > 0 ? [...activeIds] : [node.id],
      };
    },
    [pushUndo, syncCanvasSelection],
  );

  const handleNodeDragStop = useCallback(
    (_event: ReactMouseEvent, node: OrgFlowNode) => {
      commitDraggedPositions(node.id);
      dragSessionRef.current = null;
      setSaveState("saving");
    },
    [commitDraggedPositions],
  );

  const handleImageUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !inspectorNode) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return;
        pushUndo();
        updateNode(inspectorNode.id, { logoUrl: reader.result });
        toast.success("Image attached to selected node.");
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    },
    [inspectorNode, pushUndo, updateNode],
  );

  const resetViewport = useCallback(() => {
    if (!flowRef.current) return;
    const next = { x: 0, y: 0, zoom: 1 };
    pushUndo();
    flowRef.current.setViewport(next, { duration: 200 });
    setViewport(next);
    setSaveState("saving");
  }, [pushUndo]);

  const nudgeZoom = useCallback(
    (direction: 1 | -1) => {
      if (!flowRef.current) return;
      const current = flowRef.current.getViewport();
      const nextZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, current.zoom + direction * ZOOM_STEP));
      const nextViewport = { ...current, zoom: Number(nextZoom.toFixed(2)) };
      pushUndo();
      flowRef.current.setViewport(nextViewport, { duration: 140 });
      setViewport(nextViewport);
      setSaveState("saving");
    },
    [pushUndo],
  );

  const fitCanvas = useCallback(() => {
    if (!flowRef.current) return;
    pushUndo();
    flowRef.current.fitView({ padding: 0.24, duration: 220 });
    setTimeout(() => {
      if (!flowRef.current) return;
      setViewport(flowRef.current.getViewport());
      setSaveState("saving");
    }, 260);
  }, [pushUndo]);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const response = await fetch("/api/admin/org-chart", { method: "GET", cache: "no-store", credentials: "same-origin" });
        if (response.ok) {
          const payload = withUpgradedLayout(normalizeOrgChartPayload(await response.json()));
          if (active) {
            replaceState(payload.nodes, payload.viewport);
            setSaveMessage("Synced with server");
            setIsHydrationFromFallback(false);
            setIsReady(true);
            return;
          }
        }
      } catch {
        // Falls through to local cache/seed.
      }

      try {
        const raw = window.localStorage.getItem(ORG_CHART_CANVAS_STORAGE_KEY);
        const payload = withUpgradedLayout(normalizeOrgChartPayload(raw ? JSON.parse(raw) : null));
        if (active) {
          replaceState(payload.nodes, payload.viewport);
          setSaveMessage("Working from local cache (server unavailable)");
          setIsHydrationFromFallback(true);
          setIsReady(true);
        }
      } catch {
        if (active) {
          const seed = getOrgChartSeedPayload();
          replaceState(seed.nodes, seed.viewport);
          setSaveMessage("Loaded default org chart template");
          setIsHydrationFromFallback(true);
          setIsReady(true);
        }
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [replaceState]);

  useEffect(() => {
    if (!isReady || !flowRef.current || hasAppliedInitialViewport.current) return;
    flowRef.current.setViewport(viewport, { duration: 0 });
    hasAppliedInitialViewport.current = true;
  }, [isReady, viewport]);

  useEffect(() => {
    replaceRfNodes((prev) =>
      syncRfNodesWithModel(nodes, prev, {
        editorDraft,
        activeInlineEdit,
        inlineHandlers: inlineHandlersRef.current,
        selectedIds,
      }),
    );
  }, [activeInlineEdit, editorDraft, nodes, replaceRfNodes, selectedIds]);

  useEffect(() => {
    if (!inspectorNode) {
      setEditorDraft(null);
      setActiveInlineEdit(null);
      return;
    }
    if (activeInlineEdit && activeInlineEdit.nodeId !== inspectorNode.id) {
      setActiveInlineEdit(null);
    }
    setEditorDraft((prev) => {
      const next = toEditorDraftFromNode(inspectorNode);
      if (
        prev &&
        prev.nodeId === next.nodeId &&
        prev.name === next.name &&
        prev.position === next.position &&
        prev.note === next.note
      ) {
        return prev;
      }
      return next;
    });
  }, [activeInlineEdit, inspectorNode, toEditorDraftFromNode]);

  useEffect(() => {
    if (selectedNodes.length === 0) {
      setActiveInspectorNodeId(null);
      return;
    }
    setActiveInspectorNodeId((prev) => {
      if (prev && selectedNodes.some((node) => node.id === prev)) return prev;
      return selectedNodes[0]?.id ?? null;
    });
  }, [selectedNodes]);

  useEffect(() => {
    if (!editorDraft) return;
    if (inputCommitTimerRef.current) window.clearTimeout(inputCommitTimerRef.current);
    inputCommitTimerRef.current = window.setTimeout(() => {
      commitEditorDraft(editorDraft);
      inputCommitTimerRef.current = null;
    }, INPUT_COMMIT_DEBOUNCE_MS);
    return () => {
      if (inputCommitTimerRef.current) {
        window.clearTimeout(inputCommitTimerRef.current);
      }
    };
  }, [commitEditorDraft, editorDraft]);

  useEffect(() => {
    if (!isReady) return;
    const payload: OrgChartCanvasPayload = {
      nodes,
      viewport,
      meta: {
        version: ORG_CHART_CANVAS_VERSION,
        updatedAt: Date.now(),
      },
    };

    try {
      window.localStorage.setItem(ORG_CHART_CANVAS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore local storage quota issues for org chart local mode.
    }

    setSaveState("saving");
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/org-chart", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("save failed");
        setSaveState("saved");
        setSaveMessage("All changes saved");
      } catch {
        setSaveState("error");
        setSaveMessage("Save failed. Local cache kept.");
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [isReady, nodes, viewport]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 920px)");
    const applyViewportMode = (matches: boolean) => {
      setIsMobileViewport(matches);
    };
    applyViewportMode(mediaQuery.matches);

    const onViewportChange = (event: MediaQueryListEvent) => {
      applyViewportMode(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onViewportChange);
      return () => mediaQuery.removeEventListener("change", onViewportChange);
    }

    mediaQuery.addListener(onViewportChange);
    return () => mediaQuery.removeListener(onViewportChange);
  }, []);

  useEffect(() => {
    if (isMobileViewport) {
      setToolMode("pan");
      setIsInspectorSheetOpen(false);
      setIsShortcutHelpOpen(false);
      return;
    }
    setIsInspectorSheetOpen(false);
  }, [isMobileViewport]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
        return;
      }

      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && (key === "y" || (key === "z" && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && key === "0") {
        event.preventDefault();
        resetViewport();
        return;
      }
      if (key === "escape") {
        setIsShortcutHelpOpen(false);
        setIsInspectorSheetOpen(false);
      }

      if (key === "v") setToolMode("select");
      if (key === "h") setToolMode("pan");
      if (key === "n") addNode("role");
      if (key === "d") addNode("tip");
      if (key === "t") addNode("legend");
      if (key === "i") fileInputRef.current?.click();
      if (key === "=" || key === "+") nudgeZoom(1);
      if (key === "-") nudgeZoom(-1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (inputCommitTimerRef.current) {
        window.clearTimeout(inputCommitTimerRef.current);
      }
    };
  }, [addNode, deleteSelected, handleRedo, handleUndo, nudgeZoom, resetViewport]);

  useEffect(() => {
    if (!isShortcutHelpOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as globalThis.Node | null;
      if (target && shortcutHelpRef.current?.contains(target)) return;
      setIsShortcutHelpOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [isShortcutHelpOpen]);

  const zoomPercent = Math.round((viewport.zoom || 1) * 100);

  return (
    <div className={`${styles.root} ${isMobileViewport ? styles.rootMobile : ""} ${isMobileViewport && isInspectorSheetOpen ? styles.rootMobileSheetOpen : ""}`}>
      <aside className={styles.leftRail}>
        <div className={styles.workspaceLabel}>
          <div className={styles.workspaceDot}>C</div>
          <span>PrimeX Ventures</span>
        </div>
        <nav className={styles.railNav}>
          {LEFT_RAIL_ITEMS.map((item) => (
            <button key={item.label} type="button" className={`${styles.railItem} ${item.active ? styles.railItemActive : ""}`}>
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className={styles.boardArea}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button type="button" className={styles.ghostIcon}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" className={styles.ghostIcon}>
              <ChevronRight size={16} />
            </button>
            <div className={styles.boardTitle}>Organizational Chart</div>
          </div>
          <div className={styles.searchShell}>
            <Search size={15} />
            <span>Search</span>
            <kbd>Ctrl K</kbd>
          </div>
          <div className={styles.topBarRight}>
            {isMobileViewport ? (
              <button
                type="button"
                className={`${styles.mobilePanelBtn} ${isInspectorSheetOpen ? styles.mobilePanelBtnActive : ""}`}
                onClick={() => setIsInspectorSheetOpen((prev) => !prev)}
              >
                Panel
              </button>
            ) : null}
            <ThemeIconButton className="h-8 w-8 rounded-lg border-slate-300/80 bg-white/85 text-slate-700 hover:bg-white dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800" />
            <button type="button" className={styles.ghostIcon}>
              <Settings2 size={16} />
            </button>
            {isMobileViewport ? (
              <button type="button" className={styles.ghostIcon} aria-label="Share">
                <Share2 size={15} />
              </button>
            ) : (
              <button type="button" className={styles.actionBtn}>
                <Share2 size={15} />
                <span>Share</span>
              </button>
            )}
          </div>
        </header>

        <div className={styles.canvasWrap}>
          <ReactFlow
            nodes={rfNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onInit={(instance) => {
              flowRef.current = instance;
              if (!hasAppliedInitialViewport.current) {
                instance.setViewport(viewport, { duration: 0 });
                hasAppliedInitialViewport.current = true;
              }
            }}
            onConnect={handleConnect}
            onReconnect={handleReconnect}
            onNodesChange={handleRfNodesChange}
            onPaneClick={handlePaneClick}
            onNodeClick={handleNodeClick}
            onNodeDragStart={handleNodeDragStart}
            onNodeDragStop={handleNodeDragStop}
            onMoveEnd={(_, nextViewport: Viewport) => {
              const next = {
                x: nextViewport.x,
                y: nextViewport.y,
                zoom: nextViewport.zoom,
              };
              setViewport((prev) => (isViewportEqual(prev, next) ? prev : next));
            }}
            fitView={false}
            minZoom={ZOOM_MIN}
            maxZoom={ZOOM_MAX}
            defaultEdgeOptions={{
              style: { stroke: "var(--oc-connector)", strokeWidth: 1.35 },
              type: "smoothstep",
            }}
            panActivationKeyCode="Space"
            panOnDrag={toolMode === "pan" && !isCanvasInteractionBlocked}
            autoPanOnNodeDrag
            nodesDraggable={toolMode !== "pan" && !isCanvasInteractionBlocked}
            elementsSelectable={toolMode !== "pan" && !isCanvasInteractionBlocked}
            elevateNodesOnSelect
            selectionOnDrag={toolMode === "select" && !isCanvasInteractionBlocked}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode={["Shift"]}
            deleteKeyCode={null}
            className={styles.reactFlow}
          >
            <Background gap={24} size={1.2} color="var(--oc-grid-dot)" />
          </ReactFlow>
          {isCanvasInteractionBlocked ? <div className={styles.mobileCanvasBlocker} aria-hidden="true" /> : null}

          <div className={styles.zoomHud}>
            <button type="button" onClick={() => nudgeZoom(-1)} aria-label="Zoom out">
              -
            </button>
            <span>{zoomPercent}%</span>
            <button type="button" onClick={() => nudgeZoom(1)} aria-label="Zoom in">
              +
            </button>
            <button className="text-sm py-0.5 px-1" type="button" onClick={resetViewport} aria-label="Reset zoom">
              100%
            </button>
            <button type="button" onClick={fitCanvas} aria-label="Fit view">
              Fit
            </button>
          </div>

          <div className={styles.dock}>
            {TOOLBAR_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.dockItem} ${toolMode === item.key ? styles.dockItemActive : ""}`}
                onClick={() => {
                  if (item.key === "image") {
                    fileInputRef.current?.click();
                    return;
                  }
                  setToolMode(item.key);
                }}
                title={`${item.label} (${item.shortcut})`}
              >
                <item.icon size={16} />
                <span>{item.shortcut}</span>
              </button>
            ))}
            <button type="button" className={styles.dockItem} onClick={handleUndo} title="Undo (Ctrl/Cmd+Z)">
              <Undo2 size={16} />
            </button>
            <button type="button" className={styles.dockItem} onClick={handleRedo} title="Redo (Ctrl/Cmd+Y)">
              <Redo2 size={16} />
            </button>
          </div>

          <div ref={shortcutHelpRef} className={styles.shortcutHelpFloating}>
            {isShortcutHelpOpen ? (
              <div className={styles.shortcutHelpPopover}>
                <p className={styles.shortcutHelpTitle}>Shortcuts</p>
                <ul className={styles.shortcutHelpList}>
                  {SHORTCUT_TIPS.map((tip) => (
                    <li key={tip.keys}>
                      <kbd>{tip.keys}</kbd>
                      <span>{tip.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button
              type="button"
              className={styles.shortcutHelpBadge}
              onClick={() => setIsShortcutHelpOpen((prev) => !prev)}
              aria-label="Toggle shortcut tips"
              aria-expanded={isShortcutHelpOpen}
            >
              <Keyboard size={15} />
              <span>Shortcuts</span>
            </button>
          </div>
        </div>
      </section>

      <aside
        className={`${styles.inspector} ${isMobileViewport ? styles.inspectorSheet : ""} ${isMobileViewport && isInspectorSheetOpen ? styles.inspectorSheetOpen : ""}`}
        onFocusCapture={() => {
          inspectorEditingRef.current = true;
          setActiveInlineEdit(null);
        }}
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget as globalThis.Node | null;
          if (nextTarget && event.currentTarget.contains(nextTarget)) return;
          inspectorEditingRef.current = false;
          flushEditorDraft();
        }}
      >
        {isMobileViewport ? (
          <button type="button" className={styles.sheetHandle} onClick={() => setIsInspectorSheetOpen((prev) => !prev)}>
            <span className={styles.sheetHandleGrabber} />
            <span>{isInspectorSheetOpen ? "Close Panel" : "Open Panel"}</span>
          </button>
        ) : null}
        <div className={styles.statusCard}>
          <p className={styles.statusTitle}>Auto Save</p>
          <p className={styles.statusValue}>{saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : saveState === "error" ? "Error" : "Idle"}</p>
          <p className={styles.statusHint}>{saveMessage}</p>
          {isHydrationFromFallback ? <p className={styles.warning}>Server fetch failed. Running from local cache/seed.</p> : null}
        </div>

        {(!isMobileViewport || isInspectorSheetOpen) ? (
          <>
            <div className={styles.actionsCard}>
              <p className={styles.editorTitle}>Actions</p>
              <div className={styles.inlineActions}>
                <button type="button" className={styles.softBtn} onClick={() => addNode("role")}>
                  <Plus size={14} />
                  Add Role
                </button>
                <button type="button" className={styles.softBtn} onClick={quickAddSampleNode}>
                  <ArrowRightLeft size={14} />
                  Quick Add Sample
                </button>
              </div>
            </div>

            <div className={styles.editorCard}>
          <p className={styles.editorTitle}>Selection</p>
          {selectedNodes.length === 0 ? (
            <p className={styles.emptyState}>Select any node to edit details, parent line, or delete.</p>
          ) : selectedNodes.length === 1 && inspectorNode ? (
            <div className={styles.formStack}>
              <label className={styles.fieldLabel}>
                Name
                <input
                  value={selectedDraft?.name ?? ""}
                  onChange={(event) => updateEditorDraftField(inspectorNode.id, "name", event.target.value)}
                  onBlur={flushEditorDraft}
                  placeholder={ROLE_NAME_PLACEHOLDER}
                />
              </label>
              <label className={styles.fieldLabel}>
                Position
                <input
                  value={selectedDraft?.position ?? ""}
                  onChange={(event) => updateEditorDraftField(inspectorNode.id, "position", event.target.value)}
                  onBlur={flushEditorDraft}
                  placeholder={ROLE_POSITION_PLACEHOLDER}
                />
              </label>
              <label className={styles.fieldLabel}>
                Description
                <textarea
                  rows={4}
                  value={selectedDraft?.note ?? ""}
                  onChange={(event) => updateEditorDraftField(inspectorNode.id, "note", event.target.value)}
                  onBlur={flushEditorDraft}
                  placeholder={ROLE_DESCRIPTION_PLACEHOLDER}
                />
              </label>
              <label className={styles.fieldLabel}>
                Reports To
                <select
                  value={inspectorNode.parentId ?? "none"}
                  onChange={(event) => {
                    pushUndo();
                    handleSetParent(inspectorNode.id, event.target.value === "none" ? null : event.target.value);
                  }}
                >
                  <option value="none">Top-level</option>
                  {inspectorNodeParentOptions
                    .filter((node) => node.id !== inspectorNode.id && (node.kind ?? "role") === "role")
                    .map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.position}
                      </option>
                    ))}
                </select>
              </label>
              <div className={styles.inlineActions}>
                <button type="button" onClick={() => deleteSelected()} className={styles.dangerBtn}>
                  <Trash2 size={14} />
                  Delete Selected
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pushUndo();
                    const nextSeed = getOrgChartSeedPayload();
                    replaceState(nextSeed.nodes, nextSeed.viewport);
                    toast.success("Org chart reset.");
                  }}
                  className={styles.softBtn}
                >
                  Reset Seed
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.formStack}>
              <p className={styles.multiSummary}>{selectedNodes.length} cards selected</p>
              <div className={styles.inlineActions}>
                <button type="button" onClick={() => deleteSelected()} className={styles.dangerBtn}>
                  <Trash2 size={14} />
                  Delete Selected
                </button>
                <button type="button" onClick={clearSelection} className={styles.softBtn}>
                  Clear Selection
                </button>
              </div>
              <div className={styles.multiInspectorList}>
                {selectedNodes.map((node) => {
                  const isOpen = activeInspectorNodeId === node.id;
                  const displayName = isLegacyPlaceholderName(node.name) || !node.name.trim() ? ROLE_NAME_PLACEHOLDER : node.name.trim();
                  const displayPosition = node.position.trim() || ROLE_POSITION_PLACEHOLDER;
                  return (
                    <div key={node.id} className={styles.multiInspectorItem}>
                      <button type="button" className={`${styles.multiInspectorToggle} ${isOpen ? styles.multiInspectorToggleActive : ""}`} onClick={() => setActiveInspectorNodeId(node.id)}>
                        <span>{displayPosition}</span>
                        <small>{displayName}</small>
                      </button>
                      {isOpen && inspectorNode?.id === node.id ? (
                        <div className={styles.multiInspectorEditor}>
                          <label className={styles.fieldLabel}>
                            Name
                            <input
                              value={selectedDraft?.name ?? ""}
                              onChange={(event) => updateEditorDraftField(node.id, "name", event.target.value)}
                              onBlur={flushEditorDraft}
                              placeholder={ROLE_NAME_PLACEHOLDER}
                            />
                          </label>
                          <label className={styles.fieldLabel}>
                            Position
                            <input
                              value={selectedDraft?.position ?? ""}
                              onChange={(event) => updateEditorDraftField(node.id, "position", event.target.value)}
                              onBlur={flushEditorDraft}
                              placeholder={ROLE_POSITION_PLACEHOLDER}
                            />
                          </label>
                          <label className={styles.fieldLabel}>
                            Description
                            <textarea
                              rows={3}
                              value={selectedDraft?.note ?? ""}
                              onChange={(event) => updateEditorDraftField(node.id, "note", event.target.value)}
                              onBlur={flushEditorDraft}
                              placeholder={ROLE_DESCRIPTION_PLACEHOLDER}
                            />
                          </label>
                          <label className={styles.fieldLabel}>
                            Reports To
                            <select
                              value={node.parentId ?? "none"}
                              onChange={(event) => {
                                pushUndo();
                                handleSetParent(node.id, event.target.value === "none" ? null : event.target.value);
                              }}
                            >
                              <option value="none">Top-level</option>
                              {inspectorNodeParentOptions
                                .filter((candidate) => candidate.id !== node.id && (candidate.kind ?? "role") === "role")
                                .map((candidate) => (
                                  <option key={candidate.id} value={candidate.id}>
                                    {candidate.position}
                                  </option>
                                ))}
                            </select>
                          </label>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
            </div>
          </>
        ) : null}

      </aside>

      <input ref={fileInputRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handleImageUpload} />
    </div>
  );
}

export function OrgChartWorkspace() {
  return (
    <ReactFlowProvider>
      <OrgChartCanvas />
    </ReactFlowProvider>
  );
}
