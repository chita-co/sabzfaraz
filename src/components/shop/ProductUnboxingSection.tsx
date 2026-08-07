import UnboxingVideoCard from "./UnboxingVideoCard";

interface Video {
  id: string; title: string; customer_name: string | null; order_number: string | null;
  aparat_video_id: string | null; youtube_video_id: string | null; instagram_url: string | null;
  thumbnail_url: string | null;
}

export default function ProductUnboxingSection({ videos }: { videos: Video[] }) {
  if (videos.length === 0) return null;

  return (
    <div className="py-6">
      <h2 className="section-title">آنباکس این محصول توسط مشتریان</h2>
      <div className="deals-scroll">
        {videos.map((v) => (
          <div className="deals-scroll-item" key={v.id} style={{ flexBasis: 220 }}>
            <UnboxingVideoCard
              id={v.id} title={v.title}
              aparatId={v.aparat_video_id} youtubeId={v.youtube_video_id} instagramUrl={v.instagram_url}
              thumbnailUrl={v.thumbnail_url} customerName={v.customer_name} orderNumber={v.order_number}
            />
          </div>
        ))}
      </div>
    </div>
  );
}