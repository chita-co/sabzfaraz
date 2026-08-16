import { headers } from "next/headers";

const COMPANY_IFRAME_URL = "https://sabzfaraz.vercel.app/badge-company";
const PERSONAL_IFRAME_URL = "https://sabzfaraz.ir/badge-personal";

type BadgeType = "company" | "personal";

function DirectBadge({ type }: { type: BadgeType }) {
  const data =
    type === "company"
      ? {
          href: "https://trustseal.enamad.ir/?id=771198&Code=xJTGAB5Hqaj2vITUvbXueKZ5VdtlPdHk",
          src: "https://trustseal.enamad.ir/logo.aspx?id=771198&Code=xJTGAB5Hqaj2vITUvbXueKZ5VdtlPdHk",
          label: "نماد اعتماد شرکت",
        }
      : {
          href: "https://trustseal.enamad.ir/?id=775040&Code=fh4SEG1KfFjUvs1m6W7qx2zcqVDNviQv",
          src: "https://trustseal.enamad.ir/logo.aspx?id=775040&Code=fh4SEG1KfFjUvs1m6W7qx2zcqVDNviQv",
          label: "نماد اعتماد شخص",
        };

  return (
    <div className="enamad-badge-item">
      <a referrerPolicy="origin" target="_blank" rel="noreferrer" href={data.href}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img referrerPolicy="origin" src={data.src} alt={data.label} />
      </a>
      <p className="enamad-badge-label">{data.label}</p>
    </div>
  );
}

function BadgeFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="enamad-badge-item">
      <iframe
        src={src}
        title={title}
        style={{ width: 160, height: 160, border: "none", display: "block" }}
        scrolling="no"
        referrerPolicy="origin"
      />
      <p className="enamad-badge-label">{title}</p>
    </div>
  );
}

export default async function EnamadBadges() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isVercelDomain = host === "sabzfaraz.vercel.app";

  if (isVercelDomain) {
    return (
      <div className="enamad-badges-row">
        <DirectBadge type="company" />
        <BadgeFrame src={PERSONAL_IFRAME_URL} title="نماد اعتماد شخص" />
      </div>
    );
  }

  return (
    <div className="enamad-badges-row">
      <DirectBadge type="personal" />
      <BadgeFrame src={COMPANY_IFRAME_URL} title="نماد اعتماد شرکت" />
    </div>
  );
}