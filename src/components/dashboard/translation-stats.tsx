'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Languages, Folder } from 'lucide-react';

interface LanguageStat {
  language: string;
  count: number;
}

interface ProjectStat {
  projectId: string | null;
  projectName: string;
  count: number;
}

interface TranslationStatsProps {
  userId: string;
  showLanguageStats?: boolean;
  showProjectStats?: boolean;
}

const COLORS = [
  '#0ea5e9',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function TranslationStats({
  userId,
  showLanguageStats = true,
  showProjectStats = true,
}: TranslationStatsProps) {
  const [languageStats, setLanguageStats] = useState<LanguageStat[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      const result = await response.json();

      if (response.ok && result.data) {
        if (result.data.languageStats) {
          setLanguageStats(result.data.languageStats);
        }
        if (result.data.projectStats) {
          setProjectStats(result.data.projectStats);
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 p-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
          <p className="text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const totalLanguages = languageStats.reduce((sum, stat) => sum + stat.count, 0);
  const totalProjects = projectStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Language Stats */}
      {showLanguageStats && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-sky-400" />
              <h3 className="text-lg font-semibold text-white">Theo ngôn ngữ</h3>
            </div>
            <div className="flex rounded-lg border border-white/10 bg-slate-900/50 p-1">
              <button
                onClick={() => setChartType('pie')}
                className={`rounded px-3 py-1 text-xs font-medium transition ${
                  chartType === 'pie'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tròn
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`rounded px-3 py-1 text-xs font-medium transition ${
                  chartType === 'bar'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cột
              </button>
            </div>
          </div>

          {languageStats.length === 0 ? (
            <div className="text-center text-slate-400">
              <p>Chưa có dữ liệu</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                {chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={languageStats as Array<{ language: string; count: number }>}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="language"
                    >
                      {languageStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                ) : (
                  <BarChart data={languageStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="language"
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
              <div className="mt-4 text-center text-sm text-slate-400">
                Tổng: <span className="font-semibold text-white">{totalLanguages}</span> bảng dịch
              </div>
            </>
          )}
        </div>
      )}

      {/* Project Stats */}
      {showProjectStats && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
          <div className="mb-6 flex items-center gap-2">
            <Folder className="h-5 w-5 text-sky-400" />
            <h3 className="text-lg font-semibold text-white">Theo dự án</h3>
          </div>

          {projectStats.length === 0 ? (
            <div className="text-center text-slate-400">
              <p>Chưa có dữ liệu</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projectStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis
                    dataKey="projectName"
                    type="category"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center text-sm text-slate-400">
                Tổng: <span className="font-semibold text-white">{totalProjects}</span> bảng dịch
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

