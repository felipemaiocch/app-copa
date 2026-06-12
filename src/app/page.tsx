import { cookies } from "next/headers";
import { PredictionApp } from "@/components/prediction-app";
import { SetupError } from "@/components/setup-error";
import { getMatches, getParticipantBySessionToken, getPredictions, getRanking, getTodayInSaoPaulo } from "@/lib/data";

export const dynamic = "force-dynamic";

const sessionCookieName = "app-copa-session";

export default async function Home() {
  let matches;
  let participant;
  let predictions;
  let ranking;

  try {
    const cookieStore = await cookies();
    participant = await getParticipantBySessionToken(cookieStore.get(sessionCookieName)?.value);
    [matches, participant, predictions, ranking] = await Promise.all([
      getMatches(),
      Promise.resolve(participant),
      getPredictions(participant?.id),
      getRanking(),
    ]);
  } catch (error) {
    return <SetupError error={error} />;
  }

  return (
    <PredictionApp
      matches={matches}
      initialParticipant={participant}
      initialPredictions={predictions}
      ranking={ranking}
      unlockedThroughDate={getTodayInSaoPaulo()}
      nowIso={new Date().toISOString()}
    />
  );
}
