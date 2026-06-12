"use client";

import { useActionState, useMemo } from "react";
import Image from "next/image";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gift,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Medal,
  Menu,
  Sparkles,
  Trophy,
} from "lucide-react";
import { authenticateParticipant, logoutParticipant, submitPredictions } from "@/app/actions";
import type { Match, Participant, Prediction, RankingRow } from "@/lib/data";
import { departments } from "@/lib/departments";

type ActionState = {
  ok: boolean;
  message: string;
  participantId?: string;
  email?: string;
};

const initialActionState: ActionState = {
  ok: false,
  message: "",
};

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

function getKickoffDate(match: Match) {
  return new Date(`${match.matchDate}T${match.kickoffTime}:00-03:00`);
}

function getMatchState(match: Match, unlockedThroughDate: string, nowIso: string) {
  if (match.matchDate > unlockedThroughDate) {
    return {
      isOpen: false,
      label: "bloqueado",
      message: `Libera em ${formatDate(match.matchDate)}`,
    };
  }

  const cutoff = getKickoffDate(match).getTime() - 2 * 60 * 60 * 1000;
  if (new Date(nowIso).getTime() >= cutoff) {
    return {
      isOpen: false,
      label: "encerrado",
      message: "Edição encerrada 2h antes do jogo",
    };
  }

  return {
    isOpen: true,
    label: "aberto",
    message: "Aberto para palpite",
  };
}

