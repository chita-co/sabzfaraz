"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Search, ShoppingBag, PackageSearch } from "lucide-react";
import DescriptionModal from "./DescriptionModal";
import { BULK_ORDER_GUIDE_TITLE, BULK_ORDER_GUIDE_TEXT } from "@/lib/bulkOrderGuide";
import { searchStoreProducts, submitBulkOrderRequest, type StoreItemInput, type MarketItemInput } from "@/app/(shop)/bulk-order/actions";

interface StoreRow extends StoreItemInput { id: string; }
interface MarketRow extends MarketItemInput { id: string; }
interface SearchResult { id: string; name: string; unitPrice: number; }
interface AddressRow { id: string; full_name: string; phone: string; province: string; city: string; address_line: string; }

export default function BulkOrderForm({ addresses }: { addresses: AddressRow[] }) {
  const [storeItems, setStoreItems] = useState<StoreRow[]>([]);
  const [marketItems, setMarketItems] = useState<MarketRow[]>([{ id: crypto.randomUUID(), name: "", quantity: 1, minPrice: null, maxPrice: null }]);
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null);
  const [addQty, setAddQty] = useState("1");
  const latestQueryRef = useRef(searchQuery);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // به‌روزرسانی ref با آخرین مقدار searchQuery در هر رندر
  useEffect(() => {
    latestQueryRef.current = searchQuery;
  });

  // اثر جستجوی debounced با استفاده از setTimeout که setState را فقط در callback انجام می‌دهد
  useEffect(() => {
    const handler = setTimeout(() => {
      const query = latestQueryRef.current;
      if (!query.trim()) {
        setSearchResults([]);
      } else {
        searchStoreProducts(query).then((results) => setSearchResults(results));
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

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
    if (!addressId) { setError("لطفاً یک آدرس تحویل انتخاب کنید."); return; }
    setSubmitting(true);
    const result = await submitBulkOrderRequest(
      storeItems.map(({ productId, productName, quantity, unitPrice }) => ({ productId, productName, quantity, unitPrice })),
      marketItems.map(({ name, quantity, minPrice, maxPrice }) => ({ name, quantity, minPrice, maxPrice })),
      addressId
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

  if (addresses.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-gray-300 mb-4">برای ثبت سفارش جمعی، ابتدا باید یک آدرس در پروفایل خود ثبت کنید.</p>
        <a href="/profile" className="rounded-full bg-green-600 px-6 py-2 text-sm text-white hover:bg-green-700">افزودن آدرس</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <ShoppingBag size={22} className="text-green-400" />
          <h1 className="text-xl font-bold text-white">سفارش جمعی از بازار الکترونیک</h1>
        </div>
        <DescriptionModal title={BULK_ORDER_GUIDE_TITLE} description={BULK_ORDER_GUIDE_TEXT} />
      </div>
      <p className="text-gray-300 text-sm mb-8">
        هر کالای الکترونیکی که نیاز دارید — چه در فروشگاه ما موجود باشد و چه فقط در بازار پیدا شود — در یک لیست واحد ثبت کنید تا کارشناسان ما امکان تأمین را بررسی کنند.
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">افزودن کالاهای موجود در سایت (اختیاری)</h2>
        <div className="relative mb-3">
          <div className="bulk-search-box">
            <Search size={15} />
            <input type="text" placeholder="نام محصول را جستجو کنید..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedProduct(null); }} />
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
          <div className="bulk-item-list">
            {storeItems.map((it) => (
              <div key={it.id} className="bulk-item-row">
                <div className="bulk-item-name">{it.productName}</div>
                <div className="bulk-item-field">
                  <span>تعداد</span>
                  <b>{it.quantity.toLocaleString("fa-IR")}</b>
                </div>
                <div className="bulk-item-field">
                  <span>قیمت واحد</span>
                  <b>{it.unitPrice.toLocaleString("fa-IR")} تومان</b>
                </div>
                <div className="bulk-item-field">
                  <span>جمع</span>
                  <b>{(it.quantity * it.unitPrice).toLocaleString("fa-IR")} تومان</b>
                </div>
                <button onClick={() => removeStoreItem(it.id)} className="admin-btn admin-btn-danger" type="button">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">آدرس تحویل</h2>
        <div className="space-y-2">
          {addresses.map((a) => (
            <label key={a.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${addressId === a.id ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" />
              <div className="text-sm">
                <p className="font-medium text-gray-800">{a.full_name} — {a.phone}</p>
                <p className="text-gray-600">{a.province}، {a.city}، {a.address_line}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full bg-green-600 py-3.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
        {submitting ? "در حال ثبت..." : "بررسی امکان تأمین از بازار"}
      </button>
    </div>
  );
}