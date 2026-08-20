export default function EmallsBadge() {
  return (
    <div className="emalls-badge-item">
      <a
        href="https://emalls.ir/Shop/95401/"
        target="_blank"
        rel="noreferrer"
        aria-label="نشان اعتباری ایمالز"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          referrerPolicy="origin"
          src="https://service.emalls.ir/neshan?id=95401"
          alt="نشان اعتباری ایمالز"
        />
      </a>
    </div>
  );
}