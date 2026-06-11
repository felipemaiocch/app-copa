import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Download, Filter, Medal, Trophy, Users } from "lucide-react";
import { saveResult } from "@/app/actions";
import { SetupError } from "@/components/setup-error";
import { getDailyWinners, getMatches, getRanking, type WinnerFilters } from "@/lib/data";
import { departments } from "@/lib/departments";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(new Date(`${value}T12:00:00`));
}

function asStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildWinnerFilters(searchParams?: Record<string, string | string[] | undefined>): WinnerFilters {
  return {
    dateFrom: asStringParam(searchParams?.dateFrom) || undefined,
    dateTo: asStringParam(searchParams?.dateTo) || undefined,
    matchId: asStringParam(searchParams?.matchId) || undefined,
    department: asStringParam(searchParams?.department) || undefined,
  };
}

function buildPdfHref(filters: WinnerFilters) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.matchId) params.set("matchId", filters.matchId);
  if (filters.department) params.set("department", filters.department);

  const query = params.toString();
  return `/admin/acertadores.pdf${query ? `?${query}` : ""}`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  let matches;
  let ranking;
  let winners;
  let filters: WinnerFilters;

  try {
    filters = buildWinnerFilters(await searchParams);
    [matches, ranking, winners] = await Promise.all([getMatches(), getRanking(), getDailyWinners(filters)]);
  } catch (error) {
    return <SetupError error={error} />;
  }

  const pdfHref = buildPdfHref(filters);

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 text-[#171925] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[26px] bg-white p-5 shadow-[0_18px_70px_rgba(29,35,73,0.08)] sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-[#3857e8]">
              <ArrowLeft className="h-4 w-4" />
              Voltar para palpites
            </Link>
            <h1 className="text-3xl font-black sm:text-4xl">Painel do bolao</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62677f]">
              Lance resultados finais para calcular a pontuacao automaticamente e encontrar os acertadores de placar.
            </p>
          </div>
          <Image
            src="https://static.wixstatic.com/media/613e90_f01ff1f2d28d45cf9a7aa059568f7313~mv2.png/v1/fill/w_460,h_92,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo-DRnovo_edited.png"
            alt="DR Monitora"
            width={460}
            height={92}
            className="h-auto w-48"
          />
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<Trophy className="h-5 w-5" />} label="Jogos" value={matches.length} />
          <Stat icon={<Medal className="h-5 w-5" />} label="Participantes no ranking" value={ranking.length} />
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Acertos exatos" value={winners.length} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)]">
            <div className="mb-5">
              <h2 className="text-2xl font-black">Resultados dos jogos</h2>
              <p className="mt-1 text-sm text-[#62677f]">Preencha o placar final e salve. O status passa para finalizado.</p>
            </div>

            <div className="flex flex-col gap-3">
              {matches.map((match) => (
                <form
                  key={match.id}
                  action={saveResult}
                  className="grid gap-4 rounded-2xl border border-[#e1e5f2] bg-[#fbfcff] p-4 md:grid-cols-[1fr_auto]"
                >
                  <input type="hidden" name="matchId" value={match.id} />
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase text-[#62677f]">
                      <span>{formatDate(match.matchDate)}</span>
                      <span>{match.kickoffTime}</span>
                      <span>{match.groupName}</span>
                      {match.status === "finished" && (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">finalizado</span>
                      )}
                    </div>
                    <p className="truncate text-base font-black sm:text-lg">
                      {match.homeFlag} {match.homeTeam} x {match.awayTeam} {match.awayFlag}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      name="homeScore"
                      defaultValue={match.homeScore ?? 0}
                      required
                      className="h-11 w-14 rounded-2xl border border-[#d9deee] bg-white text-center text-lg font-black outline-none focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                    />
                    <span className="font-black text-[#62677f]">-</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      name="awayScore"
                      defaultValue={match.awayScore ?? 0}
                      required
                      className="h-11 w-14 rounded-2xl border border-[#d9deee] bg-white text-center text-lg font-black outline-none focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                    />
                    <button
                      type="submit"
                      className="h-11 rounded-2xl bg-[#3857e8] px-4 text-sm font-black text-white transition hover:bg-[#2745d9]"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#3857e8]">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Ranking geral</h2>
                  <p className="text-sm text-[#62677f]">Top 50 por pontuacao.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {ranking.length === 0 ? (
                  <p className="rounded-2xl bg-[#f5f7fc] p-4 text-sm font-semibold text-[#62677f]">Sem participantes ainda.</p>
                ) : (
                  ranking.map((row, index) => (
                    <div key={row.participantId} className="rounded-2xl bg-[#f5f7fc] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-black">
                          {index + 1}. {row.name}
                        </p>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#3857e8]">{row.points} pts</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-[#62677f]">
                        {row.department} · {row.exactHits} exatos · {row.winnerHits} vencedores
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">Acertadores para sorteio</h2>
                  <p className="mt-1 text-sm text-[#62677f]">Filtre por periodo, jogo ou departamento.</p>
                </div>
                <a
                  href={pdfHref}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#3857e8] px-3 text-sm font-black text-white transition hover:bg-[#2745d9]"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </a>
              </div>

              <form className="mb-4 grid gap-3 rounded-2xl border border-[#e1e5f2] bg-[#fbfcff] p-3">
                <div className="flex items-center gap-2 text-sm font-black text-[#3a3d4f]">
                  <Filter className="h-4 w-4 text-[#3857e8]" />
                  Filtros
                </div>
                <label className="flex flex-col gap-1 text-xs font-black uppercase text-[#62677f]">
                  De
                  <input
                    type="date"
                    name="dateFrom"
                    defaultValue={filters.dateFrom ?? ""}
                    className="h-10 rounded-2xl border border-[#d9deee] bg-white px-3 text-sm font-bold text-[#171925] outline-none focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-black uppercase text-[#62677f]">
                  Até
                  <input
                    type="date"
                    name="dateTo"
                    defaultValue={filters.dateTo ?? ""}
                    className="h-10 rounded-2xl border border-[#d9deee] bg-white px-3 text-sm font-bold text-[#171925] outline-none focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-black uppercase text-[#62677f]">
                  Jogo
                  <select
                    name="matchId"
                    defaultValue={filters.matchId ?? ""}
                    className="h-10 rounded-2xl border border-[#d9deee] bg-white px-3 text-sm font-bold text-[#171925] outline-none focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                  >
                    <option value="">Todos</option>
                    {matches.map((match) => (
                      <option key={match.id} value={match.id}>
                        {formatDate(match.matchDate)} · {match.homeTeam} x {match.awayTeam}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-black uppercase text-[#62677f]">
                  Departamento
                  <select
                    name="department"
                    defaultValue={filters.department ?? ""}
                    className="h-10 rounded-2xl border border-[#d9deee] bg-white px-3 text-sm font-bold text-[#171925] outline-none focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                  >
                    <option value="">Todos</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="submit"
                    className="h-10 rounded-2xl bg-[#171925] px-3 text-sm font-black text-white transition hover:bg-black"
                  >
                    Filtrar
                  </button>
                  <Link
                    href="/admin"
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d9deee] bg-white px-3 text-sm font-black text-[#3a3d4f] transition hover:bg-[#f5f7fc]"
                  >
                    Limpar
                  </Link>
                </div>
              </form>

              <div className="mt-4 flex flex-col gap-3">
                {winners.length === 0 ? (
                  <p className="rounded-2xl bg-[#f5f7fc] p-4 text-sm font-semibold text-[#62677f]">
                    Nenhum acertador encontrado para os filtros atuais.
                  </p>
                ) : (
                  winners.map((winner, index) => (
                    <div key={`${winner.matchId}-${winner.name}-${index}`} className="rounded-2xl bg-[#f5f7fc] p-3">
                      <p className="text-sm font-black">{winner.name}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#62677f]">
                        {winner.department} · {formatDate(winner.matchDate)} · {winner.matchLabel} · {winner.predictedScore}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)]">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#3857e8]">{icon}</div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm font-bold text-[#62677f]">{label}</p>
    </div>
  );
}
