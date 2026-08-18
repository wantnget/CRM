"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock, LogOutIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { SessionExpiredModal } from "@/components/session-expired-modal";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Topbar() {
  const { data: session, isPending } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);
  const router = useRouter();

  const expiresAtMs = session
    ? new Date(session.session.expiresAt).getTime()
    : null;

  useEffect(() => {
    if (!expiresAtMs) return;
    setRemaining(expiresAtMs - Date.now());
    const interval = setInterval(() => {
      const msLeft = expiresAtMs - Date.now();
      setRemaining(msLeft);
      if (msLeft <= 0) setExpired(true);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAtMs]);

  function goToSignIn() {
    signOut().finally(() => {
      router.push("/crm/wantget/v1/sign-in");
      router.refresh();
    });
  }

  return (
    <>
      <SessionExpiredModal open={expired} onSignIn={goToSignIn} />

      <header className="flex h-14 items-center justify-between border-b border-black/5 bg-[#0f2b46] px-5 text-white">
        <Image
          src="/logos/imagen.png"
          alt="WANT Tech 4 All"
          width={112}
          height={34}
          className="h-auto w-[112px] brightness-0 invert"
          priority
        />

        <div className="flex items-center gap-3">
          {expiresAtMs ? (
            <div className="flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/70">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>Periodo</span>
              <Clock className="size-3.5" />
              <span className="tabular-nums">
                {formatRemaining(remaining)}
              </span>
            </div>
          ) : null}

          {isPending || !session ? (
            <div className="size-8 animate-pulse rounded-full bg-white/10" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "size-8 rounded-full p-0 hover:bg-white/10 aria-expanded:bg-white/10 aria-expanded:text-white",
                    signingOut && "animate-pulse",
                  )}
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-white/10 text-white">
                      <User className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="flex flex-col gap-0.5 p-2 font-normal">
                  <span className="truncate font-medium">
                    {session.user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {session.user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="flex cursor-pointer items-center justify-between gap-2"
                  onClick={() =>
                    signOut({
                      fetchOptions: {
                        onRequest: () => setSigningOut(true),
                        onSuccess: () => {
                          setSigningOut(false);
                          router.push("/crm/wantget/v1/sign-in");
                          router.refresh();
                        },
                        onError: () => setSigningOut(false),
                      },
                    })
                  }
                >
                  <span>Cerrar sesión</span>
                  <LogOutIcon className="size-4" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
    </>
  );
}
