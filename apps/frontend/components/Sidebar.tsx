'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TbCategoryPlus } from "react-icons/tb";
import { CiUser } from "react-icons/ci";
import { IoBagHandleOutline } from "react-icons/io5";
import { MdOutlineTaskAlt } from "react-icons/md";
export default function Sidebar() {
  const pathname = usePathname();

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

      {/* Theme Switcher & Home link */}
      <div
        className="p-4 border-t space-y-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >

        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>🏠</span>
          Home
        </Link>
      </div>
    </aside>
  );
}
