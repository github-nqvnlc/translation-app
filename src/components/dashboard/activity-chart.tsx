'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';

interface ActivityData {
  date: string;
  translations: number;
  files: number;
  entries: number;
}

interface ActivityChartProps {
  userId: string;
  period?: 'day' | 'week' | 'month';
  showChart?: boolean;
}

export function ActivityChart({ userId, period = 'month', showChart = true }: ActivityChartProps) {
  const [data, setData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>(period);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/stats?period=${selectedPeriod}`);
      const result = await response.json();

      if (response.ok && result.data?.activityChart) {
        setData(result.data.activityChart);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, selectedPeriod]);

  useEffect(() => {
    if (!showChart) return;
    loadData();
  }, [showChart, loadData]);

  if (!showChart) {
    return null;
  }

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

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
        <div className="text-center text-slate-400">
          <Calendar className="mx-auto mb-2 h-12 w-12 opacity-50" />
          <p>Chưa có dữ liệu hoạt động</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-sky-400" />
          <h3 className="text-lg font-semibold text-white">Biểu đồ hoạt động</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-lg border border-white/10 bg-slate-900/50 p-1">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`rounded px-3 py-1 text-xs font-medium transition ${
                  selectedPeriod === p
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>
          {/* Chart type selector */}
          <div className="flex rounded-lg border border-white/10 bg-slate-900/50 p-1">
            <button
              onClick={() => setChartType('line')}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                chartType === 'line'
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đường
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
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => {
                if (selectedPeriod === 'month') {
                  return value;
                }
                return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
              }}
            />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Legend
              wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="translations"
              stroke="#0ea5e9"
              strokeWidth={2}
              name="Bảng dịch"
              dot={{ fill: '#0ea5e9', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="files"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Tệp PO"
              dot={{ fill: '#8b5cf6', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="entries"
              stroke="#10b981"
              strokeWidth={2}
              name="Bản dịch"
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => {
                if (selectedPeriod === 'month') {
                  return value;
                }
                return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
              }}
            />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Legend
              wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
            />
            <Bar dataKey="translations" fill="#0ea5e9" name="Bảng dịch" radius={[4, 4, 0, 0]} />
            <Bar dataKey="files" fill="#8b5cf6" name="Tệp PO" radius={[4, 4, 0, 0]} />
            <Bar dataKey="entries" fill="#10b981" name="Bản dịch" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

