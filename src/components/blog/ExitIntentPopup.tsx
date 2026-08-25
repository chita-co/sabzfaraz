"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { BlogPost } from "@/types/blog";

export default function ExitIntentPopup({ suggestion }: { suggestion: BlogPost | null }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!suggestion) return;
    if (sessionStorage.getItem("blog_exit_intent_shown")) return;

    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0) {
        setShow(true);
        sessionStorage.setItem("blog_exit_intent_shown", "1");
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    }
    const timer = setTimeout(() => document.addEventListener("mouseleave", handleMouseLeave), 8000);
    return () => { clearTimeout(timer); document.removeEventListener("mouseleave", handleMouseLeave); };
  }, [suggestion]);

  if (!suggestion) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="exit-intent-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShow(false)}>
          <motion.div className="exit-intent-card" initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 20 }} onClick={(e) => e.stopPropagation()}>
            <button className="exit-intent-close" onClick={() => setShow(false)}><X size={18} /></button>
            {suggestion.main_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={suggestion.main_image_url} alt={suggestion.title} />
            )}
            <div className="exit-intent-body">
              <span>پیش از رفتن، این مقاله رو از دست ندید</span>
              <h3>{suggestion.title}</h3>
              <Link href={`/blog/${suggestion.slug}`} onClick={() => setShow(false)}>مطالعه مقاله</Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}