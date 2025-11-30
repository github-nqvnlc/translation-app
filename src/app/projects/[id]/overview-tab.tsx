"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Activity,
  BarChart3,
  FileText,
  Loader2,
  Users,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export interface OverviewSettings {
  showSummaryCards: boolean;
  showCompletionCard: boolean;
  showLanguageChart: boolean;
  showRecentUpdates: boolean;
  showTranslatorLeaderboard: boolean;
  showTranslatorTimeline: boolean;
}

interface ProjectOverviewStats {
  summary: {
    members: number;
    translationTables: number;
    poFiles: number;
  };
  completion: {
    translatedEntries: number;
    totalEntries: number;
  };
  poEntries: number;
  languages: Array<{ label: string; value: number }>;
  recentUpdates: Array<{
    id: string;
    type: "translation-table" | "po-file";
    title: string;
    meta: string | null;
    timestamp: string;
  }>;
  translatorLeaderboard: Array<{
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    contributions: number;
  }>;
  translatorTimeline: {
    labels: string[];
    series: Array<{
      userId: string;
      name: string;
      email: string;
      image: string | null;
      data: number[];
    }>;
  };
  availableContributors: Array<{
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
  }>;
  dateRange?: {
    start: string;
    end: string;
  };
}

const defaultStats: ProjectOverviewStats = {
  summary: { members: 0, translationTables: 0, poFiles: 0 },
  completion: { translatedEntries: 0, totalEntries: 0 },
  poEntries: 0,
  languages: [],
  recentUpdates: [],
  translatorLeaderboard: [],
  translatorTimeline: {
    labels: [],
    series: [],
  },
  availableContributors: [],
};

const LANGUAGE_COLORS = [
  "#38bdf8",
  "#22d3ee",
  "#a855f7",
  "#f97316",
  "#facc15",
  "#4ade80",
];

const TIMELINE_COLORS = [
  "#38bdf8",
  "#a855f7",
  "#22d3ee",
  "#f97316",
  "#facc15",
  "#4ade80",
];

type RangePreset = "7d" | "30d";

