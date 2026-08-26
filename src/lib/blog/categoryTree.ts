export interface CategoryLite { id: string; name: string; parent_id: string | null; }

export function buildCategoryTreeLabels(categories: CategoryLite[]): string[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return categories.map((c) => {
    const parent = c.parent_id ? byId.get(c.parent_id) : null;
    return parent ? `${parent.name} > ${c.name}` : c.name;
  });
}

export interface CategoryTreeNode extends CategoryLite {
  slug: string;
  post_count?: number;
  children: CategoryTreeNode[];
}

export function buildCategoryTree<T extends CategoryLite & { slug: string; post_count?: number }>(flat: T[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CategoryTreeNode[] = [];
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) map.get(c.parent_id)!.children.push(node);
    else roots.push(node);
  });
  return roots;
}