import { MenuIcon, MoonIcon, SunIcon } from "./icons";

interface Props {
  password: string;
  onPasswordChange: (value: string) => void;
  onMenuOpen: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

export const Header = ({
  password,
  onPasswordChange,
  onMenuOpen,
  theme,
  onThemeToggle,
}: Props) => (
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

      <div className="flex items-center gap-3">
        <label htmlFor="ai-password" className="sr-only">AI Password</label>
        <input
          id="ai-password"
          name="ai-password"
          type="password"
          placeholder="AI Password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="px-2 py-1 text-xs md:text-sm md:px-3 rounded-md border border-border bg-surface-raised text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none transition-colors w-24 md:w-auto"
        />
        <button
          onClick={onThemeToggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </div>
  </header>
);
