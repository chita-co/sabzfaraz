"use client";

import { IRAN_PROVINCES } from "@/lib/iran-locations";
import CustomSelect from "./CustomSelect";

export default function ProvinceCitySelect({
  province,
  city,
  onProvinceChange,
  onCityChange,
  cityOptional = false,
  provinceName = "province",
  cityName = "city",
}: {
  province: string;
  city: string;
  onProvinceChange: (v: string) => void;
  onCityChange: (v: string) => void;
  cityOptional?: boolean;
  provinceName?: string;
  cityName?: string;
}) {
  const selectedProvince = IRAN_PROVINCES.find((p) => p.name === province);

  return (
    <div className="grid grid-cols-2 gap-2">
      <CustomSelect
        name={provinceName}
        value={province}
        onChange={(v) => {
          onProvinceChange(v);
          onCityChange("");
        }}
        options={IRAN_PROVINCES.map((p) => ({ value: p.name, label: p.name }))}
        placeholder="انتخاب استان"
      />
      <CustomSelect
        name={cityName}
        value={city}
        onChange={onCityChange}
        options={(selectedProvince?.cities ?? []).map((c) => ({ value: c, label: c }))}
        placeholder={cityOptional ? "همه‌ی شهرهای استان" : "انتخاب شهر"}
        disabled={!province}
      />
    </div>
  );
}