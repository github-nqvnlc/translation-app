'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Heart, Send, Trash2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AvatarComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface AvatarViewerProps {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  isOwner: boolean;
  currentUserId: string;
  onClose: () => void;
}

export function AvatarViewer({
  userId,
  userName,
  avatarUrl,
  isOwner,
  currentUserId,
  onClose,
}: AvatarViewerProps) {
  const [likesCount, setLikesCount] = useState<number | null>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [showLikes, setShowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [comments, setComments] = useState<AvatarComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const fetchLikes = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/avatar/likes`);
      if (res.ok) {
        const data = await res.json();
        setLikesCount(data.data.likesCount);
        setUserLiked(data.data.userLiked);
        setShowLikes(data.data.showLikes);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  }, [userId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/avatar/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.data.comments);
        setAllowComments(data.data.allowComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [userId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchLikes(), fetchComments()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchLikes, fetchComments]);

  const handleLike = async () => {
    if (isOwner || isLiking) return;

    setIsLiking(true);
    try {
      const method = userLiked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${userId}/avatar/likes`, { method });
      if (res.ok) {
        const data = await res.json();
        setLikesCount(data.likesCount);
        setUserLiked(data.userLiked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const res = await fetch(`/api/users/${userId}/avatar/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments([data.data, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/avatar-comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Avatar Image */}
        <div className="flex flex-1 items-center justify-center bg-black p-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userName}
              width={500}
              height={500}
              className="max-h-[500px] w-auto rounded-lg object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-[300px] w-[300px] items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600">
              <span className="text-8xl font-bold text-white">
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex w-full flex-col border-t border-white/10 md:w-80 md:border-l md:border-t-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h3 className="font-semibold text-white">{userName}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Likes */}
          {showLikes && (
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              <button
                onClick={handleLike}
                disabled={isOwner || isLiking}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  userLiked
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                } ${isOwner ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <Heart
                  className={`h-5 w-5 ${userLiked ? 'fill-current' : ''}`}
                />
                {userLiked ? 'Đã thích' : 'Thích'}
              </button>
              {likesCount !== null && (
                <span className="text-sm text-slate-400">
                  {likesCount} lượt thích
                </span>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {allowComments ? (
              <>
                {/* Comment List */}
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Chưa có bình luận nào
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="group flex gap-3">
                          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-slate-700">
                            {comment.author.image ? (
                              <Image
                                src={comment.author.image}
                                alt={comment.author.name || ''}
                                width={32}
                                height={32}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <User className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-sm font-medium text-white">
                                  {comment.author.name || 'Ẩn danh'}
                                </span>
                                <span className="ml-2 text-xs text-slate-500">
                                  {formatDistanceToNow(
                                    new Date(comment.createdAt),
                                    { addSuffix: true, locale: vi }
                                  )}
                                </span>
                              </div>
                              {(comment.author.id === currentUserId ||
                                isOwner) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="rounded p-1 text-slate-500 opacity-0 transition hover:bg-white/10 hover:text-red-400 group-hover:opacity-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-300">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <form
                  onSubmit={handleComment}
                  className="border-t border-white/10 p-4"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Viết bình luận..."
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isCommenting}
                      className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-4">
                <p className="text-sm text-slate-500">
                  Người dùng đã tắt bình luận
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

