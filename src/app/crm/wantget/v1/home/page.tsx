import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { Topbar } from "@/components/topbar";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/crm/wantget/v1/sign-in");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Topbar />

      <div className="flex flex-1 items-center justify-center bg-slate-50 px-8 py-12">
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <div>
            <p className="text-xs font-medium tracking-widest text-muted-foreground">
              PLATAFORMA CRM
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Bienvenido, {session.user.name || session.user.email}
            </h1>
          </div>

          <Image
            src="/visual/visual.png"
            alt=""
            width={1264}
            height={842}
            className="h-auto w-full max-w-xs md:max-w-sm"
            priority
          />
        </div>
      </div>
    </div>
  );
}
