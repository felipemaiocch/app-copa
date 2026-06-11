"use client";

import { useActionState, useEffect, useMemo } from "react";
import Image from "next/image";
import { CalendarDays, CheckCircle2, Gift, Loader2, Medal, Sparkles, Trophy } from "lucide-react";
import { submitPredictions } from "@/app/actions";
import type { Match, Participant, Prediction, RankingRow } from "@/lib/data";

type ActionState = {
  ok: boolean;
  message: string;
  participantId?: string;
};

const initialActionState: ActionState = {
  ok: false,
  message: "",
};

const departments = [
  "DIRETORIA",
  "MARKETING",
  "COMERCIAL",
  "FINANCEIRO",
  "BACKOFFICE",
  "RECUPERAÇÃO",
  "TÉCNICA",
  "FACILITIES",
  "QUALIDADE",
  "SAC",
  "TI",
  "PIRAPORA",
  "ASSISTÊNCIA 24H",
  "RE",
  "JURÍDICO",
  "RETENTROCAS",
  "RA",
  "TÉCNICOS",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(new Date(`${value}T12:00:00`));
}

function groupMatches(matches: Match[]) {
  return matches.reduce<Record<string, Match[]>>((acc, match) => {
    acc[match.matchDate] ||= [];
    acc[match.matchDate].push(match);
    return acc;
  }, {});
}

