import { getSql, makeId } from "./db";

export type Match = {
  id: string;
  matchDate: string;
  kickoffTime: string;
  groupName: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "finished";
};

export type Prediction = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
};

export type RankingRow = {
  participantId: string;
  name: string;
  department: string;
  points: number;
  exactHits: number;
  winnerHits: number;
  predictions: number;
};

export type DailyWinner = {
  matchId: string;
  matchLabel: string;
  matchDate: string;
  name: string;
  department: string;
  predictedScore: string;
};

const seedMatches = [
  ["2026-06-11", "16:00", "Grupo A", "Mexico", "Africa do Sul", "🇲🇽", "🇿🇦"],
  ["2026-06-11", "23:00", "Grupo A", "Uruguai", "Arabia Saudita", "🇺🇾", "🇸🇦"],
  ["2026-06-12", "16:00", "Grupo B", "Catar", "Suica", "🇶🇦", "🇨🇭"],
  ["2026-06-12", "19:00", "Grupo C", "Brasil", "Marrocos", "🇧🇷", "🇲🇦"],
  ["2026-06-12", "22:00", "Grupo C", "Haiti", "Escocia", "🇭🇹", "🏴"],
  ["2026-06-14", "01:00", "Grupo D", "Australia", "Turquia", "🇦🇺", "🇹🇷"],
  ["2026-06-14", "16:00", "Grupo E", "Espanha", "Japao", "🇪🇸", "🇯🇵"],
  ["2026-06-14", "19:00", "Grupo F", "Portugal", "Chile", "🇵🇹", "🇨🇱"],
  ["2026-06-15", "16:00", "Grupo G", "Argentina", "Egito", "🇦🇷", "🇪🇬"],
  ["2026-06-15", "22:00", "Grupo H", "Franca", "Coreia do Sul", "🇫🇷", "🇰🇷"],
  ["2026-06-16", "16:00", "Grupo I", "Alemanha", "Senegal", "🇩🇪", "🇸🇳"],
  ["2026-06-16", "19:00", "Grupo J", "Inglaterra", "Equador", "🏴", "🇪🇨"],
];

type DbRow = Record<string, unknown>;

function rowsOf(value: unknown): DbRow[] {
  return value as DbRow[];
}

function dateOnly(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  return new Date(text).toISOString().slice(0, 10);
}

let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

export async function ensureSchema() {
  if (schemaReady) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = setupSchema();
  await schemaPromise;
}

