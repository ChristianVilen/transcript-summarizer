import { LANGUAGES } from "@gosta-assignemnt/shared";
import type { Tone } from "@gosta-assignemnt/shared";

const TONE_OPTIONS: { value: Tone; label: string; description: string }[] = [
  {
    value: "clinical",
    label: "Clinical",
    description: "Formal medical language, precise terminology.",
  },
  { value: "simple", label: "Simple", description: "Plain language, avoids medical jargon." },
  {
    value: "detailed",
    label: "Detailed",
    description: "Comprehensive, thorough and preserves all key findings.",
  },
  { value: "neutral", label: "Neutral", description: "Balanced, objective language." },
];

type Size = "md" | "sm";

const selectClass = (size: Size) =>
  `rounded-md border border-border bg-surface-raised text-text focus:border-primary focus:outline-none ${
    size === "md" ? "px-3 py-2 text-sm" : "px-2 py-1 text-xs"
  }`;

interface LanguageProps {
  value: string;
  onChange: (value: string) => void;
  size?: Size;
}

export const LanguageSelect = ({ value, onChange, size = "md" }: LanguageProps) => (
  <select
    id="language"
    name="language"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={selectClass(size)}
  >
    {LANGUAGES.map((l) => (
      <option key={l}>{l}</option>
    ))}
  </select>
);

interface ToneProps {
  value: Tone;
  onChange: (value: Tone) => void;
  size?: Size;
  showDescription?: boolean;
}

export const ToneSelect = ({
  value,
  onChange,
  size = "md",
  showDescription = false,
}: ToneProps) => (
  <select
    id="tone"
    name="tone"
    value={value}
    onChange={(e) => onChange(e.target.value as Tone)}
    className={selectClass(size)}
  >
    {TONE_OPTIONS.map((t) => (
      <option key={t.value} value={t.value}>
        {showDescription ? `${t.label} - ${t.description}` : t.label}
      </option>
    ))}
  </select>
);

interface StyleProps {
  value: "paragraph" | "bullets";
  onChange: (value: "paragraph" | "bullets") => void;
  size?: Size;
}

export const StyleSelect = ({ value, onChange, size = "md" }: StyleProps) => (
  <select
    id="style"
    name="style"
    value={value}
    onChange={(e) => onChange(e.target.value as "paragraph" | "bullets")}
    className={selectClass(size)}
  >
    <option value="paragraph">Paragraph</option>
    <option value="bullets">Bullets</option>
  </select>
);
