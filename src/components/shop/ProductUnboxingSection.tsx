import UnboxingVideoCard from "./UnboxingVideoCard";

interface Video { id: string; title: string; platform: "aparat" | "youtube"; video_id: string; thumbnail_url: string | null; customer_name: string | null; }

export default function ProductUnboxingSection({ videos }: { videos: Video[] }) {
  if (videos.length === 0) return null;

  return (
    <div className="py-6">
      <h2 className="section-title">آنباکس این محصول توسط مشتریان</h2>
      <div className="deals-scroll">
        {videos.map((v) => (
          <div className="deals-scroll-item" key={v.id} style={{ flexBasis: 220 }}>
            <UnboxingVideoCard id={v.id} title={v.title} platform={v.platform} videoId={v.video_id} thumbnailUrl={v.thumbnail_url} customerName={v.customer_name} />
          </div>
        ))}
      </div>
    </div>
  );
}