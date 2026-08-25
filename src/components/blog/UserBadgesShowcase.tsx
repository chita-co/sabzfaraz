import { Award, BookOpen, BookOpenCheck, Crown, Heart, MessageCircle } from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<{ size?: number }>> = {
  "book-open": BookOpen,
  "book-open-check": BookOpenCheck,
  crown: Crown,
  heart: Heart,
  "message-circle": MessageCircle,
  award: Award,
};

interface Badge {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string;
  requirement_value: number;
}

export default function UserBadgesShowcase({ badges, earnedIds }: { badges: Badge[]; earnedIds: string[] }) {
  if (!badges || badges.length === 0) return null;
  const earnedSet = new Set(earnedIds);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="font-bold text-gray-800 mb-4">نشان‌های مجله سبزفراز</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map((b) => {
          const Icon = iconMap[b.icon] ?? Award;
          const earned = earnedSet.has(b.id);
          return (
            <div
              key={b.id}
              className={`flex flex-col items-center text-center gap-1 rounded-xl border p-3 ${
                earned ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-400 grayscale opacity-70"
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-bold">{b.title}</span>
              {b.description && <span className="text-[11px] text-gray-500">{b.description}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}