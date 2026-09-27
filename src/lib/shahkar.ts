// src/lib/shahkar.ts
// استعلام تطابق مالکیت شماره موبایل و کدملی (سرویس شاهکار — زوهال / zohal.io)

export async function verifyShahkarMatch(
  nationalId: string,
  mobile: string
): Promise<boolean> {
  const apiKey = process.env.ZOHAL_API_KEY;
  if (!apiKey) {
    throw new Error("ZOHAL_API_KEY تنظیم نشده است.");
  }

  const res = await fetch(
    "https://service.zohal.io/api/v0/services/inquiry/shahkar",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile,
        national_code: nationalId,
      }),
    }
  );

  if (!res.ok) {
    throw new Error("خطا در ارتباط با سرویس استعلام شاهکار.");
  }

   const data = await res.json();

  if (data?.result !== 1) {
    // شامل حالت "400 Invalid National Code" و هر خطای دیگر
    return false;
  }

  return data?.response_body?.data?.matched === true;
}