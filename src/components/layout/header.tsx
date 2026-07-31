import { LogOut } from "lucide-react";
import { authStore } from "@/lib/auth-store";

export function Header() {
  const user = authStore.getUser();

  function onLogout() {
    authStore.clear();
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-6 lg:px-8">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Venue Spice Admin</h1>
          <p className="text-sm text-slate-500">Manage organizations, events, ticket sales, referrals, and payments.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-primary-20 bg-white px-4 py-2 text-right">
            <p className="text-sm font-medium text-slate-900">{user?.fullName ?? "Signed in user"}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{user?.role ?? "unknown"}</p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
