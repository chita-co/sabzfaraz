"use client";
import { useState, useMemo, useTransition } from "react";
import toast from "react-hot-toast";
import { ChevronDown, ChevronLeft, Plus, Pencil, Trash2, FolderTree, Search, X, ArrowRightLeft } from "lucide-react";
import {
  createCategoryAction, renameCategoryAction, deleteCategoryAction, reparentCategoryAction,
  getPostsInCategoryAction, removePostFromCategoryAction, assignPostToCategoryAction, searchPostsForCategoryAction,
} from "@/app/admin/blog/actions";
import { buildCategoryTree, type CategoryTreeNode } from "@/lib/blog/categoryTree";

interface CategoryRow { id: string; name: string; slug: string; parent_id: string | null; post_count: number; }
interface PostLite { id: string; title: string; status: string; }

function nodeMatches(node: CategoryTreeNode, query: string): boolean {
  if (node.name.toLowerCase().includes(query)) return true;
  return node.children.some((c) => nodeMatches(c, query));
}

export default function CategoryManagerClient({ categories }: { categories: CategoryRow[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addingUnder, setAddingUnder] = useState<string | null | "root">(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activePosts, setActivePosts] = useState<PostLite[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postSearch, setPostSearch] = useState("");
  const [postSearchResults, setPostSearchResults] = useState<PostLite[]>([]);
   const [, startTransition] = useTransition();

  const tree = useMemo(() => buildCategoryTree(categories as unknown as CategoryTreeNode[]), [categories]);
  const q = search.trim().toLowerCase();
  const filteredTree = q ? tree.filter((n) => nodeMatches(n, q)) : tree;

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function submitNewCategory(parentId: string | null) {
    if (!newCategoryName.trim()) return;
    startTransition(async () => {
      const res = await createCategoryAction(newCategoryName, parentId);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      toast.success("دسته ساخته شد");
      setNewCategoryName("");
      setAddingUnder(null);
    });
  }

  function saveRename(id: string) {
    if (!renameValue.trim()) return;
    startTransition(async () => {
      const res = await renameCategoryAction(id, renameValue);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      toast.success("نام تغییر کرد");
      setRenamingId(null);
    });
  }

  function handleDelete(id: string, hasChildren: boolean) {
    const msg = hasChildren
      ? "این دسته زیردسته دارد؛ با حذف آن، زیردسته‌ها به سطح اصلی منتقل می‌شوند. ادامه می‌دهید؟"
      : "این دسته حذف شود؟ (مقالات داخلش حذف نمی‌شوند، فقط از این دسته خارج می‌شوند)";
    if (!confirm(msg)) return;
    startTransition(async () => {
      const res = await deleteCategoryAction(id);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      toast.success("دسته حذف شد");
      if (activeCategoryId === id) setActiveCategoryId(null);
    });
  }

  function handleReparent(id: string, newParentId: string) {
    startTransition(async () => {
      const res = await reparentCategoryAction(id, newParentId || null);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      toast.success("دسته جابه‌جا شد");
    });
  }

  function openCategoryPosts(id: string) {
    setActiveCategoryId(id);
    setLoadingPosts(true);
    getPostsInCategoryAction(id).then((posts) => { setActivePosts(posts as PostLite[]); setLoadingPosts(false); });
  }

  function removeFromCategory(postId: string) {
    if (!activeCategoryId) return;
    startTransition(async () => {
      const res = await removePostFromCategoryAction(postId, activeCategoryId);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      setActivePosts((prev) => prev.filter((p) => p.id !== postId));
    });
  }

  async function handlePostSearch(val: string) {
    setPostSearch(val);
    if (val.trim().length < 2) { setPostSearchResults([]); return; }
    setPostSearchResults(await searchPostsForCategoryAction(val));
  }

  function addPostToActiveCategory(post: PostLite) {
    if (!activeCategoryId) return;
    startTransition(async () => {
      const res = await assignPostToCategoryAction(post.id, activeCategoryId);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      setActivePosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [...prev, post]));
      setPostSearch(""); setPostSearchResults([]);
      toast.success("مقاله به این دسته اضافه شد");
    });
  }

  function flatOptions(nodes: CategoryTreeNode[], depth = 0, excludeId?: string): { id: string; label: string }[] {
    let out: { id: string; label: string }[] = [];
    for (const n of nodes) {
      if (n.id !== excludeId) out.push({ id: n.id, label: `${"— ".repeat(depth)}${n.name}` });
      out = out.concat(flatOptions(n.children, depth + 1, excludeId));
    }
    return out;
  }

  function renderNode(node: CategoryTreeNode, depth: number) {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id) || !!q;
    return (
      <div key={node.id}>
        <div className="blog-cat-tree-row" style={{ paddingRight: depth * 22 }}>
          {hasChildren ? (
            <button className="blog-cat-tree-toggle" onClick={() => toggleExpand(node.id)}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
            </button>
          ) : <span style={{ width: 14, display: "inline-block" }} />}

          {renamingId === node.id ? (
            <input className="admin-input" style={{ fontSize: 12, padding: "4px 8px", width: 160 }} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
          ) : (
            <button className="blog-cat-tree-name" onClick={() => openCategoryPosts(node.id)}>
              {node.name} <span className="blog-cat-tree-count">{(node.post_count ?? 0).toLocaleString("fa-IR")}</span>
            </button>
          )}

          <div className="blog-cat-tree-actions">
            {renamingId === node.id ? (
              <>
                <button className="admin-btn admin-btn-primary" style={{ padding: "3px 10px", fontSize: 11 }} onClick={() => saveRename(node.id)}>ذخیره</button>
                <button className="admin-btn" style={{ padding: "3px 10px", fontSize: 11 }} onClick={() => setRenamingId(null)}>انصراف</button>
              </>
            ) : (
              <>
                <select
                  className="admin-input blog-cat-tree-move"
                  value={node.parent_id ?? ""}
                  onChange={(e) => handleReparent(node.id, e.target.value)}
                  title="جابه‌جایی زیر دسته دیگر"
                >
                  <option value="">سطح اصلی</option>
                  {flatOptions(tree, 0, node.id).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <button title="افزودن زیردسته" onClick={() => setAddingUnder(node.id)}><Plus size={13} /></button>
                <button title="تغییر نام" onClick={() => { setRenamingId(node.id); setRenameValue(node.name); }}><Pencil size={13} /></button>
                <button title="حذف" onClick={() => handleDelete(node.id, hasChildren)}><Trash2 size={13} color="#dc2626" /></button>
              </>
            )}
          </div>
        </div>

        {addingUnder === node.id && (
          <div className="blog-cat-tree-add-form" style={{ paddingRight: (depth + 1) * 22 }}>
            <input className="admin-input" style={{ fontSize: 12, padding: "4px 8px" }} placeholder="نام زیردسته" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} autoFocus />
            <button className="admin-btn admin-btn-primary" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => submitNewCategory(node.id)}>افزودن</button>
            <button className="admin-btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => { setAddingUnder(null); setNewCategoryName(""); }}>انصراف</button>
          </div>
        )}

        {isExpanded && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><FolderTree size={16} /> ساختار درختی دسته‌بندی‌ها</h3>
          <button className="admin-btn admin-btn-primary" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }} onClick={() => setAddingUnder("root")}>
            <Plus size={13} /> دسته اصلی جدید
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={14} style={{ position: "absolute", top: 10, right: 10, color: "#9ca3af" }} />
          <input className="admin-input" style={{ paddingRight: 32 }} placeholder="جستجو در دسته‌بندی‌ها..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {addingUnder === "root" && (
          <div className="blog-cat-tree-add-form" style={{ marginBottom: 10 }}>
            <input className="admin-input" style={{ fontSize: 12, padding: "4px 8px" }} placeholder="نام دسته اصلی" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} autoFocus />
            <button className="admin-btn admin-btn-primary" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => submitNewCategory(null)}>افزودن</button>
            <button className="admin-btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => { setAddingUnder(null); setNewCategoryName(""); }}>انصراف</button>
          </div>
        )}

        {filteredTree.length === 0 ? (
          <p style={{ fontSize: 12.5, color: "#9ca3af" }}>دسته‌بندی‌ای یافت نشد.</p>
        ) : (
          filteredTree.map((n) => renderNode(n, 0))
        )}
      </div>

      {activeCategoryId && (
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14 }}>مقالات دسته‌ی «{activeCategory?.name}»</h3>
            <button onClick={() => setActiveCategoryId(null)}><X size={16} /></button>
          </div>

          <div style={{ position: "relative", marginBottom: 14 }}>
            <input className="admin-input" placeholder="جستجوی مقاله برای افزودن به این دسته..." value={postSearch} onChange={(e) => handlePostSearch(e.target.value)} />
            {postSearchResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", right: 0, left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginTop: 4, zIndex: 10, maxHeight: 220, overflowY: "auto" }}>
                {postSearchResults.map((p) => (
                  <button key={p.id} onClick={() => addPostToActiveCategory(p)} style={{ display: "flex", justifyContent: "space-between", width: "100%", textAlign: "right", padding: "8px 12px", fontSize: 13, border: "none", background: "transparent", cursor: "pointer" }}>
                    <span>{p.title}</span><Plus size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingPosts ? (
            <p style={{ fontSize: 12.5, color: "#9ca3af" }}>در حال بارگذاری...</p>
          ) : activePosts.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "#9ca3af" }}>هنوز مقاله‌ای در این دسته نیست.</p>
          ) : (
            activePosts.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 13 }}>{p.title}</span>
                <button onClick={() => removeFromCategory(p.id)} title="حذف از این دسته" style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: 4, fontSize: 11.5 }}>
                  <ArrowRightLeft size={13} /> خروج از دسته
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}