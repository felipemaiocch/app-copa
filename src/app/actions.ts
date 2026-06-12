"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  deleteParticipantSession,
  getParticipantBySessionToken,
  getMatches,
  isPredictionOpen,
  loginParticipant,
  normalizeEmail,
  registerParticipant,
  updateMatchResult,
  updateParticipantProfile,
  upsertPredictions,
} from "@/lib/data";

const sessionCookieName = "app-copa-session";

function asText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function asScore(value: FormDataEntryValue | null) {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0 || score > 30) {
    throw new Error("Placar invalido.");
  }

  return score;
}

export async function submitPredictions(_previousState: unknown, formData: FormData) {
  const firstName = asText(formData.get("firstName"));
  const lastName = asText(formData.get("lastName"));
  const department = asText(formData.get("department"));
  const cookieStore = await cookies();
  const participant = await getParticipantBySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!participant) {
    return { ok: false, message: "Entre com e-mail e senha para salvar seus palpites." };
  }

  if (!firstName || !lastName || !department) {
    return { ok: false, message: "Informe nome, sobrenome e departamento." };
  }

  await updateParticipantProfile({
    participantId: participant.id,
    firstName,
    lastName,
    department,
  });

  const matchIds = formData.getAll("matchId").map(String);
  const matches = await getMatches();
  const unlockedMatchIds = new Set(
    matches.filter((match) => isPredictionOpen(match)).map((match) => match.id),
  );
  const allowedMatchIds = matchIds.filter((matchId) => unlockedMatchIds.has(matchId));

  if (allowedMatchIds.length === 0) {
    return {
      ok: false,
      participantId: participant.id,
      email: participant.email,
      message: "Nenhum jogo esta aberto para palpite agora.",
    };
  }

  const predictions = allowedMatchIds.map((matchId) => ({
    matchId,
    homeScore: asScore(formData.get(`homeScore:${matchId}`)),
    awayScore: asScore(formData.get(`awayScore:${matchId}`)),
  }));

  await upsertPredictions(participant.id, predictions);
  revalidatePath("/");
  revalidatePath("/admin");

  return {
    ok: true,
    participantId: participant.id,
    email: participant.email,
    message:
      allowedMatchIds.length === matchIds.length
        ? "Palpites salvos."
        : "Palpites salvos. Jogos bloqueados ou encerrados nao foram alterados.",
  };
}

function setSessionCookie(token: string) {
  return {
    name: sessionCookieName,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  };
}

export async function authenticateParticipant(_previousState: unknown, formData: FormData) {
  const mode = asText(formData.get("mode"));
  const email = normalizeEmail(asText(formData.get("email")));
  const password = asText(formData.get("password"));
  const firstName = asText(formData.get("firstName"));
  const lastName = asText(formData.get("lastName"));
  const department = asText(formData.get("department"));

  if (!email || !email.includes("@") || password.length < 4) {
    return { ok: false, message: "Informe e-mail valido e senha com pelo menos 4 caracteres." };
  }

  if (mode === "register" && (!firstName || !lastName || !department)) {
    return { ok: false, message: "Informe nome, sobrenome e departamento para criar sua senha." };
  }

  const result =
    mode === "register"
      ? await registerParticipant({
          email,
          password,
          firstName,
          lastName,
          department,
        })
      : await loginParticipant(email, password);

  if (!result.ok) return result;

  const cookieStore = await cookies();
  cookieStore.set(setSessionCookie(result.sessionToken));
  revalidatePath("/");

  return {
    ok: true,
    email: result.participant.email,
    participantId: result.participant.id,
    message: mode === "register" ? "Cadastro criado. Voce esta logado." : "Login realizado.",
  };
}

export async function loginParticipantAction(previousState: unknown, formData: FormData) {
  formData.set("mode", "login");
  return authenticateParticipant(previousState, formData);
}

export async function registerParticipantAction(previousState: unknown, formData: FormData) {
  formData.set("mode", "register");
  return authenticateParticipant(previousState, formData);
}

export async function logoutParticipant() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  await deleteParticipantSession(token);
  cookieStore.delete(sessionCookieName);
  revalidatePath("/");
}

export async function saveResult(formData: FormData) {
  const matchId = asText(formData.get("matchId"));

  if (!matchId) {
    throw new Error("Jogo nao encontrado.");
  }

  await updateMatchResult({
    matchId,
    homeScore: asScore(formData.get("homeScore")),
    awayScore: asScore(formData.get("awayScore")),
  });

  revalidatePath("/");
  revalidatePath("/admin");

}
