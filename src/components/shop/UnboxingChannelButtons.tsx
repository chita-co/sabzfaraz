import { Phone, Send } from "lucide-react";

// آیکون SVG اینستاگرام جایگزین (به دلیل حذف از lucide-react)
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function UnboxingChannelButtons({
  whatsapp, telegram, instagram,
}: { whatsapp: string | null; telegram: string | null; instagram: string | null }) {
  return (
    <div className="unboxing-channels">
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("سلام میخوام فیلم آنباکس بفرستم")}`} target="_blank" rel="noreferrer" className="unboxing-channel-btn whatsapp">
          <Phone size={20} /><div><b>واتساپ</b><span>فیلم + شماره سفارش رو بفرستید</span></div>
        </a>
      )}
      {telegram && (
        <a href={`https://t.me/${telegram.replace("@", "")}`} target="_blank" rel="noreferrer" className="unboxing-channel-btn telegram">
          <Send size={20} /><div><b>تلگرام</b><span>{telegram}</span></div>
        </a>
      )}
      {instagram && (
        <a href={`https://instagram.com/${instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="unboxing-channel-btn instagram">
          <InstagramIcon size={20} /><div><b>اینستاگرام</b><span>دایرکت با هشتگ #آنباکس_سبزفراز</span></div>
        </a>
      )}
    </div>
  );
}