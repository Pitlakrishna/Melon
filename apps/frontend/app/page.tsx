'use client';

import React from 'react';
import Link from 'next/link';
import QuantumSwarm from '@/components/ui/quantum-swarm';

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden flex flex-col justify-center">
      {/* QuantumSwarm as the full-page background with home page text */}
      <QuantumSwarm className="min-h-screen w-full rounded-none border-none shadow-none bg-transparent">
        <div className="text-center max-w-xl mx-auto space-y-6 pointer-events-auto p-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md"
            style={{
              background: 'var(--accent-subtle)',
              color: 'var(--text-accent)',
              borderColor: 'var(--accent-subtle-border)',
            }}
          >
            <span>✨</span> Multi-Theme System Active
          </div>

          <h1
            className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent drop-shadow-sm"
            style={{ backgroundImage: 'var(--accent-gradient)' }}
          >
            Category Management Portal
          </h1>

          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Manage product classifications and categories with seamless dynamic themes.
          </p>

          <div className="flex flex-wrap gap-4 justify-center items-center pt-2">
            <Link
              href="/history"
              className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg cursor-pointer text-white inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--accent-gradient)',
                boxShadow: '0 8px 24px var(--accent-glow)',
              }}
            >
              <span>📜</span>
              Order History
            </Link>
            <Link
              href="/buyer"
              className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer inline-flex items-center gap-2 border hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span>👤</span>
              Buyers
            </Link>
            <Link
              href="/category"
              className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer inline-flex items-center gap-2 border hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span>📁</span>
              Categories
            </Link>
            <Link
              href="/tasks"
              className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer inline-flex items-center gap-2 border hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span>📋</span>
              Tasks
            </Link>
          </div>
        </div>
      </QuantumSwarm>
    </main>
  );
}
