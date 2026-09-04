'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '@/context/ThemeContext';
import { IoColorPaletteOutline } from 'react-icons/io5';
import { FiCheck } from 'react-icons/fi';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border shadow-sm"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        title="Change Theme"
      > 
        <IoColorPaletteOutline className="text-base" style={{ color: 'var(--text-secondary)' }} />
        <span className="hidden sm:inline text-xs font-semibold">{activeTheme.name}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 border"
          style={{
            background: 'var(--bg-modal)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), 0 0 20px var(--accent-glow)',
          }}
        >
          <div
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-b mb-1 flex items-center justify-between"
            style={{
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <span>Themes</span>
            <span className="text-[10px] font-normal lowercase">{activeTheme.mode} mode</span>
          </div>

          <div className="space-y-1">
            {THEMES.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left"
                  style={{
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--text-accent)' : 'var(--text-primary)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{t.emoji}</span>
                    <span>{t.name}</span>
                  </div>
                  {isSelected && <FiCheck className="text-sm font-bold" style={{ color: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
