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

type SeedMatch = {
  id: string;
  date: string;
  time: string;
  group: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
};

const ENGLAND_FLAG = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
const SCOTLAND_FLAG = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";

const seedMatches = [
  { id: "match-001", date: "2026-06-11", time: "16:00", group: "Grupo A", home: "México", away: "África do Sul", homeFlag: "🇲🇽", awayFlag: "🇿🇦" },
  { id: "match-002", date: "2026-06-11", time: "23:00", group: "Grupo A", home: "República da Coreia", away: "Tchéquia", homeFlag: "🇰🇷", awayFlag: "🇨🇿" },
  { id: "match-003", date: "2026-06-12", time: "16:00", group: "Grupo B", home: "Canadá", away: "Bósnia e Herzegovina", homeFlag: "🇨🇦", awayFlag: "🇧🇦" },
  { id: "match-004", date: "2026-06-12", time: "22:00", group: "Grupo D", home: "Estados Unidos", away: "Paraguai", homeFlag: "🇺🇸", awayFlag: "🇵🇾" },
  { id: "match-005", date: "2026-06-13", time: "01:00", group: "Grupo D", home: "Austrália", away: "Turquia", homeFlag: "🇦🇺", awayFlag: "🇹🇷" },
  { id: "match-006", date: "2026-06-13", time: "16:00", group: "Grupo B", home: "Catar", away: "Suíça", homeFlag: "🇶🇦", awayFlag: "🇨🇭" },
  { id: "match-007", date: "2026-06-13", time: "19:00", group: "Grupo C", home: "Brasil", away: "Marrocos", homeFlag: "🇧🇷", awayFlag: "🇲🇦" },
  { id: "match-008", date: "2026-06-13", time: "22:00", group: "Grupo C", home: "Haiti", away: "Escócia", homeFlag: "🇭🇹", awayFlag: SCOTLAND_FLAG },
  { id: "match-009", date: "2026-06-14", time: "14:00", group: "Grupo E", home: "Alemanha", away: "Curaçao", homeFlag: "🇩🇪", awayFlag: "🇨🇼" },
  { id: "match-010", date: "2026-06-14", time: "17:00", group: "Grupo F", home: "Holanda", away: "Japão", homeFlag: "🇳🇱", awayFlag: "🇯🇵" },
  { id: "match-011", date: "2026-06-14", time: "20:00", group: "Grupo E", home: "Costa do Marfim", away: "Equador", homeFlag: "🇨🇮", awayFlag: "🇪🇨" },
  { id: "match-012", date: "2026-06-14", time: "23:00", group: "Grupo F", home: "Suécia", away: "Tunísia", homeFlag: "🇸🇪", awayFlag: "🇹🇳" },
  { id: "match-013", date: "2026-06-15", time: "13:00", group: "Grupo H", home: "Espanha", away: "Cabo Verde", homeFlag: "🇪🇸", awayFlag: "🇨🇻" },
  { id: "match-014", date: "2026-06-15", time: "16:00", group: "Grupo G", home: "Bélgica", away: "Egito", homeFlag: "🇧🇪", awayFlag: "🇪🇬" },
  { id: "match-015", date: "2026-06-15", time: "19:00", group: "Grupo H", home: "Arábia Saudita", away: "Uruguai", homeFlag: "🇸🇦", awayFlag: "🇺🇾" },
  { id: "match-016", date: "2026-06-15", time: "22:00", group: "Grupo G", home: "República Islâmica do Irã", away: "Nova Zelândia", homeFlag: "🇮🇷", awayFlag: "🇳🇿" },
  { id: "match-017", date: "2026-06-16", time: "16:00", group: "Grupo I", home: "França", away: "Senegal", homeFlag: "🇫🇷", awayFlag: "🇸🇳" },
  { id: "match-018", date: "2026-06-16", time: "19:00", group: "Grupo I", home: "Iraque", away: "Noruega", homeFlag: "🇮🇶", awayFlag: "🇳🇴" },
  { id: "match-019", date: "2026-06-16", time: "22:00", group: "Grupo J", home: "Argentina", away: "Argélia", homeFlag: "🇦🇷", awayFlag: "🇩🇿" },
  { id: "match-020", date: "2026-06-17", time: "01:00", group: "Grupo J", home: "Áustria", away: "Jordânia", homeFlag: "🇦🇹", awayFlag: "🇯🇴" },
  { id: "match-021", date: "2026-06-17", time: "14:00", group: "Grupo K", home: "Portugal", away: "República Democrática do Congo", homeFlag: "🇵🇹", awayFlag: "🇨🇩" },
  { id: "match-022", date: "2026-06-17", time: "17:00", group: "Grupo L", home: "Inglaterra", away: "Croácia", homeFlag: ENGLAND_FLAG, awayFlag: "🇭🇷" },
  { id: "match-023", date: "2026-06-17", time: "20:00", group: "Grupo L", home: "Gana", away: "Panamá", homeFlag: "🇬🇭", awayFlag: "🇵🇦" },
  { id: "match-024", date: "2026-06-17", time: "23:00", group: "Grupo K", home: "Uzbequistão", away: "Colômbia", homeFlag: "🇺🇿", awayFlag: "🇨🇴" },
  { id: "match-025", date: "2026-06-18", time: "13:00", group: "Grupo A", home: "Tchéquia", away: "África do Sul", homeFlag: "🇨🇿", awayFlag: "🇿🇦" },
  { id: "match-026", date: "2026-06-18", time: "16:00", group: "Grupo B", home: "Suíça", away: "Bósnia e Herzegovina", homeFlag: "🇨🇭", awayFlag: "🇧🇦" },
  { id: "match-027", date: "2026-06-18", time: "19:00", group: "Grupo B", home: "Canadá", away: "Catar", homeFlag: "🇨🇦", awayFlag: "🇶🇦" },
  { id: "match-028", date: "2026-06-18", time: "22:00", group: "Grupo A", home: "México", away: "República da Coreia", homeFlag: "🇲🇽", awayFlag: "🇰🇷" },
  { id: "match-029", date: "2026-06-19", time: "16:00", group: "Grupo D", home: "Estados Unidos", away: "Austrália", homeFlag: "🇺🇸", awayFlag: "🇦🇺" },
  { id: "match-030", date: "2026-06-19", time: "19:00", group: "Grupo C", home: "Escócia", away: "Marrocos", homeFlag: SCOTLAND_FLAG, awayFlag: "🇲🇦" },
  { id: "match-031", date: "2026-06-19", time: "21:30", group: "Grupo C", home: "Brasil", away: "Haiti", homeFlag: "🇧🇷", awayFlag: "🇭🇹" },
  { id: "match-032", date: "2026-06-20", time: "01:00", group: "Grupo D", home: "Turquia", away: "Paraguai", homeFlag: "🇹🇷", awayFlag: "🇵🇾" },
  { id: "match-033", date: "2026-06-20", time: "14:00", group: "Grupo F", home: "Holanda", away: "Suécia", homeFlag: "🇳🇱", awayFlag: "🇸🇪" },
  { id: "match-034", date: "2026-06-20", time: "17:00", group: "Grupo E", home: "Alemanha", away: "Costa do Marfim", homeFlag: "🇩🇪", awayFlag: "🇨🇮" },
  { id: "match-035", date: "2026-06-20", time: "21:00", group: "Grupo E", home: "Equador", away: "Curaçao", homeFlag: "🇪🇨", awayFlag: "🇨🇼" },
  { id: "match-036", date: "2026-06-21", time: "01:00", group: "Grupo F", home: "Tunísia", away: "Japão", homeFlag: "🇹🇳", awayFlag: "🇯🇵" },
  { id: "match-037", date: "2026-06-21", time: "13:00", group: "Grupo H", home: "Espanha", away: "Arábia Saudita", homeFlag: "🇪🇸", awayFlag: "🇸🇦" },
  { id: "match-038", date: "2026-06-21", time: "16:00", group: "Grupo G", home: "Bélgica", away: "República Islâmica do Irã", homeFlag: "🇧🇪", awayFlag: "🇮🇷" },
  { id: "match-039", date: "2026-06-21", time: "19:00", group: "Grupo H", home: "Uruguai", away: "Cabo Verde", homeFlag: "🇺🇾", awayFlag: "🇨🇻" },
  { id: "match-040", date: "2026-06-21", time: "22:00", group: "Grupo G", home: "Nova Zelândia", away: "Egito", homeFlag: "🇳🇿", awayFlag: "🇪🇬" },
  { id: "match-041", date: "2026-06-22", time: "14:00", group: "Grupo J", home: "Argentina", away: "Áustria", homeFlag: "🇦🇷", awayFlag: "🇦🇹" },
  { id: "match-042", date: "2026-06-22", time: "18:00", group: "Grupo I", home: "França", away: "Iraque", homeFlag: "🇫🇷", awayFlag: "🇮🇶" },
  { id: "match-043", date: "2026-06-22", time: "21:00", group: "Grupo I", home: "Noruega", away: "Senegal", homeFlag: "🇳🇴", awayFlag: "🇸🇳" },
  { id: "match-044", date: "2026-06-23", time: "00:00", group: "Grupo J", home: "Jordânia", away: "Argélia", homeFlag: "🇯🇴", awayFlag: "🇩🇿" },
  { id: "match-045", date: "2026-06-23", time: "14:00", group: "Grupo K", home: "Portugal", away: "Uzbequistão", homeFlag: "🇵🇹", awayFlag: "🇺🇿" },
  { id: "match-046", date: "2026-06-23", time: "17:00", group: "Grupo L", home: "Inglaterra", away: "Gana", homeFlag: ENGLAND_FLAG, awayFlag: "🇬🇭" },
  { id: "match-047", date: "2026-06-23", time: "20:00", group: "Grupo L", home: "Panamá", away: "Croácia", homeFlag: "🇵🇦", awayFlag: "🇭🇷" },
  { id: "match-048", date: "2026-06-23", time: "23:00", group: "Grupo K", home: "Colômbia", away: "República Democrática do Congo", homeFlag: "🇨🇴", awayFlag: "🇨🇩" },
  { id: "match-049", date: "2026-06-24", time: "16:00", group: "Grupo B", home: "Suíça", away: "Canadá", homeFlag: "🇨🇭", awayFlag: "🇨🇦" },
  { id: "match-050", date: "2026-06-24", time: "16:00", group: "Grupo B", home: "Bósnia e Herzegovina", away: "Catar", homeFlag: "🇧🇦", awayFlag: "🇶🇦" },
  { id: "match-051", date: "2026-06-24", time: "19:00", group: "Grupo C", home: "Escócia", away: "Brasil", homeFlag: SCOTLAND_FLAG, awayFlag: "🇧🇷" },
  { id: "match-052", date: "2026-06-24", time: "19:00", group: "Grupo C", home: "Marrocos", away: "Haiti", homeFlag: "🇲🇦", awayFlag: "🇭🇹" },
  { id: "match-053", date: "2026-06-24", time: "22:00", group: "Grupo A", home: "Tchéquia", away: "México", homeFlag: "🇨🇿", awayFlag: "🇲🇽" },
  { id: "match-054", date: "2026-06-24", time: "22:00", group: "Grupo A", home: "África do Sul", away: "República da Coreia", homeFlag: "🇿🇦", awayFlag: "🇰🇷" },
  { id: "match-055", date: "2026-06-25", time: "17:00", group: "Grupo E", home: "Equador", away: "Alemanha", homeFlag: "🇪🇨", awayFlag: "🇩🇪" },
  { id: "match-056", date: "2026-06-25", time: "17:00", group: "Grupo E", home: "Curaçao", away: "Costa do Marfim", homeFlag: "🇨🇼", awayFlag: "🇨🇮" },
  { id: "match-057", date: "2026-06-25", time: "20:00", group: "Grupo F", home: "Japão", away: "Suécia", homeFlag: "🇯🇵", awayFlag: "🇸🇪" },
  { id: "match-058", date: "2026-06-25", time: "20:00", group: "Grupo F", home: "Tunísia", away: "Holanda", homeFlag: "🇹🇳", awayFlag: "🇳🇱" },
  { id: "match-059", date: "2026-06-25", time: "23:00", group: "Grupo D", home: "Turquia", away: "Estados Unidos", homeFlag: "🇹🇷", awayFlag: "🇺🇸" },
  { id: "match-060", date: "2026-06-25", time: "23:00", group: "Grupo D", home: "Paraguai", away: "Austrália", homeFlag: "🇵🇾", awayFlag: "🇦🇺" },
  { id: "match-061", date: "2026-06-26", time: "16:00", group: "Grupo I", home: "Noruega", away: "França", homeFlag: "🇳🇴", awayFlag: "🇫🇷" },
  { id: "match-062", date: "2026-06-26", time: "16:00", group: "Grupo I", home: "Senegal", away: "Iraque", homeFlag: "🇸🇳", awayFlag: "🇮🇶" },
  { id: "match-063", date: "2026-06-26", time: "21:00", group: "Grupo H", home: "Cabo Verde", away: "Arábia Saudita", homeFlag: "🇨🇻", awayFlag: "🇸🇦" },
  { id: "match-064", date: "2026-06-26", time: "21:00", group: "Grupo H", home: "Uruguai", away: "Espanha", homeFlag: "🇺🇾", awayFlag: "🇪🇸" },
  { id: "match-065", date: "2026-06-27", time: "00:00", group: "Grupo G", home: "Egito", away: "República Islâmica do Irã", homeFlag: "🇪🇬", awayFlag: "🇮🇷" },
  { id: "match-066", date: "2026-06-27", time: "00:00", group: "Grupo G", home: "Nova Zelândia", away: "Bélgica", homeFlag: "🇳🇿", awayFlag: "🇧🇪" },
  { id: "match-067", date: "2026-06-27", time: "18:00", group: "Grupo L", home: "Panamá", away: "Inglaterra", homeFlag: "🇵🇦", awayFlag: ENGLAND_FLAG },
  { id: "match-068", date: "2026-06-27", time: "18:00", group: "Grupo L", home: "Croácia", away: "Gana", homeFlag: "🇭🇷", awayFlag: "🇬🇭" },
  { id: "match-069", date: "2026-06-27", time: "20:30", group: "Grupo K", home: "Colômbia", away: "Portugal", homeFlag: "🇨🇴", awayFlag: "🇵🇹" },
  { id: "match-070", date: "2026-06-27", time: "20:30", group: "Grupo K", home: "República Democrática do Congo", away: "Uzbequistão", homeFlag: "🇨🇩", awayFlag: "🇺🇿" },
  { id: "match-071", date: "2026-06-27", time: "23:00", group: "Grupo J", home: "Argélia", away: "Áustria", homeFlag: "🇩🇿", awayFlag: "🇦🇹" },
  { id: "match-072", date: "2026-06-27", time: "23:00", group: "Grupo J", home: "Jordânia", away: "Argentina", homeFlag: "🇯🇴", awayFlag: "🇦🇷" },
] satisfies SeedMatch[];

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

