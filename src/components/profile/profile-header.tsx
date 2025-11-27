'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Settings, Calendar, Mail, Heart } from 'lucide-react';
import { AvatarViewer } from './avatar-viewer';

interface ProfileHeaderProps {
  userId: string;
  name: string | null;
  email?: string;
  image: string | null;
  bio: string | null;
  createdAt: string;
  isOwner: boolean;
  currentUserId: string;
  showEmail: boolean;
  showAvatarLikes?: boolean;
  allowAvatarComments?: boolean;
}

export function ProfileHeader({
  userId,
  name,
  email,
  image,
  bio,
  createdAt,
  isOwner,
  currentUserId,
  showEmail,
  showAvatarLikes = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allowAvatarComments = true,
}: ProfileHeaderProps) {
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [avatarLikesCount, setAvatarLikesCount] = useState<number | null>(null);

  // Fetch initial likes count
  useState(() => {
    if (showAvatarLikes) {
      fetch(`/api/users/${userId}/avatar/likes`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.likesCount !== undefined) {
            setAvatarLikesCount(data.data.likesCount);
          }
        })
        .catch(console.error);
    }
  });

  const displayName = name || 'Người dùng';
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <>
      {showAvatarViewer && (
        <AvatarViewer
          userId={userId}
          userName={displayName}
          avatarUrl={image}
          isOwner={isOwner}
          currentUserId={currentUserId}
          onClose={() => setShowAvatarViewer(false)}
        />
      )}

      <div className="mb-8 rounded-2xl border border-white/10 bg-slate-950/40 p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowAvatarViewer(true)}
              className="group relative block rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              title="Xem avatar"
            >
              {image ? (
                <Image
                  src={image}
                  alt={displayName}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-white/20 transition group-hover:border-sky-500/50"
                  unoptimized
                />
              ) : (
                <div className="flex h-30 w-30 items-center justify-center rounded-full border-4 border-white/20 bg-slate-800 text-3xl font-semibold text-sky-400 transition group-hover:border-sky-500/50">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                <span className="text-sm font-medium text-white">Xem ảnh</span>
              </div>
            </button>
            {showAvatarLikes && avatarLikesCount !== null && avatarLikesCount > 0 && (
              <div className="mt-2 flex items-center justify-center gap-1 text-sm text-slate-400">
                <Heart className="h-4 w-4 text-red-400" />
                <span>{avatarLikesCount}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{displayName}</h1>
                {email && showEmail && (
                  <div className="mt-2 flex items-center gap-2 text-slate-400">
                    <Mail className="h-4 w-4" />
                    <span>{email}</span>
                  </div>
                )}
              </div>
              {isOwner && (
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-white transition hover:bg-sky-600"
                >
                  <Settings className="h-4 w-4" />
                  <span>Chỉnh sửa hồ sơ</span>
                </Link>
              )}
            </div>

            {bio && <p className="mb-4 text-slate-300">{bio}</p>}

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>
                Tham gia từ{' '}
                {new Date(createdAt).toLocaleDateString('vi-VN', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

