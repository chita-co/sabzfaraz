"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { X, LogIn } from "lucide-react";

export default function LoginPromptModal({ open, onClose, message }: { open: boolean; onClose: () => void; message?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="login-prompt-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="login-prompt-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
            <button className="login-prompt-close" onClick={onClose}><X size={18} /></button>
            <div className="login-prompt-icon"><LogIn size={26} /></div>
            <h3>ورود به حساب کاربری</h3>
            <p>{message ?? "برای انجام این کار باید وارد حساب کاربری‌تان شوید."}</p>
            <Link href="/login" className="login-prompt-btn">ورود / ثبت‌نام</Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}