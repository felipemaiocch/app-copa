import { PredictionApp } from "@/components/prediction-app";
import { SetupError } from "@/components/setup-error";
import { getMatches, getParticipant, getPredictions, getRanking, getTodayInSaoPaulo } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ participant?: string }>;
}) {
  let matches;
  let participant;
  let predictions;
  let ranking;

  try {
    const params = await searchParams;
    const participantId = params?.participant;
    [matches, participant, predictions, ranking] = await Promise.all([
      getMatches(),
      getParticipant(participantId),
      getPredictions(participantId),
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
    />
  );
}