export function OverviewTab({
  projectId,
  settings,
}: {
  projectId: string;
  settings: OverviewSettings;
}) {
  const [stats, setStats] = useState<ProjectOverviewStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rangePreset, setRangePreset] = useState<RangePreset>("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [useAllUsers, setUseAllUsers] = useState(true);
  const [isUsingCustomRange, setIsUsingCustomRange] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchParamsRef = useRef<string>("");

  useEffect(() => {
    let isMounted = true;

    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce fetch để tránh gọi API quá nhiều lần
    fetchTimeoutRef.current = setTimeout(() => {
      const fetchStats = async () => {
        setLoading(true);
        setError("");

        try {
          const params = new URLSearchParams();
          params.set("range", rangePreset);
          // Chỉ gửi custom dates khi người dùng thực sự chọn custom range
          if (isUsingCustomRange && customStart && customEnd) {
            params.set("start", customStart);
            params.set("end", customEnd);
          }
          if (!useAllUsers) {
            params.set(
              "users",
              selectedUsers.length ? selectedUsers.join(",") : "_none",
            );
          }

          const qs = params.toString();
          // Kiểm tra xem params có thay đổi không, nếu không thì không gọi API
          if (qs === lastFetchParamsRef.current) {
            if (isMounted) {
              setLoading(false);
            }
            return;
          }

          lastFetchParamsRef.current = qs;
          const url = qs
            ? `/api/projects/${projectId}/overview-stats?${qs}`
            : `/api/projects/${projectId}/overview-stats`;

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Không thể tải dashboard project");
        }

        if (isMounted) {
          setStats(result.data);
          // KHÔNG cập nhật customStart/customEnd từ API response khi đang dùng custom range
          // vì người dùng đã chọn rõ ràng rồi. Chỉ cập nhật khi dùng preset để sync với server
          if (!isUsingCustomRange && result.data.dateRange) {
            const startISO = result.data.dateRange.start.slice(0, 10);
            const endISO = result.data.dateRange.end.slice(0, 10);
            // Chỉ cập nhật nếu giá trị thực sự khác với giá trị hiện tại
            setCustomStart((prev) => (prev !== startISO ? startISO : prev));
            setCustomEnd((prev) => (prev !== endISO ? endISO : prev));
          }

          if (!useAllUsers && selectedUsers.length) {
            const validIds = new Set(
              result.data.availableContributors.map(
                (contributor: { userId: string }) => contributor.userId,
              ),
            );
            setSelectedUsers((prev) => {
              const next = prev.filter((id) => validIds.has(id));
              return next.length === prev.length ? prev : next;
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải dashboard project",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

      fetchStats();
    }, 100); // Debounce 100ms

    return () => {
      isMounted = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [
    projectId,
    rangePreset,
    isUsingCustomRange,
    customStart,
    customEnd,
    selectedUsers,
    useAllUsers,
  ]);

  const completionPercent = useMemo(() => {
    if (stats.completion.totalEntries === 0) return 0;
    return Math.round(
      (stats.completion.translatedEntries / stats.completion.totalEntries) * 100,
    );
  }, [stats.completion]);

  const leaderboardChartData = useMemo(
    () =>
      stats.translatorLeaderboard.map((item) => ({
        name: item.name || item.email,
        contributions: item.contributions,
      })),
    [stats.translatorLeaderboard],
  );

  const timelineChartData = useMemo(() => {
    return stats.translatorTimeline.labels.map((label, index) => {
      const row: Record<string, number | string> = { label };
      stats.translatorTimeline.series.forEach((series) => {
        row[series.userId] = series.data[index] ?? 0;
      });
      return row;
    });
  }, [stats.translatorTimeline]);

  const showTranslatorCharts =
    settings.showTranslatorLeaderboard || settings.showTranslatorTimeline;
  const contributorOptions = stats.availableContributors;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-sky-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-6 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {settings.showSummaryCards && (
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Thành viên"
            value={stats.summary.members}
            icon={<Users className="size-4 text-sky-300" />}
            subtitle="Người đang tham gia"
          />
          <SummaryCard
            label="Translation Tables"
            value={stats.summary.translationTables}
            icon={<FileText className="size-4 text-emerald-300" />}
            subtitle={`${stats.completion.totalEntries.toLocaleString()} entries`}
          />
          <SummaryCard
            label="PO Files"
            value={stats.summary.poFiles}
            icon={<FileText className="size-4 text-purple-300" />}
            subtitle={`${stats.poEntries.toLocaleString()} dòng PO`}
          />
        </div>
      )}

      {showTranslatorCharts && (
        <TranslatorFilters
          rangePreset={rangePreset}
          setRangePreset={(preset) => {
            setRangePreset(preset);
            setIsUsingCustomRange(false);
          }}
          customStart={customStart}
          setCustomStart={(value) => {
            setCustomStart(value);
          }}
          customEnd={customEnd}
          setCustomEnd={(value) => {
            setCustomEnd(value);
          }}
          setIsUsingCustomRange={setIsUsingCustomRange}
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
          useAllUsers={useAllUsers}
          setUseAllUsers={setUseAllUsers}
          contributors={contributorOptions}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {settings.showCompletionCard && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Tiến độ dịch
                </p>
                <h3 className="text-3xl font-semibold text-white">
                  {completionPercent}%
                </h3>
                <p className="text-xs text-slate-500">
                  Translation + PO entries
                </p>
              </div>
              <div className="flex size-16 items-center justify-center rounded-full border border-sky-500/40 bg-slate-950">
                <BarChart3 className="size-6 text-sky-400" />
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-emerald-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="mt-3 text-xs text-slate-400">
              {stats.completion.translatedEntries.toLocaleString()} /{" "}
              {stats.completion.totalEntries.toLocaleString()} entries đã có bản
              dịch
            </div>
          </div>
        )}

        {settings.showLanguageChart && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Phân bổ ngôn ngữ
                </p>
                <h3 className="text-2xl font-semibold text-white">
                  {stats.languages.length} ngôn ngữ
                </h3>
                <p className="text-xs text-slate-500">
                  Translation Tables + PO Files
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10">
                <Activity className="size-5 text-purple-300" />
              </div>
            </div>
            {stats.languages.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có dữ liệu ngôn ngữ cho project này.
              </p>
            ) : (
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="h-48 w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.languages}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {stats.languages.map((entry, index) => (
                          <Cell
                            key={entry.label}
                            fill={LANGUAGE_COLORS[index % LANGUAGE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          background: "rgba(15,23,42,0.95)",
                          borderRadius: 12,
                          border: "1px solid rgba(148,163,184,0.2)",
                          color: "#e2e8f0",
                        }}
                        formatter={(value, name) => [
                          `${value} bảng/tệp`,
                          name as string,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 text-sm text-slate-300">
                  {stats.languages.map((item, index) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
                          }}
                        />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-slate-400">
                        {item.value} bảng/tệp
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {settings.showTranslatorLeaderboard && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Biểu đồ người dịch
                </p>
                <h3 className="text-2xl font-semibold text-white">Top đóng góp</h3>
              </div>
              <span className="text-xs text-slate-500">
                {stats.translatorLeaderboard.length} người dùng
              </span>
            </div>
            {leaderboardChartData.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có dữ liệu đóng góp trong khoảng thời gian này.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaderboardChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.95)",
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.2)",
                        color: "#e2e8f0",
                      }}
                      formatter={(value) => [`${value} entries`, "Đóng góp"]}
                    />
                    <Bar
                      dataKey="contributions"
                      fill="#38bdf8"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {settings.showTranslatorTimeline && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Hoạt động theo thời gian
                </p>
                <h3 className="text-2xl font-semibold text-white">
                  Người dịch theo ngày
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {stats.translatorTimeline.series.length} người được hiển thị
              </span>
            </div>
            {timelineChartData.length === 0 ||
            stats.translatorTimeline.series.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có hoạt động nào trong khoảng thời gian này.
              </p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.95)",
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.2)",
                        color: "#e2e8f0",
                      }}
                      formatter={(value) => [`${value} entries`, "Đóng góp"]}
                    />
                    <Legend />
                    {stats.translatorTimeline.series.map((series, index) => (
                      <Line
                        key={series.userId}
                        type="monotone"
                        dataKey={series.userId}
                        name={series.name}
                        stroke={TIMELINE_COLORS[index % TIMELINE_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {settings.showRecentUpdates && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">
              Hoạt động gần đây
            </p>
            <span className="text-xs text-slate-500">
              {stats.recentUpdates.length} bản ghi
            </span>
          </div>
          {stats.recentUpdates.length === 0 ? (
            <p className="text-sm text-slate-500">
              Chưa có thay đổi nào gần đây.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentUpdates.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5/10 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.type === "translation-table"
                        ? "Translation Table"
                        : "PO File"}
                      {item.meta ? ` · ${item.meta}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(item.timestamp).toLocaleDateString("vi-VN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

type TranslatorFiltersProps = {
  rangePreset: RangePreset;
  setRangePreset: (preset: RangePreset) => void;
  customStart: string;
  setCustomStart: (value: string) => void;
  customEnd: string;
  setCustomEnd: (value: string) => void;
  setIsUsingCustomRange: (value: boolean) => void;
  selectedUsers: string[];
  setSelectedUsers: Dispatch<SetStateAction<string[]>>;
  useAllUsers: boolean;
  setUseAllUsers: Dispatch<SetStateAction<boolean>>;
  contributors: Array<{
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
  }>;
};

function TranslatorFilters({
  rangePreset,
  setRangePreset,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  setIsUsingCustomRange,
  selectedUsers,
  setSelectedUsers,
  useAllUsers,
  setUseAllUsers,
  contributors,
}: TranslatorFiltersProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDateRangeChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    setIsUsingCustomRange(true);
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectableIds = contributors.map((c) => c.userId).filter(Boolean);

  const selectionLabel =
    useAllUsers || selectedUsers.length === 0
      ? "Tất cả người dịch"
      : `${selectedUsers.length} người được chọn`;

  const handleToggleUser = (userId: string) => {
    if (useAllUsers) {
      setUseAllUsers(false);
      const remaining = selectableIds.filter((id) => id !== userId);
      setSelectedUsers(remaining);
      return;
    }

    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAll = () => {
    setUseAllUsers(true);
    setSelectedUsers([]);
  };

  const handleClearSelection = () => {
    setUseAllUsers(false);
    setSelectedUsers([]);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="font-semibold whitespace-nowrap">
              Khoảng thời gian
            </label>
            <Select
              value={rangePreset}
              onValueChange={(value) => setRangePreset(value as RangePreset)}
            >
              <SelectTrigger className="h-8 min-w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 ngày gần đây</SelectItem>
                <SelectItem value="30d">30 ngày gần đây</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DateRangePicker
            startDate={customStart}
            endDate={customEnd}
            onRangeChange={handleDateRangeChange}
            className="flex-shrink-0"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
          >
            <Filter className="size-3.5" />
            {selectionLabel}
            <ChevronDown className="size-3" />
          </button>
          {open && (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-white/10 bg-slate-950 p-3 text-left shadow-2xl">
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="hover:text-white"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="hover:text-white"
                >
                  Bỏ chọn
                </button>
              </div>
              {selectableIds.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Chưa có người dịch nào trong khoảng thời gian này.
                </p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {contributors.map((contributor) => {
                    const checked =
                      useAllUsers ||
                      selectedUsers.includes(contributor.userId);
                    return (
                      <label
                        key={contributor.userId}
                        className="flex items-center gap-2 text-xs text-slate-200"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-sky-500"
                          checked={checked}
                          onChange={() => handleToggleUser(contributor.userId)}
                        />
                        <span className="truncate">
                          {contributor.name || contributor.email}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
      <div className="mb-3 flex items-center justify-between text-slate-400">
        <span className="text-sm font-medium">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

