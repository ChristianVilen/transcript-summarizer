import type { HealthResponse } from "@gosta-assignemnt/shared";

interface Props {
  password: string;
  onPasswordChange: (value: string) => void;
  health: HealthResponse | null;
}

export const AppHeader = ({ password, onPasswordChange, health }: Props) => (
  <header className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
    <h1 className="text-xl font-semibold">Transcript Summarizer</h1>
    <div className="flex items-center gap-4">
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
  </header>
);
