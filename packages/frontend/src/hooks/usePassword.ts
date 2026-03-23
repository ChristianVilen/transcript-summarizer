import { useEffect, useState } from "react";
import { setAiPassword } from "../lib/api";

export function usePassword() {
  const [password, setPassword] = useState<string>(
    () => sessionStorage.getItem("ai_password") ?? ""
  );

  useEffect(() => {
    setAiPassword(password);
    if (password) {
      sessionStorage.setItem("ai_password", password);
    } else {
      sessionStorage.removeItem("ai_password");
    }
  }, [password]);

  return { password, setPassword };
}
