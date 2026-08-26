"use client";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { addCommentAction } from "@/app/(shop)/blog/actions";
import LoginPromptModal from "./LoginPromptModal";

interface Comment { id: string; user_name: string; content: string; created_at: string; }

export default function CommentsSection({ postId, initialComments, isLoggedIn }: { postId: string; initialComments: Comment[]; isLoggedIn: boolean }) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  function submit() {
    if (!isLoggedIn) return setShowLoginPrompt(true);
    if (!text.trim()) return;
    startTransition(async () => {
      const res = await addCommentAction(postId, text);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setComments((prev) => [{ id: `temp-${Date.now()}`, user_name: "شما", content: text, created_at: new Date().toISOString() }, ...prev]);
      setText("");
      toast.success("نظر شما ثبت شد");
    });
  }

  return (
    <section className="blog-comments">
      <h2>نظرات ({comments.length.toLocaleString("fa-IR")})</h2>
      <div className="blog-comment-form">
        <textarea value={text} onFocus={() => !isLoggedIn && setShowLoginPrompt(true)} onChange={(e) => setText(e.target.value)} placeholder="نظر خود را بنویسید..." rows={3} />
        <button onClick={submit} disabled={isPending}>{isPending ? "در حال ارسال..." : "ارسال نظر"}</button>
      </div>
      <div className="blog-comment-list">
        {comments.map((c) => (
          <div key={c.id} className="blog-comment-item">
            <div className="blog-comment-avatar">{c.user_name.charAt(0)}</div>
            <div>
              <div className="blog-comment-meta"><strong>{c.user_name}</strong><span>{new Date(c.created_at).toLocaleDateString("fa-IR")}</span></div>
              <p>{c.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="blog-empty">اولین نفری باشید که نظر می‌دهد.</p>}
      </div>
      <LoginPromptModal open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} message="برای ثبت نظر باید وارد حساب کاربری‌تان شوید." />
    </section>
  );
}