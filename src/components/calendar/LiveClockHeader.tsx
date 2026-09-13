"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudSun, Moon, Globe2, X } from "lucide-react";
import { formatJalali, formatHijri } from "@/lib/calendar/jalali";
import { getMoonPhase } from "@/lib/calendar/moonPhase";
import AnalogClock from "./AnalogClock";

const TEHRAN = { label: "تهران", country: "ایران", tz: "Asia/Tehran" };

// پایتخت‌های اصلی دنیا — برای جست‌وجو و انتخاب در پنجره‌ی ساعت جهانی
const WORLD_CAPITALS = [
  { label: "لندن", country: "انگلستان", tz: "Europe/London" },
  { label: "پاریس", country: "فرانسه", tz: "Europe/Paris" },
  { label: "برلین", country: "آلمان", tz: "Europe/Berlin" },
  { label: "رم", country: "ایتالیا", tz: "Europe/Rome" },
  { label: "مادرید", country: "اسپانیا", tz: "Europe/Madrid" },
  { label: "مسکو", country: "روسیه", tz: "Europe/Moscow" },
  { label: "آنکارا", country: "ترکیه", tz: "Europe/Istanbul" },
  { label: "استانبول", country: "ترکیه", tz: "Europe/Istanbul" },
  { label: "آتن", country: "یونان", tz: "Europe/Athens" },
  { label: "وین", country: "اتریش", tz: "Europe/Vienna" },
  { label: "زوریخ", country: "سوئیس", tz: "Europe/Zurich" },
  { label: "استکهلم", country: "سوئد", tz: "Europe/Stockholm" },
  { label: "آمستردام", country: "هلند", tz: "Europe/Amsterdam" },
  { label: "نیویورک", country: "آمریکا", tz: "America/New_York" },
  { label: "لس‌آنجلس", country: "آمریکا", tz: "America/Los_Angeles" },
  { label: "شیکاگو", country: "آمریکا", tz: "America/Chicago" },
  { label: "واشنگتن", country: "آمریکا", tz: "America/New_York" },
  { label: "تورنتو", country: "کانادا", tz: "America/Toronto" },
  { label: "مکزیکوسیتی", country: "مکزیک", tz: "America/Mexico_City" },
  { label: "سائوپائولو", country: "برزیل", tz: "America/Sao_Paulo" },
  { label: "بوینوس‌آیرس", country: "آرژانتین", tz: "America/Argentina/Buenos_Aires" },
  { label: "دبی", country: "امارات", tz: "Asia/Dubai" },
  { label: "ابوظبی", country: "امارات", tz: "Asia/Dubai" },
  { label: "دوحه", country: "قطر", tz: "Asia/Qatar" },
  { label: "ریاض", country: "عربستان", tz: "Asia/Riyadh" },
  { label: "کویت", country: "کویت", tz: "Asia/Kuwait" },
  { label: "مسقط", country: "عمان", tz: "Asia/Muscat" },
  { label: "بغداد", country: "عراق", tz: "Asia/Baghdad" },
  { label: "بیروت", country: "لبنان", tz: "Asia/Beirut" },
  { label: "دمشق", country: "سوریه", tz: "Asia/Damascus" },
  { label: "اسلام‌آباد", country: "پاکستان", tz: "Asia/Karachi" },
  { label: "دهلی‌نو", country: "هند", tz: "Asia/Kolkata" },
  { label: "کابل", country: "افغانستان", tz: "Asia/Kabul" },
  { label: "داکا", country: "بنگلادش", tz: "Asia/Dhaka" },
  { label: "پکن", country: "چین", tz: "Asia/Shanghai" },
  { label: "شانگهای", country: "چین", tz: "Asia/Shanghai" },
  { label: "هنگ‌کنگ", country: "هنگ‌کنگ", tz: "Asia/Hong_Kong" },
  { label: "توکیو", country: "ژاپن", tz: "Asia/Tokyo" },
  { label: "سئول", country: "کره‌جنوبی", tz: "Asia/Seoul" },
  { label: "بانکوک", country: "تایلند", tz: "Asia/Bangkok" },
  { label: "سنگاپور", country: "سنگاپور", tz: "Asia/Singapore" },
  { label: "کوالالامپور", country: "مالزی", tz: "Asia/Kuala_Lumpur" },
  { label: "جاکارتا", country: "اندونزی", tz: "Asia/Jakarta" },
  { label: "مانیل", country: "فیلیپین", tz: "Asia/Manila" },
  { label: "سیدنی", country: "استرالیا", tz: "Australia/Sydney" },
  { label: "ملبورن", country: "استرالیا", tz: "Australia/Melbourne" },
  { label: "ولینگتون", country: "نیوزیلند", tz: "Pacific/Auckland" },
  { label: "قاهره", country: "مصر", tz: "Africa/Cairo" },
  { label: "کیپ‌تاون", country: "آفریقای‌جنوبی", tz: "Africa/Johannesburg" },
  { label: "لاگوس", country: "نیجریه", tz: "Africa/Lagos" },
  { label: "نایروبی", country: "کنیا", tz: "Africa/Nairobi" },
  { label: "کازابلانکا", country: "مراکش", tz: "Africa/Casablanca" },
  { label: "باکو", country: "آذربایجان", tz: "Asia/Baku" },
  { label: "ایروان", country: "ارمنستان", tz: "Asia/Yerevan" },
  { label: "تفلیس", country: "گرجستان", tz: "Asia/Tbilisi" },
];

interface WeatherData {
  city: string;
  temperature?: number;
  description?: string;
}

