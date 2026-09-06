import Sidebar from '../../components/Sidebar';
import AuthGuard from '../../components/AuthGuard';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div
        className="flex min-h-screen transition-colors duration-300"
        style={{ background: 'var(--bg-page)' }}
      >
        {/* Shared Sidebar */}
        <Sidebar />

        {/* Main content body */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