export function PredictionApp({
  matches,
  initialParticipant,
  initialPredictions,
  ranking,
}: {
  matches: Match[];
  initialParticipant: Participant | null;
  initialPredictions: Prediction[];
  ranking: RankingRow[];
}) {
  const [state, formAction, isPending] = useActionState(submitPredictions, initialActionState);
  const participantId = state.participantId ?? initialParticipant?.id ?? "";
  const predictionsByMatch = useMemo(() => {
    return Object.fromEntries(initialPredictions.map((prediction) => [prediction.matchId, prediction]));
  }, [initialPredictions]);
  const grouped = useMemo(() => groupMatches(matches), [matches]);
  const completed = initialPredictions.length;
  const total = matches.length;

  useEffect(() => {
    if (!initialParticipant?.id) {
      const stored = window.localStorage.getItem("app-copa-participant");
      if (stored) window.location.replace(`/?participant=${stored}`);
    }
  }, [initialParticipant?.id]);

  useEffect(() => {
    if (state.ok && state.participantId) {
      window.localStorage.setItem("app-copa-participant", state.participantId);
      window.history.replaceState(null, "", `/?participant=${state.participantId}`);
    }
  }, [state]);

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-[#171925]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[28px] bg-white px-5 py-6 shadow-[0_18px_70px_rgba(29,35,73,0.08)] sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5">
            <Image
              src="https://static.wixstatic.com/media/613e90_f01ff1f2d28d45cf9a7aa059568f7313~mv2.png/v1/fill/w_460,h_92,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo-DRnovo_edited.png"
              alt="DR Monitora"
              width={460}
              height={92}
              priority
              className="h-auto w-52"
            />
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#3857e8]">
                <Sparkles className="h-4 w-4" />
                Bolao corporativo
              </p>
              <h1 className="max-w-2xl text-4xl font-black leading-tight text-[#202334] sm:text-5xl">
                Palpites da Copa DR Monitora
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#62677f] sm:text-lg">
                Preencha seus dados, marque os placares e edite quando quiser antes dos jogos. O ranking geral e os acertadores por jogo ficam prontos automaticamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-3xl bg-[#edf2ff] p-3 text-center sm:min-w-96">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-3xl font-black text-[#3857e8]">{total}</p>
              <p className="text-xs font-bold uppercase text-[#71768d]">jogos</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-3xl font-black text-[#3857e8]">{completed}</p>
              <p className="text-xs font-bold uppercase text-[#71768d]">palpites</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-3xl font-black text-[#3857e8]">6</p>
              <p className="text-xs font-bold uppercase text-[#71768d]">pontos</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form action={formAction} className="flex flex-col gap-6">
            <input type="hidden" name="participantId" value={participantId} />

            <section className="rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#3857e8]">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Seus dados</h2>
                  <p className="text-sm text-[#62677f]">Use nome e departamento para aparecer no ranking.</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm font-bold text-[#3a3d4f]">
                  Nome
                  <input
                    name="firstName"
                    defaultValue={initialParticipant?.firstName ?? ""}
                    required
                    className="h-12 rounded-2xl border border-[#d9deee] bg-white px-4 text-base outline-none transition focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-[#3a3d4f]">
                  Sobrenome
                  <input
                    name="lastName"
                    defaultValue={initialParticipant?.lastName ?? ""}
                    required
                    className="h-12 rounded-2xl border border-[#d9deee] bg-white px-4 text-base outline-none transition focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-[#3a3d4f]">
                  Departamento
                  <select
                    name="department"
                    defaultValue={initialParticipant?.department ?? ""}
                    required
                    className="h-12 rounded-2xl border border-[#d9deee] bg-white px-4 text-base outline-none transition focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Jogos</h2>
                  <p className="mt-1 text-sm text-[#62677f]">Placar exato vale 6 pontos. Vencedor ou empate vale 3.</p>
                </div>
              </div>

              {Object.entries(grouped).map(([date, dateMatches]) => (
                <div key={date} className="flex flex-col gap-4">
                  <h3 className="flex items-center gap-2 text-lg font-black">
                    <CalendarDays className="h-5 w-5 text-[#3857e8]" />
                    {formatDate(date)}
                  </h3>
                  <div className="grid gap-4">
                    {dateMatches.map((match) => {
                      const prediction = predictionsByMatch[match.id];
                      return (
                        <article
                          key={match.id}
                          className="overflow-hidden rounded-[24px] border border-[#dfe3f2] bg-white shadow-[0_12px_36px_rgba(29,35,73,0.05)]"
                        >
                          <input type="hidden" name="matchId" value={match.id} />
                          <div className="flex items-center justify-between border-b border-[#e4e8f5] px-5 py-4">
                            <span className="text-base font-black">{match.groupName}</span>
                            <span className="rounded-full bg-[#edf2ff] px-3 py-1 text-sm font-black text-[#3857e8]">
                              {match.kickoffTime}
                            </span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5 sm:px-6">
                            <Team flag={match.homeFlag} name={match.homeTeam} />
                            <span className="text-xl font-black">x</span>
                            <Team flag={match.awayFlag} name={match.awayTeam} alignRight />
                          </div>
                          <div className="flex items-center justify-between gap-3 border-t border-[#e4e8f5] bg-[#fbfcff] px-4 py-4 sm:px-6">
                            <span className="text-sm font-black sm:text-base">Seu palpite</span>
                            <div className="flex items-center gap-2">
                              <ScoreInput name={`homeScore:${match.id}`} defaultValue={prediction?.homeScore ?? 0} />
                              <span className="font-black text-[#62677f]">-</span>
                              <ScoreInput name={`awayScore:${match.id}`} defaultValue={prediction?.awayScore ?? 0} />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-[#dfe3f2] bg-white/95 p-4 shadow-[0_18px_55px_rgba(29,35,73,0.18)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-sm font-bold ${state.ok ? "text-emerald-700" : "text-[#62677f]"}`}>
                {state.message || "Revise os placares e salve seus palpites."}
              </p>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#3857e8] px-6 text-base font-black text-white shadow-[0_12px_28px_rgba(56,87,232,0.30)] transition hover:bg-[#2745d9] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trophy className="h-5 w-5" />}
                Salvar palpites
              </button>
            </div>
          </form>

          <aside className="flex flex-col gap-5">
            <section className="rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1c7] text-[#aa7800]">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Premios</h2>
                  <p className="text-sm text-[#62677f]">Regras sugeridas para a campanha.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <Rule points="+6 pontos" text="Acertou o placar exato da partida." />
                <Rule points="+3 pontos" text="Acertou apenas o vencedor ou empate." />
                <Rule points="0 pontos" text="Errou o resultado." />
              </div>
            </section>

            <section className="rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#3857e8]">
                  <Medal className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Ranking</h2>
                  <p className="text-sm text-[#62677f]">Atualiza depois dos resultados.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {ranking.length === 0 ? (
                  <p className="rounded-2xl bg-[#f5f7fc] p-4 text-sm font-semibold text-[#62677f]">
                    O ranking aparece assim que os primeiros participantes salvarem palpites.
                  </p>
                ) : (
                  ranking.slice(0, 8).map((row, index) => (
                    <div key={row.participantId} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f5f7fc] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {index + 1}. {row.name}
                        </p>
                        <p className="truncate text-xs font-semibold text-[#62677f]">{row.department}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#3857e8]">{row.points} pts</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Team({ flag, name, alignRight = false }: { flag: string; name: string; alignRight?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${alignRight ? "items-end text-right" : "items-start"}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d9deee] bg-white text-4xl shadow-sm">
        {flag}
      </div>
      <p className="max-w-full truncate text-base font-bold sm:text-lg">{name}</p>
    </div>
  );
}

function ScoreInput({ name, defaultValue }: { name: string; defaultValue: number }) {
  return (
    <input
      name={name}
      type="number"
      min={0}
      max={30}
      defaultValue={defaultValue}
      required
      className="h-11 w-14 rounded-2xl border border-[#d9deee] bg-white text-center text-lg font-black outline-none transition focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
    />
  );
}

function Rule({ points, text }: { points: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#e1e5f2] p-4">
      <p className="text-lg font-black text-[#3857e8]">{points}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-[#62677f]">{text}</p>
    </div>
  );
}