export default function LiveClockHeader() {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<typeof WORLD_CAPITALS[number] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setNow(new Date()), 0);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    fetch("/api/calendar/weather")
      .then((r) => r.json())
      .then(setWeather)
      .catch(() => setWeather(null));
  }, []);

  const filteredCities = useMemo(() => {
    const q = search.trim();
    if (!q) return WORLD_CAPITALS;
    return WORLD_CAPITALS.filter((c) => c.label.includes(q) || c.country.includes(q));
  }, [search]);

  if (!now) {
    return <div className="clh-skeleton" />;
  }

  const moon = getMoonPhase(now);

  return (
    <div className="clh-wrap">
      <div className="clh-inner">
        <div className="clh-main">
          <AnalogClock time={now} />
          <div className="clh-time-digital">{now.toLocaleTimeString("fa-IR")}</div>
          <div className="clh-dates">
            <span>{formatJalali(now)}</span>
            <span className="clh-sep">•</span>
            <span>{now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            <span className="clh-sep">•</span>
            <span>{formatHijri(now)} ق</span>
          </div>
        </div>

        <div className="clh-extras">
          {weather && weather.temperature !== undefined && (
            <div className="clh-chip">
              <CloudSun size={14} />
              {weather.city} {weather.temperature}° — {weather.description}
            </div>
          )}
          <div className="clh-chip">
            <Moon size={14} />
            {moon.emoji} {moon.phaseName} ({moon.illumination}٪)
          </div>
        </div>

        <div className="clh-world">
          <div className="clh-world-item">
            <span className="clh-world-city">{TEHRAN.label}</span>
            <span className="clh-world-time">{now.toLocaleTimeString("fa-IR", { timeZone: TEHRAN.tz, hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          {selectedCity && (
            <div className="clh-world-item">
              <span className="clh-world-city">{selectedCity.label}</span>
              <span className="clh-world-time">{now.toLocaleTimeString("fa-IR", { timeZone: selectedCity.tz, hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}

          <button className="clh-globe-btn" onClick={() => setPickerOpen(true)} aria-label="انتخاب شهر دیگر">
            <Globe2 size={18} />
          </button>
        </div>
      </div>

      {pickerOpen && (
        <div className="clh-picker-overlay" onClick={() => setPickerOpen(false)}>
          <div className="clh-picker" onClick={(e) => e.stopPropagation()}>
            <div className="clh-picker-head">
              <span>انتخاب شهر برای ساعت جهانی</span>
              <button onClick={() => setPickerOpen(false)}><X size={16} /></button>
            </div>
            <input
              className="clh-picker-search"
              placeholder="جست‌وجوی شهر یا کشور..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="clh-picker-list">
              {filteredCities.map((c) => (
                <button
                  key={c.tz + c.label}
                  className="clh-picker-item"
                  onClick={() => { setSelectedCity(c); setPickerOpen(false); setSearch(""); }}
                >
                  <span>{c.label}</span>
                  <span className="clh-picker-country">{c.country}</span>
                </button>
              ))}
              {filteredCities.length === 0 && <p className="clh-picker-empty">شهری پیدا نشد.</p>}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .clh-skeleton { height: 110px; }
        .clh-wrap { border-bottom: 1px solid rgba(255,255,255,.08); position: relative; }
        .clh-inner { max-width: 1300px; margin: 0 auto; padding: 20px 16px 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
        .clh-main { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .clh-time-digital { font-size: 15px; font-weight: 800; color: #fbbf24; font-variant-numeric: tabular-nums; letter-spacing: .5px; }
        .clh-dates { margin-top: 6px; font-size: 12px; color: #d1d5db; display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
        .clh-sep { opacity: .5; }
        .clh-extras { display: flex; flex-direction: column; gap: 6px; }
        .clh-chip { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 999px; padding: 5px 12px; font-size: 11.5px; color: #e5e7eb; white-space: nowrap; }
        .clh-world { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .clh-world-item { background: rgba(255,255,255,.05); border-radius: 10px; padding: 6px 12px; text-align: center; min-width: 68px; }
        .clh-world-city { display: block; font-size: 10px; color: #9ca3af; }
        .clh-world-time { display: block; font-size: 13px; font-weight: 700; color: #fbbf24; font-variant-numeric: tabular-nums; }
        .clh-globe-btn { width: 36px; height: 36px; border-radius: 999px; background: linear-gradient(135deg, #16a34a, #ca8a04); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .clh-picker-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(3px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .clh-picker { background: #14231a; border: 1px solid rgba(255,255,255,.12); border-radius: 16px; width: 100%; max-width: 380px; max-height: 70vh; display: flex; flex-direction: column; }
        .clh-picker-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.08); font-size: 13px; font-weight: 700; color: #fff; }
        .clh-picker-head button { background: none; border: none; color: #9ca3af; cursor: pointer; }
        .clh-picker-search { margin: 12px 16px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14); color: #fff; border-radius: 10px; padding: 9px 12px; font-size: 13px; outline: none; }
        .clh-picker-search:focus { border-color: #fbbf24; }
        .clh-picker-list { overflow-y: auto; padding: 0 10px 12px; display: flex; flex-direction: column; gap: 2px; }
        .clh-picker-item { display: flex; align-items: center; justify-content: space-between; background: none; border: none; color: #e5e7eb; padding: 9px 10px; border-radius: 8px; font-size: 13px; cursor: pointer; text-align: right; }
        .clh-picker-item:hover { background: rgba(255,255,255,.08); }
        .clh-picker-country { font-size: 11px; color: #6b7280; }
        .clh-picker-empty { text-align: center; color: #6b7280; font-size: 12.5px; padding: 20px 0; }
      `}</style>
    </div>
  );
}
