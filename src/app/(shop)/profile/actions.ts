"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;

  const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
  if (error) return { error: "خطا در ذخیره اطلاعات: " + error.message };

  revalidatePath("/profile");
  return { success: true };
}

export async function addAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    full_name: formData.get("fullName") as string,
    phone: formData.get("phone") as string,
    province: formData.get("province") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postalCode") as string,
    address_line: formData.get("addressLine") as string,
  });

  if (error) return { error: "خطا در ثبت آدرس: " + error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function updateAddress(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("addresses")
    .update({
      full_name: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      province: formData.get("province") as string,
      city: formData.get("city") as string,
      postal_code: formData.get("postalCode") as string,
      address_line: formData.get("addressLine") as string,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "خطا در ویرایش آدرس: " + error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteAddress(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) return { error: "خطا در حذف آدرس: " + error.message };
  revalidatePath("/profile");
  return { success: true };
}