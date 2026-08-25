import { getRandomFeaturedPost } from "@/lib/blog/queries";
import ExitIntentPopup from "@/components/blog/ExitIntentPopup";
import "./blog.css";

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const suggestion = await getRandomFeaturedPost();
  return (
    <>
      {children}
      <ExitIntentPopup suggestion={suggestion} />
    </>
  );
}