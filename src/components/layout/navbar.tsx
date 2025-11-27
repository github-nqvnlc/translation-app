'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  X,
  Folder,
  FileText,
  Languages,
  Shield,
  Home,
  BookOpen,
  User,
  Mail,
} from 'lucide-react';

interface UserSession {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  systemRole: string | null;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  useEffect(() => {
    loadSession();
    
    // Listen for auth changes (login/logout)
    const handleAuthChange = () => loadSession();
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, []);

  const loadSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const result = await response.json();
      if (response.ok && result.success) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const workspaceLinks = [
    { href: '/projects', label: 'Dự án', icon: Folder },
    // Removed: /files, /upload, /translations - now managed within projects
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const isWorkspaceActive = workspaceLinks.some((link) => isActive(link.href));

  if (isLoading) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <Languages className="size-5 text-sky-400" />
          <span className="hidden sm:inline">Translation</span>
        </Link>

        {/* Right side - Nav + User */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
              isActive('/') && pathname === '/'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="size-4" />
            Home
          </Link>

          {/* Workspace Dropdown - only show if logged in */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                  isWorkspaceActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Folder className="size-4" />
                Workspace
                <ChevronDown className={`size-3 transition ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
              </button>

              {showWorkspaceMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowWorkspaceMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-white/10 bg-slate-900 p-1 shadow-xl z-20">
                    {workspaceLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setShowWorkspaceMenu(false)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                            isActive(link.href)
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <Icon className="size-4" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          <Link
            href="/docs"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
              isActive('/docs')
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="size-4" />
            Docs
          </Link>

          <Link
            href="/about"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
              isActive('/about')
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="size-4" />
            About
          </Link>

          {/* Divider */}
          <div className="mx-2 h-5 w-px bg-white/10" />

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500/20 to-purple-500/20 p-0.5 transition hover:from-sky-500/30 hover:to-purple-500/30"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-sky-400">
                  {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-slate-900 p-1 shadow-xl z-20">
                    <div className="border-b border-white/10 px-3 py-2">
                      <p className="truncate text-sm font-medium text-white">
                        {user.name || 'Chưa đặt tên'}
                      </p>
                      <p className="truncate text-xs text-slate-400">{user.email}</p>
                      {user.systemRole && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                          <Shield className="size-3" />
                          {user.systemRole}
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings/sessions"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      >
                        <Settings className="size-4" />
                        Phiên đăng nhập
                      </Link>

                      {user.systemRole === 'ADMIN' && (
                        <>
                          <Link
                            href="/admin/users"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                          >
                            <Shield className="size-4" />
                            Quản lý Users
                          </Link>
                          <Link
                            href="/admin/audit-logs"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                          >
                            <FileText className="size-4" />
                            Audit Logs
                          </Link>
                          <Link
                            href="/admin/test"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10 hover:text-amber-200"
                          >
                            <Mail className="size-4" />
                            🧪 Test Panel
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                      >
                        <LogOut className="size-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-sky-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-400"
            >
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
        >
          {showMobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="border-t border-white/10 bg-slate-950 md:hidden">
          <div className="space-y-1 p-2">
            <Link
              href="/"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                pathname === '/' ? 'bg-white/10 text-white' : 'text-slate-300'
              }`}
            >
              <Home className="size-4" />
              Home
            </Link>

            {user && (
              <>
                <div className="px-3 py-1 text-xs font-medium uppercase text-slate-500">
                  Workspace
                </div>
                {workspaceLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 pl-6 text-sm ${
                        isActive(link.href)
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'text-slate-300'
                      }`}
                    >
                      <Icon className="size-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </>
            )}

            <Link
              href="/docs"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                isActive('/docs') ? 'bg-white/10 text-white' : 'text-slate-300'
              }`}
            >
              <BookOpen className="size-4" />
              Docs
            </Link>

            <Link
              href="/about"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                isActive('/about') ? 'bg-white/10 text-white' : 'text-slate-300'
              }`}
            >
              <User className="size-4" />
              About
            </Link>

            {user && (
              <div className="border-t border-white/10 pt-2 mt-2">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
