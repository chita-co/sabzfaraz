import { getGalleryVideos } from "./actions";
import GalleryVideoForm from "@/components/admin/GalleryVideoForm";
import GalleryVideosTable from "@/components/admin/GalleryVideosTable";

export default async function AdminGalleryPage() {
  const videos = await getGalleryVideos();
  return (
    <div className="space-y-6">
      <GalleryVideoForm />
      <GalleryVideosTable videos={videos} />
    </div>
  );
}