export function getTodayInSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function isMatchUnlocked(matchDate: string, today = getTodayInSaoPaulo()) {
  return matchDate <= today;
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

  const existing = rowsOf(await sql`
    SELECT
      (SELECT COUNT(*)::int FROM matches) AS matches,
      (SELECT COUNT(*)::int FROM predictions) AS predictions
  `);
  const matchCount = Number(existing[0]?.matches ?? 0);
  const predictionCount = Number(existing[0]?.predictions ?? 0);

  if (matchCount === 0) {
    await seedOfficialMatches();
  } else if (matchCount < seedMatches.length && predictionCount === 0) {
    await sql`DELETE FROM matches`;
    await seedOfficialMatches();
  } else {
    await seedOfficialMatches();
  }

  schemaReady = true;
}

async function seedOfficialMatches() {
  const sql = getSql();

  for (const item of seedMatches) {
    await sql`
      INSERT INTO matches (
        id, match_date, kickoff_time, group_name, home_team, away_team, home_flag, away_flag
      )
      VALUES (
        ${item.id},
        ${item.date}::date,
        ${item.time}::time,
        ${item.group},
        ${item.home},
        ${item.away},
        ${item.homeFlag},
        ${item.awayFlag}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        match_date = excluded.match_date,
        kickoff_time = excluded.kickoff_time,
        group_name = excluded.group_name,
        home_team = excluded.home_team,
        away_team = excluded.away_team,
        home_flag = excluded.home_flag,
        away_flag = excluded.away_flag
    `;
  }
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
