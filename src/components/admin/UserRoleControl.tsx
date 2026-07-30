// src/components/admin/UserRoleControl.tsx
"use client";

import { useState } from "react";
import { updateUserRole } from "@/app/admin/users/actions";

export default function UserRoleControl({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  async function handleChange(newRole: "USER" | "ADMIN") {
    setRole(newRole);
    setSaving(true);
    const result = await updateUserRole(userId, newRole);
    setSaving(false);
    if (result?.error) {
      alert(result.error);
      setRole(currentRole);
    }
  }

  return (
    <div className="admin-form-group">
      <label>نقش کاربر</label>
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value as "USER" | "ADMIN")}
        disabled={saving}
      >
        <option value="USER">کاربر عادی</option>
        <option value="ADMIN">مدیر</option>
      </select>
    </div>
  );
}