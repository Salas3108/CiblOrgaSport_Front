import { http } from "./httpClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8087";

export type ResultStatus = "EN_ATTENTE" | "VALIDE" | "FORFAIT";
export type ResultMedal = "OR" | "ARGENT" | "BRONZE" | null;

export interface AthleteResult {
  id: number;
  athleteId: number | null;
  epreuveId: number | null;
  epreuveNom: string | null;
  discipline: string | null;
  niveauEpreuve: string | null;
  valeurPrincipale: string;
  unite: string | null;
  classement: number | null;
  medaille: ResultMedal;
  statut: ResultStatus;
  published: boolean;
  dateResultat: string | null;
}

interface AthleteEpreuveLike {
  id?: number | string;
  nom?: string;
}

function extractResults(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.resultats)) return data.resultats;
  if (Array.isArray(data.results)) return data.results;

  return [];
}

function extractArray(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.epreuves)) return data.epreuves;

  return [];
}

function is404(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 404;
}

function normalizeResult(item: any): AthleteResult {
  const rawStatus = String(item?.statut ?? "EN_ATTENTE").toUpperCase();
  const status: ResultStatus = rawStatus === "VALIDE" || rawStatus === "FORFAIT" ? rawStatus : "EN_ATTENTE";

  const rawMedal = item?.medaille ? String(item.medaille).toUpperCase() : null;
  const medal: ResultMedal = rawMedal === "OR" || rawMedal === "ARGENT" || rawMedal === "BRONZE" ? rawMedal : null;

  return {
    id: Number(item?.id ?? 0),
    athleteId: item?.athleteId != null ? Number(item.athleteId) : null,
    epreuveId: item?.epreuveId != null ? Number(item.epreuveId) : null,
    epreuveNom: item?.epreuveNom ?? item?.nomEpreuve ?? null,
    discipline: item?.discipline ?? null,
    niveauEpreuve: item?.niveauEpreuve ?? null,
    valeurPrincipale: String(item?.valeurPrincipale ?? ""),
    unite: item?.unite ?? null,
    classement: item?.classement != null ? Number(item.classement) : null,
    medaille: medal,
    statut: status,
    published: Boolean(item?.published),
    dateResultat: item?.dateResultat ?? item?.updatedAt ?? item?.createdAt ?? null,
  };
}

function normalizeResultsList(list: any[]): AthleteResult[] {
  return list.map(normalizeResult);
}

async function deriveResultsFromEpreuves(athleteId: number): Promise<AthleteResult[]> {
  const epreuvesResponse = await http.get(`${API_BASE_URL}/epreuves/athletes/${athleteId}`);
  const epreuves = extractArray(epreuvesResponse.data) as AthleteEpreuveLike[];

  if (epreuves.length === 0) return [];

  const perEpreuve = await Promise.allSettled(
    epreuves.map((epreuve) => http.get(`${API_BASE_URL}/resultats/commissaire/epreuves/${Number(epreuve.id)}`))
  );

  const results: AthleteResult[] = [];

  perEpreuve.forEach((settled, index) => {
    if (settled.status !== "fulfilled") return;

    const epreuve = epreuves[index];
    const rows = extractResults(settled.value.data);

    rows
      .filter((row) => Number(row?.athleteId) === athleteId)
      .forEach((row) => {
        const normalized = normalizeResult(row);
        if (!normalized.epreuveNom) normalized.epreuveNom = epreuve?.nom ?? null;
        results.push(normalized);
      });
  });

  return results;
}

export async function getAthleteResults(athleteId: number): Promise<AthleteResult[]> {
  const directCandidates = [
    `${API_BASE_URL}/api/athletes/${athleteId}/resultats`,
    `${API_BASE_URL}/athletes/${athleteId}/resultats`,
  ];

  for (const endpoint of directCandidates) {
    try {
      const { data } = await http.get(endpoint);
      return normalizeResultsList(extractResults(data));
    } catch (error) {
      if (!is404(error)) throw error;
    }
  }

  try {
    return await deriveResultsFromEpreuves(athleteId);
  } catch (error) {
    if (is404(error)) return [];
    throw error;
  }
}

export async function getMyResults(): Promise<AthleteResult[]> {
  try {
    const { data } = await http.get(`${API_BASE_URL}/resultats/me`);
    return normalizeResultsList(extractResults(data));
  } catch (error) {
    // If endpoint missing or forbidden for this token, return empty list gracefully
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 403 || status === 404) return [];
    throw error;
  }
}
