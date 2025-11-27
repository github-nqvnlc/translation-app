'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Clock, FileText, Folder, User } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
}

interface RecentActivityProps {
  userId: string;
  showActivity?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Đã tạo',
  updated: 'Đã cập nhật',
  deleted: 'Đã xóa',
  uploaded: 'Đã tải lên',
  translated: 'Đã dịch',
};

const RESOURCE_ICONS: Record<string, typeof FileText> = {
  project: Folder,
  translation_table: FileText,
  po_file: FileText,
  entry: FileText,
  user: User,
};

function getResourceLink(resourceType: string, resourceId: string | null): string | null {
  if (!resourceId) return null;

  switch (resourceType) {
    case 'project':
      return `/projects/${resourceId}`;
    case 'translation_table':
      return `/translations/${resourceId}`;
    case 'po_file':
      return `/files/${resourceId}`;
    default:
      return null;
  }
}

export function RecentActivity({ userId, showActivity = true }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      const result = await response.json();

      if (response.ok && result.data?.recentActivity) {
        setActivities(result.data.recentActivity);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!showActivity) return;
    loadData();
  }, [showActivity, loadData]);

  if (!showActivity) {
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

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
        <div className="text-center text-slate-400">
          <Clock className="mx-auto mb-2 h-12 w-12 opacity-50" />
          <p>Chưa có hoạt động gần đây</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
      <div className="mb-6 flex items-center gap-2">
        <Clock className="h-5 w-5 text-sky-400" />
        <h3 className="text-lg font-semibold text-white">Hoạt động gần đây</h3>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = RESOURCE_ICONS[activity.resourceType] || FileText;
          const actionLabel = ACTION_LABELS[activity.action] || activity.action;
          const resourceLink = getResourceLink(activity.resourceType, activity.resourceId);
          const timeAgo = new Date(activity.createdAt).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          const content = (
            <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900/30 p-4 transition hover:bg-slate-900/50">
              <div className="flex-shrink-0 rounded-lg bg-sky-500/20 p-2">
                <Icon className="h-4 w-4 text-sky-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {actionLabel} {activity.resourceType.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>
          );

          if (resourceLink) {
            return (
              <Link key={activity.id} href={resourceLink}>
                {content}
              </Link>
            );
          }

          return <div key={activity.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}

