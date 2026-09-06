'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, LogIn, UserPlus, LogOut, ShieldCheck } from 'lucide-react';
import QuantumSwarm from '@/components/ui/quantum-swarm';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <main className="relative min-h-screen w-full overflow-hidden flex flex-col justify-center">
      {/* Top Bar for Auth Status */}
      <div className="absolute top-4 right-6 z-20 flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium px-3 py-1.5 rounded-full border backdrop-blur-md hidden sm:inline-block"
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--text-primary)',
                borderColor: 'var(--accent-subtle-border)',
              }}
            >
              Hi, <strong style={{ color: 'var(--text-accent)' }}>{user.name}</strong>
            </span>
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border flex items-center gap-1.5"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.25)',
              }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border backdrop-blur-md hover:scale-[1.02] flex items-center gap-1.5"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <LogIn size={13} />
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-[1.02] flex items-center gap-1.5 text-white"
              style={{
                backgroundImage: 'var(--accent-gradient)',
              }}
            >
              <UserPlus size={13} />
              Register
            </Link>
          </div>
        )}
      </div>

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
            Manage product classifications, buyers, orders, and operational tasks with seamless themes.
          </p>

          <div className="flex flex-wrap gap-4 justify-center items-center pt-2">
            {isAuthenticated ? (
              <Link
                href="/category"
                className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer inline-flex items-center gap-2 border hover:scale-[1.02] active:scale-[0.98] text-white"
                style={{
                  backgroundImage: 'var(--accent-gradient)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login?redirect=/category"
                  className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer inline-flex items-center gap-2 border hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <ShieldCheck size={16} style={{ color: 'var(--text-accent)' }} />
                  Access Dashboard
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer inline-flex items-center gap-2 text-white hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundImage: 'var(--accent-gradient)',
                  }}
                >
                  <UserPlus size={16} />
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </QuantumSwarm>
    </main>
  );
}
