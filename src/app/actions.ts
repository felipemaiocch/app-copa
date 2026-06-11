"use server";

import { revalidatePath } from "next/cache";
import {
  getMatches,
  isPredictionOpen,
  normalizeEmail,
  updateMatchResult,
  upsertParticipant,
  upsertPredictions,
} from "@/lib/data";

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
  const email = normalizeEmail(asText(formData.get("email")));
  const department = asText(formData.get("department"));

  if (!email || !email.includes("@") || !department) {
    return { ok: false, message: "Informe um e-mail valido e o departamento." };
  }

  const participant = await upsertParticipant({
    email,
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
      participantId: participant,
      email,
      message: "Nenhum jogo esta aberto para palpite agora.",
    };
  }

  const predictions = allowedMatchIds.map((matchId) => ({
    matchId,
    homeScore: asScore(formData.get(`homeScore:${matchId}`)),
    awayScore: asScore(formData.get(`awayScore:${matchId}`)),
  }));

  await upsertPredictions(participant, predictions);
  revalidatePath("/");
  revalidatePath("/admin");

  return {
    ok: true,
    participantId: participant,
    email,
    message:
      allowedMatchIds.length === matchIds.length
        ? "Palpites salvos."
        : "Palpites salvos. Jogos bloqueados ou encerrados nao foram alterados.",
  };
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
