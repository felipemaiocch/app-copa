"use server";

import { revalidatePath } from "next/cache";
import { updateMatchResult, upsertParticipant, upsertPredictions } from "@/lib/data";

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
  const participantId = asText(formData.get("participantId"));

  if (!firstName || !lastName || !department) {
    return { ok: false, message: "Informe nome, sobrenome e departamento." };
  }

  const participant = await upsertParticipant({
    participantId: participantId || null,
    firstName,
    lastName,
    department,
  });

  const matchIds = formData.getAll("matchId").map(String);
  const predictions = matchIds.map((matchId) => ({
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
    message: "Palpites salvos.",
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
