import { useState, useMemo } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { TrendingUp, Eye, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, BookOpen, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

type EmotionType = "all" | "satisfying" | "cheerful" | "absurd" | "angry";
type ContentType = "all" | "diary" | "portfolio";

const SAMPLE_INSPIRATIONS = [
  {
    id: 1,
    excerpt: "3년 동안 무시하던 팀장이 드디어 퇴사했다. 오늘 저녁은 치맥이다.",
    category: "통쾌",
    views: 4521,
    emotion: "satisfying" as const,
    contentType: "diary" as const,
    likes: 342,
    dislikes: 12
  },
  {
    id: 2,
    excerpt: "Finally told my micromanaging boss I'm leaving for a competitor. The look on their face? Priceless.",
    category: "Satisfying",
    views: 3892,
    emotion: "satisfying" as const,
    contentType: "diary" as const,
    likes: 289,
    dislikes: 8
  },
  {
    id: 3,
    excerpt: "**Challenge**: 팀 생산성 30% 하락. **Approach**: 주간 스프린트 도입. **Outcome**: 3개월 내 생산성 45% 향상.",
    category: "통쾌",
    views: 5103,
    emotion: "satisfying" as const,
    contentType: "portfolio" as const,
    likes: 567,
    dislikes: 23
  },
  {
    id: 4,
    excerpt: "오늘 점심에 우연히 들어간 식당에서 사장님이 서비스로 반찬 5개를 더 주셨다. 세상이 아직 살 만하다.",
    category: "유쾌",
    views: 2247,
    emotion: "cheerful" as const,
    contentType: "diary" as const,
    likes: 198,
    dislikes: 5
  },
  {
    id: 5,
    excerpt: "My cat learned to high-five today. Spent the whole evening celebrating with extra treats.",
    category: "Cheerful",
    views: 1892,
    emotion: "cheerful" as const,
    contentType: "diary" as const,
    likes: 421,
    dislikes: 3
  },
  {
    id: 6,
    excerpt: "**Hypothesis**: 온보딩 간소화로 전환율 상승. **Result**: 가입 완료율 40% 증가, 지원 티켓 25% 감소.",
    category: "유쾌",
    views: 1567,
    emotion: "cheerful" as const,
    contentType: "portfolio" as const,
    likes: 234,
    dislikes: 11
  },
  {
    id: 7,
    excerpt: "택배가 왔는데 내가 주문한 게 아니다. 확인해보니 2년 전에 주문한 건데 이제 왔다.",
    category: "황당",
    views: 6421,
    emotion: "absurd" as const,
    contentType: "diary" as const,
    likes: 892,
    dislikes: 15
  },
  {
    id: 8,
    excerpt: "Ordered a small coffee, received a large. Asked for no sugar, it was sweet. Wrong name on cup. Still drank it because it was free.",
    category: "Absurd",
    views: 3089,
    emotion: "absurd" as const,
    contentType: "diary" as const,
    likes: 445,
    dislikes: 7
  },
  {
    id: 9,
    excerpt: "**Challenge**: 레거시 코드 리팩토링 예산 0원. **Approach**: 20% 룰 도입. **Outcome**: 6개월 후 배포 속도 2배.",
    category: "황당",
    views: 4832,
    emotion: "absurd" as const,
    contentType: "portfolio" as const,
    likes: 678,
    dislikes: 34
  },
  {
    id: 10,
    excerpt: "회의 시간에 30분 늦게 온 사람이 '왜 진행이 안 됐어요?'라고 물어봤다.",
    category: "화남",
    views: 7890,
    emotion: "angry" as const,
    contentType: "diary" as const,
    likes: 1234,
    dislikes: 45
  },
  {
    id: 11,
    excerpt: "Coworker took credit for my project in front of the CEO. In the same meeting where I presented it.",
    category: "Angry",
    views: 5621,
    emotion: "angry" as const,
    contentType: "diary" as const,
    likes: 987,
    dislikes: 28
  },
  {
    id: 12,
    excerpt: "**Challenge**: 경쟁사 가격 인하로 매출 급감. **Action**: 프리미엄 전략 전환. **Lesson**: 가격 경쟁은 답이 아니다.",
    category: "화남",
    views: 4321,
    emotion: "angry" as const,
    contentType: "portfolio" as const,
    likes: 456,
    dislikes: 67
  },
];

const EMOTION_FILTERS: { key: EmotionType; label: string; emoji: string }[] = [
  { key: "all", label: "전체", emoji: "" },
  { key: "satisfying", label: "통쾌한", emoji: "😤" },
  { key: "cheerful", label: "유쾌한", emoji: "😊" },
  { key: "absurd", label: "말도 안 되는", emoji: "🤯" },
  { key: "angry", label: "화나는", emoji: "😡" },
];

const CONTENT_FILTERS: { key: ContentType; label: string; icon: typeof BookOpen }[] = [
  { key: "all", label: "전체", icon: Sparkles },
  { key: "diary", label: "다이어리", icon: BookOpen },
  { key: "portfolio", label: "포트폴리오", icon: Briefcase },
];

export default function Inspiration() {
  const [emotionFilter, setEmotionFilter] = useState<EmotionType>("all");
  const [contentFilter, setContentFilter] = useState<ContentType>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [reactions, setReactions] = useState<Record<number, "like" | "dislike" | null>>({});

  const shuffledInspirations = useMemo(() => {
    let filtered = SAMPLE_INSPIRATIONS;
    
    if (emotionFilter !== "all") {
      filtered = filtered.filter(i => i.emotion === emotionFilter);
    }
    if (contentFilter !== "all") {
      filtered = filtered.filter(i => i.contentType === contentFilter);
    }
    
    return [...filtered].sort(() => Math.random() - 0.5);
  }, [emotionFilter, contentFilter, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleReaction = (id: number, type: "like" | "dislike") => {
    setReactions(prev => ({
      ...prev,
      [id]: prev[id] === type ? null : type
    }));
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <SectionHeader 
        title="trend" 
        description="Get inspired by moments from others."
        action={
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            data-testid="button-refresh-feed"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">새로고침</span>
          </button>
        }
      />

      {/* Content Type Filter */}
      <div className="flex gap-2 mb-4">
        {CONTENT_FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setContentFilter(key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${contentFilter === key 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }
            `}
            data-testid={`content-filter-${key}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Emotion Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {EMOTION_FILTERS.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setEmotionFilter(key)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${emotionFilter === key 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }
            `}
            data-testid={`emotion-filter-${key}`}
          >
            {emoji && <span className="mr-1">{emoji}</span>}
            {label}
          </button>
        ))}
      </div>

      {/* Trending Badge */}
      <div className="flex items-center gap-2 mb-6 text-muted-foreground">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">지금 뜨는 이야기</span>
      </div>

      {/* Inspiration Cards */}
      <div className="space-y-4">
        {shuffledInspirations.map((item, index) => (
          <motion.div
            key={`${item.id}-${refreshKey}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="paper-card p-6 group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {item.contentType === "portfolio" ? (
                  <Briefcase className="w-5 h-5 text-primary" />
                ) : (
                  <BookOpen className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                    {item.category}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {item.contentType === "portfolio" ? "포트폴리오" : "다이어리"}
                  </span>
                  <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.views.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-serif text-foreground leading-relaxed mb-4">
                  {item.excerpt}
                </p>
                
                {/* Like/Dislike Buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleReaction(item.id, "like")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      reactions[item.id] === "like"
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                    data-testid={`like-${item.id}`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{item.likes + (reactions[item.id] === "like" ? 1 : 0)}</span>
                  </button>
                  <button
                    onClick={() => handleReaction(item.id, "dislike")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      reactions[item.id] === "dislike"
                        ? "bg-red-500/20 text-red-600 dark:text-red-400"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                    data-testid={`dislike-${item.id}`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>{item.dislikes + (reactions[item.id] === "dislike" ? 1 : 0)}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {shuffledInspirations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>해당 조건에 맞는 게시물이 없습니다.</p>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center mt-12 pt-8 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          다른 사람들의 이야기에서 영감을 얻고, 나만의 순간을 기록하세요.
        </p>
      </div>
    </div>
  );
}
