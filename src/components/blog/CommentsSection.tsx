"use client";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { addCommentAction } from "@/app/(shop)/blog/actions";

interface Comment { id: string; user_name: string; content: string; created_at: string; }

export default function CommentsSection({ postId, initialComments }: { postId: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
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
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="نظر خود را بنویسید..." rows={3} />
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
    </section>
  );
}