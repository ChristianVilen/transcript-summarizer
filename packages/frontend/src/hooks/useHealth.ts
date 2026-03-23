import { useEffect, useState } from "react";
import type { HealthResponse } from "@gosta-assignemnt/shared";
import { api } from "../lib/api";

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    api.get<HealthResponse>("/api/health").then(setHealth).catch(() => null);
  }, []);

  return health;
}
