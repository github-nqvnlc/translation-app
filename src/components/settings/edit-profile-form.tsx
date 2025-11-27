'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Save, Upload, Loader2 } from 'lucide-react';
import { AvatarCropper } from './avatar-cropper';

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  privacySettings: {
    showEmail: boolean;
    showProjects: boolean;
    showTranslationTables: boolean;
    showPoFiles: boolean;
    showEntriesCount: boolean;
    showActivityChart: boolean;
    showLanguageStats: boolean;
    showProjectStats: boolean;
    showRecentActivity: boolean;
    showPosts: boolean;
    showAvatarLikes: boolean;
    allowAvatarComments: boolean;
  };
}

export default function EditProfileForm() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    privacySettings: {
      showEmail: false,
      showProjects: true,
      showTranslationTables: true,
      showPoFiles: true,
      showEntriesCount: true,
      showActivityChart: true,
      showLanguageStats: true,
      showProjectStats: true,
      showRecentActivity: true,
      showPosts: true,
      showAvatarLikes: true,
      allowAvatarComments: true,
    },
  });
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/profile');
      const result = await response.json();

      if (response.ok && result.data) {
        setProfileData(result.data);
        setFormData({
          name: result.data.name || '',
          bio: result.data.bio || '',
          privacySettings: result.data.privacySettings,
        });
        setAvatarPreview(result.data.image);
      } else {
        toast.error(result.error || 'Không thể tải thông tin profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Có lỗi xảy ra khi tải thông tin profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Show cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setCropImageSrc(null);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedBlob);

    // Upload
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', croppedBlob, 'avatar.jpg');

      const response = await fetch('/api/settings/profile/avatar', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Cập nhật avatar thành công');
        // Update profile data
        if (profileData) {
          setProfileData({ ...profileData, image: result.imageUrl });
        }
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Có lỗi xảy ra khi upload avatar');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropImageSrc(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          privacySettings: formData.privacySettings,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Cập nhật profile thành công');
        // Redirect to profile page after 1 second
        setTimeout(() => {
          if (profileData) {
            router.push(`/users/${profileData.id}`);
          }
        }, 1000);
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi cập nhật profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Có lỗi xảy ra khi cập nhật profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 p-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-sky-500" />
          <p className="text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Avatar Cropper Modal */}
    {showCropper && cropImageSrc && (
      <AvatarCropper
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    )}
    
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Thông tin cá nhân */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
        <h2 className="mb-6 text-xl font-semibold text-white">Thông tin cá nhân</h2>

        <div className="space-y-6">
          {/* Avatar */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-white/20 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-30 w-30 items-center justify-center rounded-full border-4 border-white/20 bg-slate-800 text-3xl font-semibold text-sky-400">
                    {formData.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900/70"
                >
                  <Upload className="h-4 w-4" />
                  Chọn ảnh
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  JPG, PNG hoặc WEBP. Tối đa 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
              Tên
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="Nhập tên của bạn"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="mb-2 block text-sm font-medium text-slate-300">
              Giới thiệu
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              maxLength={500}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="Giới thiệu về bản thân..."
            />
            <p className="mt-1 text-xs text-slate-400">
              {formData.bio.length}/500 ký tự
            </p>
          </div>
        </div>
      </div>

      {/* Quyền riêng tư */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
        <h2 className="mb-6 text-xl font-semibold text-white">Quyền riêng tư</h2>
        <p className="mb-6 text-sm text-slate-400">
          Chọn thông tin nào bạn muốn hiển thị trên profile công khai
        </p>

        <div className="space-y-4">
          {[
            { key: 'showEmail', label: 'Hiển thị email' },
            { key: 'showProjects', label: 'Hiển thị số dự án' },
            { key: 'showTranslationTables', label: 'Hiển thị số bảng dịch' },
            { key: 'showPoFiles', label: 'Hiển thị số tệp PO' },
            { key: 'showEntriesCount', label: 'Hiển thị số bản dịch' },
            { key: 'showActivityChart', label: 'Hiển thị biểu đồ hoạt động' },
            { key: 'showLanguageStats', label: 'Hiển thị thống kê ngôn ngữ' },
            { key: 'showProjectStats', label: 'Hiển thị thống kê dự án' },
            { key: 'showRecentActivity', label: 'Hiển thị hoạt động gần đây' },
            { key: 'showPosts', label: 'Hiển thị bài viết' },
            { key: 'showAvatarLikes', label: 'Hiển thị số lượt thích avatar' },
            { key: 'allowAvatarComments', label: 'Cho phép bình luận trên avatar' },
          ].map((setting) => (
            <label
              key={setting.key}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/30 p-4 transition hover:bg-slate-900/50"
            >
              <span className="text-sm text-slate-300">{setting.label}</span>
              <input
                type="checkbox"
                checked={formData.privacySettings[setting.key as keyof typeof formData.privacySettings]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    privacySettings: {
                      ...formData.privacySettings,
                      [setting.key]: e.target.checked,
                    },
                  })
                }
                className="h-5 w-5 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-white transition hover:bg-sky-600 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Lưu thay đổi
            </>
          )}
        </button>
      </div>
    </form>
    </>
  );
}

