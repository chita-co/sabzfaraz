import GalleryVideoCard from "./GalleryVideoCard";

interface GalleryVideo {
  id: string;
  platform: "instagram" | "youtube" | "aparat";
  video_url: string;
  video_id: string | null;
  caption: string | null;
  cover_image_url: string | null;
}

const SECTIONS: { platform: "instagram" | "youtube" | "aparat"; label: string }[] = [
  { platform: "instagram", label: "گالری اینستاگرام" },
  { platform: "youtube", label: "گالری یوتیوب" },
  { platform: "aparat", label: "گالری آپارات" },
];

export default function GalleryVideoGrid({ videos }: { videos: GalleryVideo[] }) {
  if (videos.length === 0) return null;

  return (
    <div className="gallery-sections">
      {SECTIONS.map(({ platform, label }) => {
        const items = videos.filter((v) => v.platform === platform);
        if (items.length === 0) return null;
        return (
          <div key={platform} className="gallery-section">
            <h2 className="section-title">{label}</h2>
            <div className="gallery-grid">
              {items.map((v) => (
                <GalleryVideoCard
                  key={v.id}
                  platform={v.platform}
                  videoUrl={v.video_url}
                  videoId={v.video_id}
                  caption={v.caption}
                  coverImageUrl={v.cover_image_url}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}