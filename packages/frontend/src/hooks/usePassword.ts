import { useEffect, useState } from "react";
import { setAiPassword } from "../lib/api";
import { APP_PREFIX } from "../lib/constants";

export function usePassword() {
  const [password, setPassword] = useState<string>(
    () => sessionStorage.getItem(`${APP_PREFIX}:ai_password`) ?? ""
  );

  useEffect(() => {
    setAiPassword(password);
    if (password) {
      sessionStorage.setItem(`${APP_PREFIX}:ai_password`, password);
    } else {
      sessionStorage.removeItem(`${APP_PREFIX}:ai_password`);
    }
  }, [password]);

  return { password, setPassword };
}
