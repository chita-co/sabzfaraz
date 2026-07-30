"use client";

import { useState } from "react";
import { createUserByAdmin } from "@/app/admin/users/actions";

export default function CreateUserForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createUserByAdmin(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 480 }}>
      <h1 className="text-xl font-bold text-gray-900 mb-6">افزودن کاربر جدید</h1>

      <div className="admin-form-group">
        <label>نام و نام خانوادگی</label>
        <input type="text" name="fullName" required />
      </div>
      <div className="admin-form-group">
        <label>شماره موبایل</label>
        <input type="tel" name="phone" dir="ltr" maxLength={11} required />
      </div>
      <div className="admin-form-group">
        <label>ایمیل (اختیاری)</label>
        <input type="email" name="email" dir="ltr" />
      </div>
      <div className="admin-form-group">
        <label>رمز عبور</label>
        <input type="password" name="password" required minLength={6} />
      </div>
      <div className="admin-form-group">
        <label>نقش</label>
        <select name="role" defaultValue="USER">
          <option value="USER">کاربر عادی</option>
          <option value="ADMIN">مدیر</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button type="submit" disabled={loading} className="admin-btn admin-btn-primary w-full">
        {loading ? "در حال ساخت..." : "افزودن کاربر"}
      </button>
    </form>
  );
}