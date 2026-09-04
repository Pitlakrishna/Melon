import Link from 'next/link';

export default function Home() {
  return (
    <main
      className="flex-1 flex flex-col items-center justify-center min-h-screen p-6 relative transition-colors duration-300"
      style={{
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="text-center max-w-xl mx-auto space-y-6">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border"
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--text-accent)',
            borderColor: 'var(--accent-subtle-border)',
          }}
        >
          <span>✨</span> Multi-Theme System Active
        </div>

        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent"
          style={{ backgroundImage: 'var(--accent-gradient)' }}
        >
          Category Management Portal
        </h1>

        <p
          className="text-base sm:text-lg"
          style={{ color: 'var(--text-secondary)' }}
        >
          Manage product classifications and categories with seamless dynamic themes.
        </p>

        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <Link
            href="/category"
            className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg cursor-pointer text-white flex items-center gap-2"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: '0 8px 24px var(--accent-glow)',
            }}
          >
            <span>📁</span>
            Go To Categories
          </Link>
        </div>
      </div>
    </main>
  );
}
