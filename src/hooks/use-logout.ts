"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function useLogout(redirectTo = "/crm/wantget/v1/sign-in") {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await authClient.signOut();
      router.push(redirectTo);
      router.refresh();
    });
  }

  return { logout, isPending };
}
