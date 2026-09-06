'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TbCategoryPlus } from "react-icons/tb";
import { CiUser } from "react-icons/ci";
import { IoBagHandleOutline } from "react-icons/io5";
import { MdOutlineTaskAlt } from "react-icons/md";
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out.');
    router.push('/login');
  };

  const navItems = [
    { name: 'Categories', href: '/category', icon: <TbCategoryPlus size={17} /> },
    { name: 'Buyer', href: '/buyer', icon: <CiUser size={17} /> },
    { name: 'Order History', href: '/history', icon: <IoBagHandleOutline size={17} /> },
    { name: 'Tasks', href: '/tasks', icon: <MdOutlineTaskAlt size={17} /> },
  ];

  return (
    <aside
      className="w-64 flex flex-col h-screen sticky top-0 transition-colors duration-300 border-r"
      style={{
        background: 'var(--bg-sidebar)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Brand Header */}
      <div
        className="p-6 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <h2
          className="text-xl font-bold tracking-tight bg-clip-text text-transparent"
          style={{ backgroundImage: 'var(--accent-gradient)' }}
        >
          Category Portal
        </h2>
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Management System
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border"
              style={{
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                borderColor: isActive ? 'var(--accent-subtle-border)' : 'transparent',
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Actions */}
      <div
        className="p-4 border-t space-y-2.5"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {user && (
          <div
            className="flex items-center gap-3 p-2.5 rounded-xl border"
            style={{
              background: 'var(--accent-subtle)',
              borderColor: 'var(--accent-subtle-border)',
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
              style={{ backgroundImage: 'var(--accent-gradient)' }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-semibold truncate"
                style={{ color: 'var(--text-primary)' }}
                title={user.name}
              >
                {user.name}
              </div>
              <div
                className="text-[11px] truncate opacity-75"
                style={{ color: 'var(--text-secondary)' }}
                title={user.email}
              >
                {user.email}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Link
            href="/"
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>🏠</span>
            Home
          </Link>

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-90 cursor-pointer border"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.25)',
              }}
              title="Log out of session"
            >
              <LogOut size={13} />
              Logout
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
