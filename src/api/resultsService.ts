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

function extractResults(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.resultats)) return data.resultats;
  if (Array.isArray(data.results)) return data.results;

  return [];
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

export async function getAthleteResults(athleteId: number): Promise<AthleteResult[]> {
  const { data } = await http.get(`${API_BASE_URL}/api/athletes/${athleteId}/resultats`);
  return extractResults(data).map(normalizeResult);
}
