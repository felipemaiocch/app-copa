import Image from "next/image";
import { AlertTriangle, Database, RefreshCw } from "lucide-react";

function friendlyMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("DATABASE_URL is not configured")) {
    return "A variavel DATABASE_URL nao esta configurada no ambiente Production da Vercel.";
  }

  if (message.includes("without the psql command")) {
    return "A DATABASE_URL foi colada com o comando psql. Na Vercel, use apenas a URL que comeca com postgresql://.";
  }

  if (message.includes("wrapping quotes")) {
    return "A DATABASE_URL foi salva com aspas no comeco/fim. Remova as aspas na Vercel.";
  }

  if (message.toLowerCase().includes("password authentication failed")) {
    return "O Neon recusou a senha da DATABASE_URL. Confira usuario, senha e se a senha foi rotacionada.";
  }

  if (message.toLowerCase().includes("getaddrinfo") || message.toLowerCase().includes("enotfound")) {
    return "A Vercel nao conseguiu encontrar o host do Neon. Confira se a URL foi colada inteira.";
  }

  return "O servidor nao conseguiu conectar ou preparar o banco Neon. Confira os logs do deployment na Vercel.";
}

export function SetupError({ error }: { error: unknown }) {
  const message = friendlyMessage(error);

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-8 text-[#171925] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center">
        <div className="w-full rounded-[28px] border border-[#f2c7c7] bg-white p-6 shadow-[0_18px_70px_rgba(29,35,73,0.10)] sm:p-8">
          <Image
            src="https://static.wixstatic.com/media/613e90_f01ff1f2d28d45cf9a7aa059568f7313~mv2.png/v1/fill/w_460,h_92,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo-DRnovo_edited.png"
            alt="DR Monitora"
            width={460}
            height={92}
            priority
            className="mb-7 h-auto w-52"
          />

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h1 className="text-3xl font-black">Configuracao pendente na Vercel</h1>
          <p className="mt-3 text-base leading-7 text-[#62677f]">{message}</p>

          <div className="mt-6 grid gap-3 rounded-2xl bg-[#f7f8fc] p-4 text-sm font-semibold text-[#3a3d4f]">
            <p className="flex gap-3">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-[#3857e8]" />
              Em Settings &gt; Environment Variables, crie ou corrija a variavel
              <span className="font-black text-[#171925]">DATABASE_URL</span>.
            </p>
            <p className="flex gap-3">
              <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-[#3857e8]" />
              Depois de salvar a env, faca Redeploy. Alterar env nao muda um deployment ja publicado.
            </p>
          </div>

          <p className="mt-5 rounded-2xl border border-[#dfe3f2] p-4 text-sm font-semibold leading-6 text-[#62677f]">
            Formato correto: <span className="font-mono text-[#171925]">postgresql://usuario:senha@host/neondb?sslmode=require</span>
            <br />
            Nao use <span className="font-mono text-[#171925]">psql</span> antes da URL e nao use aspas.
          </p>
        </div>
      </section>
    </main>
  );
}
