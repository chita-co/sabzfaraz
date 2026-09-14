"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  toJalali, fromJalali, toApproximateHijri, fromApproximateHijri,
  formatJalali, formatHijri, jalaliMonthLength, isJalaliLeapYear, getZodiacSign,
  JALALI_MONTH_NAMES, GREGORIAN_MONTH_NAMES_FA, HIJRI_MONTH_NAMES,
} from "@/lib/calendar/jalali";

type Mode = "jalali" | "gregorian" | "hijri";

export default function DateConverterTool() {
  const today = useMemo(() => new Date(), []);
  const tJalali = toJalali(today);
  const [mode, setMode] = useState<Mode>("jalali");
  const [y, setY] = useState(tJalali.jy);
  const [m, setM] = useState(tJalali.jm);
  const [d, setD] = useState(tJalali.jd);

  const baseDate = useMemo(() => {
    try {
      if (mode === "jalali") return fromJalali(y, m, d);
      if (mode === "gregorian") return new Date(y, m - 1, d);
      return fromApproximateHijri(y, m, d);
    } catch {
      return today;
    }
  }, [mode, y, m, d, today]);

  const jal = toJalali(baseDate);
  const hij = toApproximateHijri(baseDate);
  const zodiac = getZodiacSign(baseDate);
  const leap = isJalaliLeapYear(jal.jy);
  const monthNames =
    mode === "jalali" ? JALALI_MONTH_NAMES
    : mode === "gregorian" ? GREGORIAN_MONTH_NAMES_FA
    : HIJRI_MONTH_NAMES;

  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const targetMidnight = new Date(baseDate);
  targetMidnight.setHours(0, 0, 0, 0);
  const diffDays = Math.round((todayMidnight.getTime() - targetMidnight.getTime()) / 86400000);
  const ageYears = Math.floor(Math.abs(diffDays) / 365.25);
  const ageDaysRem = Math.abs(diffDays) - Math.floor(ageYears * 365.25);
  const ageMonths = Math.floor(ageDaysRem / 30.44);
  const ageDays = Math.floor(ageDaysRem - ageMonths * 30.44);

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    if (newMode === "jalali") { setY(jal.jy); setM(jal.jm); setD(jal.jd); }
    else if (newMode === "gregorian") { setY(baseDate.getFullYear()); setM(baseDate.getMonth() + 1); setD(baseDate.getDate()); }
    else { setY(hij.hy); setM(hij.hm); setD(hij.hd); }
  }

  return (
    <div className="dct-wrap">
      <h3 className="dct-title">
        <CalendarDays size={14} />
        تبدیل تاریخ شمسی، میلادی و قمری
      </h3>

      <div className="dct-controls">
        <select value={mode} onChange={(e) => handleModeChange(e.target.value as Mode)}>
          <option value="jalali">خورشیدی به میلادی و قمری</option>
          <option value="gregorian">میلادی به خورشیدی و قمری</option>
          <option value="hijri">قمری به خورشیدی و میلادی</option>
        </select>
        <input type="number" value={y} onChange={(e) => setY(Number(e.target.value))} placeholder="سال" />
         <select value={m} onChange={(e) => setM(Number(e.target.value))}>
          {monthNames.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
        <input
          type="number"
          value={d}
          onChange={(e) => setD(Number(e.target.value))}
          min={1}
          max={mode === "jalali" ? jalaliMonthLength(y, m) : 31}
          placeholder="روز"
        />
      </div>

      <div className="dct-results">
        <div className="dct-box">
          <span className="dct-box-title">تاریخ خورشیدی</span>
          <span className="dct-box-value">{jal.jy}/{String(jal.jm).padStart(2, "0")}/{String(jal.jd).padStart(2, "0")}</span>
          <span className="dct-box-sub">{formatJalali(baseDate)}</span>
        </div>
        <div className="dct-box">
          <span className="dct-box-title">تاریخ میلادی</span>
          <span className="dct-box-value">{baseDate.getFullYear()}-{String(baseDate.getMonth() + 1).padStart(2, "0")}-{String(baseDate.getDate()).padStart(2, "0")}</span>
          <span className="dct-box-sub">{baseDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="dct-box">
          <span className="dct-box-title">تاریخ قمری</span>
          <span className="dct-box-value">{hij.hy}/{String(hij.hm).padStart(2, "0")}/{String(hij.hd).padStart(2, "0")}</span>
          <span className="dct-box-sub">{formatHijri(baseDate)}</span>
        </div>
        <div className="dct-box">
          <span className="dct-box-title">برج فلکی</span>
          <span className="dct-box-value">{zodiac || "—"}</span>
        </div>
      </div>


      <p className="dct-footnote">
        فاصله زمانی (سن): {ageYears} سال {ageMonths} ماه {ageDays} روز — سال {jal.jy} {leap ? "کبیسه است" : "کبیسه نیست"}.
      </p>

      <style jsx>{`
        .dct-wrap {
          background: rgba(255, 255, 255, .05);
          border: 1px solid rgba(255, 255, 255, .08);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dct-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: #fbbf24;
          margin: 0;
          line-height: 1.6;
        }

        /* ---------- کنترل‌ها ---------- */
        .dct-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dct-controls select,
        .dct-controls input {
          width: 100%;
          background: rgba(255, 255, 255, .06);
          border: 1px solid rgba(255, 255, 255, .1);
          color: #fff;
          border-radius: 10px;
          padding: 8px 12px;
          font-family: inherit;
          font-size: 12px;
          outline: none;
          transition: border-color .2s ease, background .2s ease;
          text-align: right;
        }

        .dct-controls select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left 12px center;
          padding-left: 32px;
        }

        .dct-controls select option {
          color: #111827;
          background: #ffffff;
        }

        .dct-controls input:focus,
        .dct-controls select:focus {
          border-color: #fbbf24;
          background: rgba(255, 255, 255, .09);
        }

        /* ---------- نتایج ---------- */
        .dct-results {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .dct-box {
          background: rgba(255, 255, 255, .04);
          border: 1px solid rgba(255, 255, 255, .08);
          border-radius: 10px;
          padding: 10px 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 3px;
          transition: background .2s ease, border-color .2s ease;
        }

        .dct-box:hover {
          background: rgba(255, 255, 255, .07);
          border-color: rgba(251, 191, 36, .4);
        }

        .dct-box-title {
          display: block;
          font-size: 10.5px;
          color: #9ca3af;
          font-weight: 600;
        }

        .dct-box-value {
          display: block;
          font-size: 13.5px;
          font-weight: 800;
          color: #fff;
          direction: ltr;
          font-variant-numeric: tabular-nums;
        }

        .dct-box-sub {
          display: block;
          font-size: 10px;
          color: #6b7280;
          direction: ltr;
          margin-top: 2px;
        }

        /* ---------- سن و کبیسه ---------- */
        .dct-footnote {
          font-size: 11.5px;
          color: #d1d5db;
          text-align: center;
          margin: 0;
          line-height: 1.9;
          padding-top: 10px;
          border-top: 1px dashed rgba(255, 255, 255, .1);
        }

        /* ---------- موبایل ---------- */
        @media (max-width: 900px) {
          .dct-results {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .dct-wrap {
            padding: 12px;
          }
          .dct-results {
            grid-template-columns: 1fr;
          }
          .dct-box-value {
            font-size: 12.5px;
          }
          .dct-title {
            font-size: 12px;
          }
          .dct-controls select,
          .dct-controls input {
            font-size: 11.5px;
            padding: 7px 10px;
          }
        }
      `}</style>
    </div>
  );
}