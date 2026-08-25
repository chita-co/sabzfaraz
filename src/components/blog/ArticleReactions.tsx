"use client";
import { useState, useTransition } from "react";
import { Heart, Bookmark, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { toggleLikeAction, toggleBookmarkAction } from "@/app/(shop)/blog/actions";

export default function ArticleReactions({ postId, initialLikes, initialBookmarks }: { postId: string; initialLikes: number; initialBookmarks: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    startTransition(async () => {
      const res = await toggleLikeAction(postId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setLiked(!!res.liked);
      setLikes(res.likeCount ?? likes);
    });
  }
  function handleBookmark() {
    startTransition(async () => {
      const res = await toggleBookmarkAction(postId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setBookmarked(!!res.bookmarked);
      setBookmarks(res.bookmarkCount ?? bookmarks);
    });
  }
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ url, title: document.title }); } catch {} }
    else { await navigator.clipboard.writeText(url); toast.success("لینک کپی شد"); }
  }

  return (
    <div className="blog-reactions">
      <button onClick={handleLike} disabled={isPending} className={`blog-reaction-btn${liked ? " active" : ""}`}><Heart size={18} /> {likes.toLocaleString("fa-IR")}</button>
      <button onClick={handleBookmark} disabled={isPending} className={`blog-reaction-btn${bookmarked ? " active" : ""}`}><Bookmark size={18} /> {bookmarks.toLocaleString("fa-IR")}</button>
      <button onClick={handleShare} className="blog-reaction-btn"><Share2 size={18} /> اشتراک‌گذاری</button>
    </div>
  );
}