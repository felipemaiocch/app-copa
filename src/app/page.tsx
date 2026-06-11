import { PredictionApp } from "@/components/prediction-app";
import { SetupError } from "@/components/setup-error";
import { getMatches, getParticipantByEmail, getPredictions, getRanking, getTodayInSaoPaulo } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string; participant?: string }>;
}) {
  let matches;
  let participant;
  let predictions;
  let ranking;

  try {
    const params = await searchParams;
    const email = params?.email || params?.participant;
    participant = await getParticipantByEmail(email);
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
