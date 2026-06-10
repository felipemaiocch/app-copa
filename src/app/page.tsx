import { PredictionApp } from "@/components/prediction-app";
import { getMatches, getParticipant, getPredictions, getRanking } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ participant?: string }>;
}) {
  const params = await searchParams;
  const participantId = params?.participant;
  const [matches, participant, predictions, ranking] = await Promise.all([
    getMatches(),
    getParticipant(participantId),
    getPredictions(participantId),
    getRanking(),
  ]);

  return (
    <PredictionApp
      matches={matches}
      initialParticipant={participant}
      initialPredictions={predictions}
      ranking={ranking}
    />
  );
}
