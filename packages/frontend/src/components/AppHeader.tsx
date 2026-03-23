import type { HealthResponse } from "@gosta-assignemnt/shared";

interface Props {
  password: string;
  onPasswordChange: (value: string) => void;
  health: HealthResponse | null;
  onMenuOpen: () => void;
}

export const AppHeader = ({ password, onPasswordChange, health, onMenuOpen }: Props) => (
  <header className="border-b border-border px-4 py-3 md:px-6 md:py-4 shrink-0">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          aria-label="Open menu"
          className="md:hidden p-1 -ml-1 text-text-muted hover:text-text transition-colors"
        >
          <MenuIcon />
        </button>
        <h1 className="text-xl font-semibold">Transcript Summarizer</h1>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <input
          type="password"
          placeholder="AI Password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="px-3 py-1 text-sm rounded border border-border bg-bg-secondary text-text placeholder-text-muted"
        />
        {health && (
          <span className={`text-xs ${health.status === "ok" ? "text-secondary" : "text-error"}`}>
            Backend health: {health.status}
          </span>
        )}
      </div>
    </div>

    <div className="md:hidden mt-2">
      <input
        type="password"
        placeholder="AI Password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        className="w-full px-3 py-1.5 text-sm rounded border border-border bg-bg-secondary text-text placeholder-text-muted"
      />
    </div>
  </header>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
