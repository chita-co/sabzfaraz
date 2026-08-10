"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Trash2, Search, ShoppingBag, PackageSearch } from "lucide-react";
import { searchStoreProducts, submitBulkOrderRequest, type StoreItemInput, type MarketItemInput } from "@/app/bulk-order/actions";

interface StoreRow extends StoreItemInput { id: string; }
interface MarketRow extends MarketItemInput { id: string; }
interface SearchResult { id: string; name: string; unitPrice: number; }

export default function BulkOrderForm() {
  const [storeItems, setStoreItems] = useState<StoreRow[]>([]);
  const [marketItems, setMarketItems] = useState<MarketRow[]>([{ id: crypto.randomUUID(), name: "", quantity: 1, minPrice: null, maxPrice: null }]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null);
  const [addQty, setAddQty] = useState("1");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const performSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchStoreProducts(query);
      setSearchResults(results);
    }, 350);
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedProduct(null);
    performSearch(val);
  };

  function handleAddStoreItem() {
    if (!selectedProduct) return;
    const qty = Number(addQty) || 1;
    setStoreItems((prev) => [...prev, { id: crypto.randomUUID(), productId: selectedProduct.id, productName: selectedProduct.name, quantity: qty, unitPrice: selectedProduct.unitPrice }]);
    setSelectedProduct(null);
    setSearchQuery("");
    setSearchResults([]);
    setAddQty("1");
  }
  function removeStoreItem(id: string) { setStoreItems((prev) => prev.filter((r) => r.id !== id)); }

  function addMarketRow() { setMarketItems((prev) => [...prev, { id: crypto.randomUUID(), name: "", quantity: 1, minPrice: null, maxPrice: null }]); }
  function removeMarketRow(id: string) { setMarketItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev)); }
  function updateMarketRow(id: string, field: keyof MarketItemInput, value: string | number | null) {
    setMarketItems((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    const result = await submitBulkOrderRequest(
      storeItems.map(({ productId, productName, quantity, unitPrice }) => ({ productId, productName, quantity, unitPrice })),
      marketItems.map(({ name, quantity, minPrice, maxPrice }) => ({ name, quantity, minPrice, maxPrice }))
    );
    if (result?.error) { setError(result.error); setSubmitting(false); }
    else setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-white text-lg font-bold mb-3">درخواست شما ثبت شد.</p>
        <p className="text-gray-300 text-sm">کارشناسان ما امکان تأمین کالاها را بررسی کرده و از طریق پیام‌رسان داخلی با شما ارتباط خواهند گرفت.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-2 mb-2">
        <ShoppingBag size={22} className="text-green-400" />
        <h1 className="text-xl font-bold text-white">سفارش جمعی از بازار الکترونیک</h1>
      </div>
      <p className="text-gray-300 text-sm mb-8">
        ترکیبی از کالاهای موجود در فروشگاه و کالاهایی که در سایت نیست رو انتخاب کن — کارشناسان ما امکان تأمین رو بررسی می‌کنن.
      </p>

      {/* بخش الف */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">افزودن کالاهای موجود در سایت (اختیاری)</h2>
        <div className="relative mb-3">
          <div className="bulk-search-box">
            <Search size={15} />
            <input type="text" placeholder="نام محصول را جستجو کنید..." value={searchQuery} onChange={handleSearchInputChange} />
          </div>
          {searchResults.length > 0 && !selectedProduct && (
            <div className="bulk-search-results">
              {searchResults.map((r) => (
                <button key={r.id} type="button" className="bulk-search-result-item" onClick={() => { setSelectedProduct(r); setSearchQuery(r.name); setSearchResults([]); }}>
                  <span>{r.name}</span>
                  <span className="text-green-600 font-bold">{r.unitPrice.toLocaleString("fa-IR")} تومان</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 mb-4">
          <input type="number" min={1} value={addQty} onChange={(e) => setAddQty(e.target.value)} className="admin-input" style={{ width: 100 }} placeholder="تعداد" />
          <button type="button" onClick={handleAddStoreItem} disabled={!selectedProduct} className="admin-btn admin-btn-primary flex items-center gap-1 disabled:opacity-40">
            <Plus size={14} /> افزودن کالا
          </button>
        </div>

        {storeItems.length > 0 && (
          <table className="admin-table">
            <thead><tr><th>نام کالا</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th><th></th></tr></thead>
            <tbody>
              {storeItems.map((it) => (
                <tr key={it.id}>
                  <td>{it.productName}</td>
                  <td>{it.quantity.toLocaleString("fa-IR")}</td>
                  <td>{it.unitPrice.toLocaleString("fa-IR")}</td>
                  <td>{(it.quantity * it.unitPrice).toLocaleString("fa-IR")}</td>
                  <td><button onClick={() => removeStoreItem(it.id)} className="admin-btn admin-btn-danger" type="button"><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* بخش ب */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <PackageSearch size={18} className="text-amber-500" />
          <h2 className="font-bold text-gray-800">درخواست تهیه کالا از بازار (موجود نیست در سایت)</h2>
        </div>
        <div className="space-y-3">
          {marketItems.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start border-b border-gray-100 pb-3">
              <input type="text" placeholder="نام کالا *" value={item.name} onChange={(e) => updateMarketRow(item.id, "name", e.target.value)} className="col-span-4 admin-input" />
              <input type="number" placeholder="تعداد *" min={1} value={item.quantity} onChange={(e) => updateMarketRow(item.id, "quantity", Number(e.target.value))} className="col-span-2 admin-input" />
              <input type="number" placeholder="از قیمت (اختیاری)" value={item.minPrice ?? ""} onChange={(e) => updateMarketRow(item.id, "minPrice", e.target.value ? Number(e.target.value) : null)} className="col-span-2 admin-input" />
              <input type="number" placeholder="تا قیمت (اختیاری)" value={item.maxPrice ?? ""} onChange={(e) => updateMarketRow(item.id, "maxPrice", e.target.value ? Number(e.target.value) : null)} className="col-span-3 admin-input" />
              <button onClick={() => removeMarketRow(item.id)} className="col-span-1 admin-btn admin-btn-danger" type="button"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <button onClick={addMarketRow} type="button" className="admin-btn admin-btn-secondary mt-3 flex items-center gap-1">
          <Plus size={14} /> افزودن کالای جدید
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full bg-green-600 py-3.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
        {submitting ? "در حال ثبت..." : "بررسی امکان تأمین از بازار"}
      </button>
    </div>
  );
}