async function setupSchema() {
  if (schemaReady) return;

  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id text PRIMARY KEY,
      first_name text NOT NULL,
      last_name text NOT NULL,
      department text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS matches (
      id text PRIMARY KEY,
      match_date date NOT NULL,
      kickoff_time time NOT NULL,
      group_name text NOT NULL,
      home_team text NOT NULL,
      away_team text NOT NULL,
      home_flag text NOT NULL,
      away_flag text NOT NULL,
      home_score integer,
      away_score integer,
      status text NOT NULL DEFAULT 'scheduled',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS predictions (
      id text PRIMARY KEY,
      participant_id text NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      match_id text NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      home_score integer NOT NULL CHECK (home_score >= 0 AND home_score <= 30),
      away_score integer NOT NULL CHECK (away_score >= 0 AND away_score <= 30),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (participant_id, match_id)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS predictions_participant_idx
    ON predictions (participant_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS predictions_match_idx
    ON predictions (match_id)
  `;

  const existing = rowsOf(await sql`SELECT COUNT(*)::int AS count FROM matches`);
  if (Number(existing[0]?.count ?? 0) === 0) {
    for (const item of seedMatches) {
      await sql`
        INSERT INTO matches (
          id, match_date, kickoff_time, group_name, home_team, away_team, home_flag, away_flag
        )
        VALUES (
          ${makeId("match")},
          ${item[0]}::date,
          ${item[1]}::time,
          ${item[2]},
          ${item[3]},
          ${item[4]},
          ${item[5]},
          ${item[6]}
        )
      `;
    }
  }

  schemaReady = true;
}

function mapMatch(row: Record<string, unknown>): Match {
  return {
    id: String(row.id),
    matchDate: dateOnly(row.match_date),
    kickoffTime: String(row.kickoff_time).slice(0, 5),
    groupName: String(row.group_name),
    homeTeam: String(row.home_team),
    awayTeam: String(row.away_team),
    homeFlag: String(row.home_flag),
    awayFlag: String(row.away_flag),
    homeScore: row.home_score === null ? null : Number(row.home_score),
    awayScore: row.away_score === null ? null : Number(row.away_score),
    status: row.status === "finished" ? "finished" : "scheduled",
  };
}

export async function getMatches(): Promise<Match[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT *
    FROM matches
    ORDER BY match_date ASC, kickoff_time ASC, group_name ASC
  `);

  return rows.map(mapMatch);
}

export async function getParticipant(id?: string | null): Promise<Participant | null> {
  if (!id) return null;
  await ensureSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT id, first_name, last_name, department
    FROM participants
    WHERE id = ${id}
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    department: String(row.department),
  };
}

export async function getPredictions(participantId?: string | null): Promise<Prediction[]> {
  if (!participantId) return [];
  await ensureSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT match_id, home_score, away_score
    FROM predictions
    WHERE participant_id = ${participantId}
  `);

  return rows.map((row) => ({
    matchId: String(row.match_id),
    homeScore: Number(row.home_score),
    awayScore: Number(row.away_score),
  }));
}

export async function upsertParticipant(input: {
  participantId?: string | null;
  firstName: string;
  lastName: string;
  department: string;
}) {
  await ensureSchema();
  const sql = getSql();
  const id = input.participantId || makeId("person");

  await sql`
    INSERT INTO participants (id, first_name, last_name, department, updated_at)
    VALUES (${id}, ${input.firstName}, ${input.lastName}, ${input.department}, now())
    ON CONFLICT (id)
    DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      department = excluded.department,
      updated_at = now()
  `;

  return id;
}

export async function upsertPredictions(participantId: string, predictions: Prediction[]) {
  await ensureSchema();
  const sql = getSql();

  for (const prediction of predictions) {
    await sql`
      INSERT INTO predictions (id, participant_id, match_id, home_score, away_score, updated_at)
      VALUES (
        ${makeId("guess")},
        ${participantId},
        ${prediction.matchId},
        ${prediction.homeScore},
        ${prediction.awayScore},
        now()
      )
      ON CONFLICT (participant_id, match_id)
      DO UPDATE SET
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        updated_at = now()
    `;
  }
}

export async function updateMatchResult(input: {
  matchId: string;
  homeScore: number;
  awayScore: number;
}) {
  await ensureSchema();
  const sql = getSql();

  await sql`
    UPDATE matches
    SET home_score = ${input.homeScore},
        away_score = ${input.awayScore},
        status = 'finished'
    WHERE id = ${input.matchId}
  `;
}

export async function getRanking(): Promise<RankingRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      p.id AS participant_id,
      concat(p.first_name, ' ', p.last_name) AS name,
      p.department,
      COALESCE(SUM(
        CASE
          WHEN m.status = 'finished'
            AND pr.home_score = m.home_score
            AND pr.away_score = m.away_score THEN 6
          WHEN m.status = 'finished'
            AND sign(pr.home_score - pr.away_score) = sign(m.home_score - m.away_score) THEN 3
          ELSE 0
        END
      ), 0)::int AS points,
      COALESCE(SUM(
        CASE
          WHEN m.status = 'finished'
            AND pr.home_score = m.home_score
            AND pr.away_score = m.away_score THEN 1
          ELSE 0
        END
      ), 0)::int AS exact_hits,
      COALESCE(SUM(
        CASE
          WHEN m.status = 'finished'
            AND NOT (pr.home_score = m.home_score AND pr.away_score = m.away_score)
            AND sign(pr.home_score - pr.away_score) = sign(m.home_score - m.away_score) THEN 1
          ELSE 0
        END
      ), 0)::int AS winner_hits,
      COUNT(pr.id)::int AS predictions
    FROM participants p
    LEFT JOIN predictions pr ON pr.participant_id = p.id
    LEFT JOIN matches m ON m.id = pr.match_id
    GROUP BY p.id, p.first_name, p.last_name, p.department
    ORDER BY points DESC, exact_hits DESC, winner_hits DESC, name ASC
    LIMIT 50
  `);

  return rows.map((row) => ({
    participantId: String(row.participant_id),
    name: String(row.name),
    department: String(row.department),
    points: Number(row.points),
    exactHits: Number(row.exact_hits),
    winnerHits: Number(row.winner_hits),
    predictions: Number(row.predictions),
  }));
}

export async function getDailyWinners(): Promise<DailyWinner[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      m.id AS match_id,
      concat(m.home_team, ' x ', m.away_team) AS match_label,
      m.match_date,
      concat(p.first_name, ' ', p.last_name) AS name,
      p.department,
      concat(pr.home_score, ' - ', pr.away_score) AS predicted_score
    FROM predictions pr
    INNER JOIN participants p ON p.id = pr.participant_id
    INNER JOIN matches m ON m.id = pr.match_id
    WHERE m.status = 'finished'
      AND pr.home_score = m.home_score
      AND pr.away_score = m.away_score
    ORDER BY m.match_date DESC, m.kickoff_time DESC, name ASC
    LIMIT 120
  `);

  return rows.map((row) => ({
    matchId: String(row.match_id),
    matchLabel: String(row.match_label),
    matchDate: dateOnly(row.match_date),
    name: String(row.name),
    department: String(row.department),
    predictedScore: String(row.predicted_score),
  }));
}
