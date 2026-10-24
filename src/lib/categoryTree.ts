// src/lib/categoryTree.ts
export interface CatRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image?: string | null;
}

export interface CatNode extends CatRow {
  children: CatNode[];
  depth: number;
}

export function buildForest(rows: CatRow[]) {
  const byId = new Map<string, CatNode>();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [], depth: 1 }));
  const roots: CatNode[] = [];
  byId.forEach((n) => {
    const parent = n.parent_id ? byId.get(n.parent_id) : undefined;
    if (parent) parent.children.push(n);
    else roots.push(n);
  });
  const setDepth = (n: CatNode, d: number) => {
    n.depth = d;
    n.children.forEach((c) => setDepth(c, d + 1));
  };
  roots.forEach((r) => setDepth(r, 1));
  return { byId, roots };
}

export function subtreeIds(node: CatNode): string[] {
  const out: string[] = [];
  const walk = (n: CatNode) => {
    out.push(n.id);
    n.children.forEach(walk);
  };
  walk(node);
  return out;
}

export function findBySlug(node: CatNode, slug: string): CatNode | undefined {
  for (const c of node.children) {
    if (c.slug === slug) return c;
    const f = findBySlug(c, slug);
    if (f) return f;
  }
  return undefined;
}

export function pathOf(byId: Map<string, CatNode>, id: string): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  let cur = byId.get(id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    parts.unshift(cur.name);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return parts.join(" › ");
}

// مسیر کامل از ریشه تا گره (شامل خود گره)
export function ancestorChain(byId: Map<string, CatNode>, id: string): CatNode[] {
  const chain: CatNode[] = [];
  const seen = new Set<string>();
  let cur = byId.get(id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift(cur);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return chain;
}