export function PredictionApp({
  matches,
  initialParticipant,
  initialPredictions,
  ranking,
  unlockedThroughDate,
  nowIso,
}: {
  matches: Match[];
  initialParticipant: Participant | null;
  initialPredictions: Prediction[];
  ranking: RankingRow[];
  unlockedThroughDate: string;
  nowIso: string;
}) {
  const [state, formAction, isPending] = useActionState(submitPredictions, initialActionState);
  const [authState, authAction, authPending] = useActionState(authenticateParticipant, initialActionState);
  const isAuthenticated = Boolean(initialParticipant);
  const email = initialParticipant?.email ?? authState.email ?? "";
  const predictionsByMatch = useMemo(() => {
    return Object.fromEntries(initialPredictions.map((prediction) => [prediction.matchId, prediction]));
  }, [initialPredictions]);
  const grouped = useMemo(() => groupMatches(matches), [matches]);
  const savedPredictions = useMemo(() => {
    return initialPredictions
      .map((prediction) => {
        const match = matches.find((item) => item.id === prediction.matchId);
        if (!match) return null;

        return {
          ...prediction,
          match,
        };
      })
      .filter((prediction) => prediction !== null);
  }, [initialPredictions, matches]);
  const total = matches.length;
  const openTotal = matches.filter((match) => getMatchState(match, unlockedThroughDate, nowIso).isOpen).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8fc] text-[#171925]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-3 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[28px] bg-white px-5 py-6 shadow-[0_18px_70px_rgba(29,35,73,0.08)] sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-5">
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
                Preencha seus dados e marque os placares liberados. Novos dias de jogos abrem automaticamente quando o dia anterior passa.
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 rounded-3xl bg-[#edf2ff] p-2 text-center sm:min-w-96 sm:gap-3 sm:p-3 lg:w-auto">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-3xl font-black text-[#3857e8]">{total}</p>
              <p className="text-xs font-bold uppercase text-[#71768d]">jogos</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-3xl font-black text-[#3857e8]">{openTotal}</p>
              <p className="text-xs font-bold uppercase text-[#71768d]">abertos</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-3xl font-black text-[#3857e8]">6</p>
              <p className="text-xs font-bold uppercase text-[#71768d]">pontos</p>
            </div>
          </div>
        </header>

        <details className="sticky top-3 z-20 rounded-2xl border border-[#dfe3f2] bg-white/95 shadow-[0_12px_34px_rgba(29,35,73,0.14)] backdrop-blur lg:hidden">
          <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-black text-[#171925] marker:hidden">
            <span className="inline-flex items-center gap-2">
              <Menu className="h-5 w-5 text-[#3857e8]" />
              Menu
            </span>
            <span className="text-xs font-bold text-[#62677f]">{openTotal} abertos</span>
          </summary>
          <nav className="grid grid-cols-2 gap-2 border-t border-[#e4e8f5] p-3 text-sm font-black">
            <a href="#dados" className="rounded-xl bg-[#f5f7fc] px-3 py-3 text-center text-[#3857e8]">Dados</a>
            <a href="#jogos" className="rounded-xl bg-[#f5f7fc] px-3 py-3 text-center text-[#3857e8]">Jogos</a>
            <a href="#meus-palpites" className="rounded-xl bg-[#f5f7fc] px-3 py-3 text-center text-[#3857e8]">Meus</a>
            <a href="#regras" className="rounded-xl bg-[#f5f7fc] px-3 py-3 text-center text-[#3857e8]">Regras</a>
            <a href="#ranking" className="col-span-2 rounded-xl bg-[#f5f7fc] px-3 py-3 text-center text-[#3857e8]">Ranking</a>
          </nav>
        </details>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form action={formAction} className="flex flex-col gap-6">
            <section id="dados" className="scroll-mt-20 rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#3857e8]">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">{isAuthenticated ? "Seus dados" : "Entrar no bolão"}</h2>
                  <p className="text-sm text-[#62677f]">
                    {isAuthenticated
                      ? "Seu e-mail NEO esta protegido por senha."
                      : "Use seu e-mail NEO e uma senha simples no primeiro acesso."}
                  </p>
                </div>
              </div>

              <div className="grid min-w-0 gap-3 lg:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-bold text-[#3a3d4f]">
                  E-mail NEO
                  <input
                    name="email"
                    type="email"
                    defaultValue={email}
                    placeholder="nome@empresa.com"
                    required={!isAuthenticated}
                    readOnly={isAuthenticated}
                    className="h-12 rounded-2xl border border-[#d9deee] bg-white px-4 text-base outline-none transition focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10 read-only:bg-[#f5f7fc]"
                  />
                  <span className="text-xs font-semibold text-[#62677f]">
                    {isAuthenticated
                      ? "Ao voltar neste navegador, voce continua logado automaticamente."
                      : "Depois de entrar, seus palpites salvos aparecem de novo neste navegador."}
                  </span>
                </label>
                {!isAuthenticated && (
                  <label className="flex flex-col gap-2 text-sm font-bold text-[#3a3d4f]">
                    Senha
                    <input
                      name="password"
                      type="password"
                      minLength={4}
                      required
                      placeholder="Mínimo 4 caracteres"
                      className="h-12 rounded-2xl border border-[#d9deee] bg-white px-4 text-base outline-none transition focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                    />
                    <span className="text-xs font-semibold text-[#62677f]">
                      A senha impede que outra pessoa use seu e-mail para ver ou alterar palpites.
                    </span>
                  </label>
                )}
                <label className="flex flex-col gap-2 text-sm font-bold text-[#3a3d4f]">
                  Nome
                  <input
                    name="firstName"
                    defaultValue={initialParticipant?.firstName ?? ""}
                    required={isAuthenticated}
                    className="h-12 rounded-2xl border border-[#d9deee] bg-white px-4 text-base outline-none transition focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-[#3a3d4f]">
                  Sobrenome
                  <input
                    name="lastName"
                    defaultValue={initialParticipant?.lastName ?? ""}
                    required={isAuthenticated}
                    className="h-12 rounded-2xl border border-[#d9deee] bg-white px-4 text-base outline-none transition focus:border-[#3857e8] focus:ring-4 focus:ring-[#3857e8]/10"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-[#3a3d4f]">
                  Departamento
                  <select
                    name="department"
                    defaultValue={initialParticipant?.department ?? ""}
                    required={isAuthenticated}
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

              {!isAuthenticated && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    name="mode"
                    value="login"
                    formAction={authAction}
                    disabled={authPending}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#d9deee] bg-white px-5 text-sm font-black text-[#3857e8] transition hover:bg-[#edf2ff] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {authPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                    Entrar
                  </button>
                  <button
                    type="submit"
                    name="mode"
                    value="register"
                    formAction={authAction}
                    disabled={authPending}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#3857e8] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(56,87,232,0.24)] transition hover:bg-[#2745d9] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {authPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    Criar senha e entrar
                  </button>
                </div>
              )}

              {isAuthenticated && (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#f5f7fc] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-[#62677f]">
                    Logado como <span className="text-[#171925]">{email}</span>
                  </p>
                  <button
                    type="submit"
                    formAction={logoutParticipant}
                    formNoValidate
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#d9deee] bg-white px-4 text-sm font-black text-[#3857e8] transition hover:bg-[#edf2ff]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              )}

              {authState.message && !isAuthenticated && (
                <div
                  className={`mt-4 rounded-2xl border p-4 text-sm font-black ${
                    authState.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {authState.message}
                </div>
              )}

              {state.message && (
                <div
                  className={`mt-4 rounded-2xl border p-4 text-sm font-black ${
                    state.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {state.message}
                </div>
              )}
            </section>

            <section id="jogos" className="flex scroll-mt-20 flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Jogos</h2>
                  <p className="mt-1 text-sm text-[#62677f]">
                    {isAuthenticated
                      ? "Você pode salvar e alterar quantas vezes quiser até 2h antes do início de cada jogo."
                      : "Entre com e-mail e senha para liberar o salvamento dos palpites."}
                  </p>
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
                      const matchState = getMatchState(match, unlockedThroughDate, nowIso);
                      return (
                        <article
                          key={match.id}
                          className={`overflow-hidden rounded-[24px] border border-[#dfe3f2] bg-white shadow-[0_12px_36px_rgba(29,35,73,0.05)] ${
                            matchState.isOpen ? "" : "opacity-75"
                          }`}
                        >
                          {matchState.isOpen && isAuthenticated && <input type="hidden" name="matchId" value={match.id} />}
                          <div className="flex items-start justify-between gap-3 border-b border-[#e4e8f5] px-4 py-4 sm:px-5">
                            <span className="min-w-0 text-base font-black">{match.groupName}</span>
                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                              {!matchState.isOpen && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f5fa] px-3 py-1 text-xs font-black text-[#71768d]">
                                  <Lock className="h-3.5 w-3.5" />
                                  {matchState.label}
                                </span>
                              )}
                              <span className="rounded-full bg-[#edf2ff] px-3 py-1 text-sm font-black text-[#3857e8]">
                                {match.kickoffTime}
                              </span>
                            </div>
                          </div>
                          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 py-5 sm:gap-3 sm:px-6">
                            <Team flag={match.homeFlag} name={match.homeTeam} />
                            <span className="text-xl font-black">x</span>
                            <Team flag={match.awayFlag} name={match.awayTeam} alignRight />
                          </div>
                          <div className="flex items-center justify-between gap-3 border-t border-[#e4e8f5] bg-[#fbfcff] px-4 py-4 sm:px-6">
                            {matchState.isOpen ? (
                              isAuthenticated ? (
                                <>
                                <span className="text-sm font-black sm:text-base">Seu palpite</span>
                                <div className="flex shrink-0 items-center gap-2">
                                  <ScoreInput name={`homeScore:${match.id}`} defaultValue={prediction?.homeScore ?? 0} />
                                  <span className="font-black text-[#62677f]">-</span>
                                  <ScoreInput name={`awayScore:${match.id}`} defaultValue={prediction?.awayScore ?? 0} />
                                </div>
                                </>
                              ) : (
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span className="text-sm font-black sm:text-base">Entre para palpitar</span>
                                  <span className="text-right text-xs font-bold text-[#62677f] sm:text-sm">
                                    Seus palpites ficam protegidos por senha.
                                  </span>
                                </div>
                              )
                            ) : (
                              <div className="flex w-full items-center justify-between gap-3">
                                <span className="text-sm font-black sm:text-base">Palpite bloqueado</span>
                                <span className="text-right text-xs font-bold text-[#62677f] sm:text-sm">
                                  {matchState.message}
                                </span>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            <div className="sticky bottom-3 z-10 flex max-w-full flex-col gap-3 rounded-3xl border border-[#dfe3f2] bg-white/95 p-3 shadow-[0_18px_55px_rgba(29,35,73,0.18)] backdrop-blur sm:bottom-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <p className={`text-sm font-bold ${state.ok ? "text-emerald-700" : "text-[#62677f]"}`}>
                {state.message ||
                  (isAuthenticated
                    ? `Revise os ${openTotal} jogos abertos e salve seus palpites.`
                    : "Entre ou crie sua senha para salvar seus palpites.")}
              </p>
              <button
                type="submit"
                disabled={!isAuthenticated || isPending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#3857e8] px-6 text-base font-black text-white shadow-[0_12px_28px_rgba(56,87,232,0.30)] transition hover:bg-[#2745d9] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trophy className="h-5 w-5" />}
                Salvar palpites
              </button>
            </div>
          </form>

          <aside className="flex min-w-0 flex-col gap-5">
            <section id="meus-palpites" className="scroll-mt-20 rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#3857e8]">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Meus palpites</h2>
                  <p className="text-sm text-[#62677f]">Palpites salvos na sua conta.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {!isAuthenticated ? (
                  <p className="rounded-2xl bg-[#f5f7fc] p-4 text-sm font-semibold text-[#62677f]">
                    Entre com e-mail e senha para ver seus palpites salvos.
                  </p>
                ) : savedPredictions.length === 0 ? (
                  <p className="rounded-2xl bg-[#f5f7fc] p-4 text-sm font-semibold text-[#62677f]">
                    Salve seus primeiros palpites para ver a lista aqui.
                  </p>
                ) : (
                  savedPredictions.slice(0, 10).map(({ match, homeScore, awayScore }) => (
                    <div key={match.id} className="rounded-2xl bg-[#f5f7fc] p-3">
                      <p className="truncate text-sm font-black">
                        {match.homeTeam} x {match.awayTeam}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#62677f]">
                        {formatDate(match.matchDate)} · {homeScore} - {awayScore}
                      </p>
                    </div>
                  ))
                )}
                {savedPredictions.length > 10 && (
                  <p className="text-xs font-bold text-[#62677f]">Mostrando 10 de {savedPredictions.length} palpites salvos.</p>
                )}
              </div>
            </section>

            <section id="regras" className="scroll-mt-20 rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1c7] text-[#aa7800]">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Regras</h2>
                  <p className="text-sm text-[#62677f]">Como funciona o bolão.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <Rule points="+6 pontos" text="Acertou o placar exato da partida." />
                <Rule points="+3 pontos" text="Acertou apenas o vencedor ou empate." />
                <Rule points="0 pontos" text="Errou o resultado." />
                <Rule points="Edição" text="Você pode alterar o palpite até 2h antes do início de cada jogo." />
                <Rule points="Senha" text="O e-mail NEO e a senha protegem seus palpites. Neste navegador, voce continua logado." />
                <Rule points="Ranking" text="O ranking exibe nome, sobrenome e departamento, nunca o e-mail." />
              </div>
            </section>

            <section id="ranking" className="scroll-mt-20 rounded-[26px] border border-[#dfe3f2] bg-white p-5 shadow-[0_16px_50px_rgba(29,35,73,0.06)]">
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
