/**
 * Girişli katman (Doc 27): kimlik middleware sınırında zorunlu tutulur ve
 * tüm veri uçları ayrıca JWT doğrular. Kabuk alt gruplarda —
 * (shell) = L2 sidebar'lı çalışma alanı · seans = L3 odak (kabuksuz).
 */
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tk-scope min-h-screen font-body">{children}</div>;
}
