"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Pencil, Package, X } from "lucide-react";
import { updateProfile, addAddress, updateAddress, deleteAddress } from "@/app/(shop)/profile/actions";
import ProvinceCitySelect from "@/components/shared/ProvinceCitySelect";
import Breadcrumb from "@/components/shop/Breadcrumb"; // ← اضافه شد
import UserBadgesShowcase from "@/components/blog/UserBadgesShowcase";

interface AddressRow {
  id: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  postal_code: string;
  address_line: string;
}

export default function ProfileClient({
  email,
  fullName,
  phone,
  addresses,
  badges,
  earnedBadgeIds,
}: {
  email: string;
  fullName: string | null;
  phone: string | null;
  addresses: AddressRow[];
  badges: { id: string; code: string; title: string; description: string | null; icon: string; requirement_value: number }[];
  earnedBadgeIds: string[];
}) {
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressRow | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [formProvince, setFormProvince] = useState("");
  const [formCity, setFormCity] = useState("");

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    setProfileSaving(false);
    setProfileMsg(result?.error ?? "اطلاعات با موفقیت ذخیره شد.");
  }

  function openAddForm() {
    setEditingAddress(null);
    setFormProvince("");
    setFormCity("");
    setAddressError(null);
    setShowAddressForm(true);
  }

  function openEditForm(addr: AddressRow) {
    setEditingAddress(addr);
    setFormProvince(addr.province);
    setFormCity(addr.city);
    setAddressError(null);
    setShowAddressForm(true);
  }

  async function handleAddressSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddressSaving(true);
    setAddressError(null);
    const formData = new FormData(e.currentTarget);

    const result = editingAddress
      ? await updateAddress(editingAddress.id, formData)
      : await addAddress(formData);

    setAddressSaving(false);
    if (result?.error) {
      setAddressError(result.error);
    } else {
      setShowAddressForm(false);
      setEditingAddress(null);
      setFormProvince("");
      setFormCity("");
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm("آیا از حذف این آدرس مطمئن هستید؟")) return;
    await deleteAddress(id);
  }

    const displayEmail = email.endsWith("@sabzfaraz-users.ir") ? "—" : email;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      {/* Breadcrumb یکپارچه شده */}
      <Breadcrumb theme="light" items={[{ label: "پروفایل من" }]} />

      <h1 className="text-xl font-bold text-gray-900">پروفایل من</h1>

      <Link href="/profile/orders" className="profile-orders-banner">
        <div className="profile-orders-icon">
          <Package size={22} />
        </div>
        <div>
          <p className="profile-orders-title">سفارشات من</p>
          <p className="profile-orders-subtitle">مشاهده تاریخچه سفارش‌ها و پیگیری مرسوله</p>
        </div>
      </Link>
            <UserBadgesShowcase badges={badges} earnedIds={earnedBadgeIds} />

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-4">اطلاعات حساب</h2>
        <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">ایمیل</label>
            <input
              type="email"
              value={displayEmail}
              disabled
              dir="ltr"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">نام و نام خانوادگی</label>
            <input
              type="text"
              name="fullName"
              defaultValue={fullName ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">شماره تلفن</label>
            <input
              type="tel"
              name="phone"
              dir="ltr"
              defaultValue={phone ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">آدرس‌های من</h2>
          <button onClick={openAddForm} className="flex items-center gap-1 text-sm text-green-600 hover:underline">
            <Plus size={15} /> افزودن آدرس جدید
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between rounded-lg border border-gray-200 p-3 text-sm">
              <div>
                <p className="font-medium text-gray-800">{a.full_name} — {a.phone}</p>
                <p className="text-gray-600">{a.province}، {a.city}</p>
                <p className="text-gray-600">{a.address_line}</p>
                <p className="text-gray-500 text-xs mt-1">کد پستی: {a.postal_code}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditForm(a)}>
                  <Pencil size={16} className="text-gray-500" />
                </button>
                <button onClick={() => handleDeleteAddress(a.id)}>
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && <p className="text-sm text-gray-500">هنوز آدرسی ثبت نکرده‌اید.</p>}
        </div>

        {showAddressForm && (
          <form onSubmit={handleAddressSubmit} className="grid sm:grid-cols-2 gap-3 border-t pt-4">
            <div className="sm:col-span-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">
                {editingAddress ? "ویرایش آدرس" : "آدرس جدید"}
              </h3>
              <button type="button" onClick={() => setShowAddressForm(false)} className="text-gray-400">
                <X size={16} />
              </button>
            </div>

            <input
              name="fullName"
              placeholder="نام گیرنده"
              defaultValue={editingAddress?.full_name}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              name="phone"
              placeholder="تلفن گیرنده"
              dir="ltr"
              defaultValue={editingAddress?.phone}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <div className="sm:col-span-2">
              <ProvinceCitySelect
                province={formProvince}
                city={formCity}
                onProvinceChange={setFormProvince}
                onCityChange={setFormCity}
              />
            </div>

            <input
              name="postalCode"
              placeholder="کد پستی"
              dir="ltr"
              defaultValue={editingAddress?.postal_code}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              name="addressLine"
              placeholder="آدرس کامل"
              defaultValue={editingAddress?.address_line}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
            />

            {addressError && <p className="text-red-600 text-sm sm:col-span-2">{addressError}</p>}

            <button
              type="submit"
              disabled={addressSaving}
              className="sm:col-span-2 rounded-lg bg-green-600 px-5 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              {addressSaving ? "در حال ذخیره..." : editingAddress ? "ذخیره ویرایش آدرس" : "ذخیره آدرس"}
            </button>
          </form>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
        <button
          type="submit"
          form="profile-form"
          disabled={profileSaving}
          className="rounded-full bg-green-600 px-10 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {profileSaving ? "در حال ذخیره..." : "ذخیره تغییرات پروفایل"}
        </button>
      </div>
    </div>
  );
}