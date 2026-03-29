"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Trophy } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getMyResults, type AthleteResult } from "@/src/api/resultsService"
import { getRole } from "@/lib/jwt"

function getMedalLabel(medaille: AthleteResult["medaille"]) {
  if (medaille === "OR") return "Or"
  if (medaille === "ARGENT") return "Argent"
  if (medaille === "BRONZE") return "Bronze"
  return "-"
}

function getStatusLabel(statut: AthleteResult["statut"]) {
  if (statut === "VALIDE") return "Validé"
  if (statut === "FORFAIT") return "Forfait"
  return "En attente"
}

function getStatusVariant(statut: AthleteResult["statut"]): "default" | "secondary" | "destructive" {
  if (statut === "VALIDE") return "default"
  if (statut === "FORFAIT") return "destructive"
  return "secondary"
}

export default function ResultsPage() {
  const [results, setResults] = useState<AthleteResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canReadResults, setCanReadResults] = useState(true)

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (a.dateResultat && b.dateResultat) {
        return new Date(b.dateResultat).getTime() - new Date(a.dateResultat).getTime()
      }

      const aEpreuve = a.epreuveId ?? Number.MAX_SAFE_INTEGER
      const bEpreuve = b.epreuveId ?? Number.MAX_SAFE_INTEGER
      if (aEpreuve !== bEpreuve) return aEpreuve - bEpreuve

      const aRank = a.classement ?? Number.MAX_SAFE_INTEGER
      const bRank = b.classement ?? Number.MAX_SAFE_INTEGER
      return aRank - bRank
    })
  }, [results])

  const loadResults = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMyResults()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des résultats")
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const role = getRole()
    const isAthlete = role === "ATHLETE" || role === "ROLE_ATHLETE"
    if (!isAthlete) {
      setCanReadResults(false)
      setLoading(false)
      setResults([])
      return
    }

    setCanReadResults(true)
    loadResults()
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Mes résultats</h1>
              <p className="text-muted-foreground">Résultats réels récupérés depuis le backend</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Performances</span>
                </CardTitle>
                <CardDescription>Classements, médailles et statuts de publication</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-3 text-sm text-muted-foreground">Chargement des résultats...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                    <p className="mt-3 text-sm text-muted-foreground">{error}</p>
                    <Button onClick={loadResults} className="mt-4">
                      Réessayer
                    </Button>
                  </div>
                ) : !canReadResults ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Cette page est réservée aux athlètes connectés.
                    </p>
                  </div>
                ) : sortedResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="mt-3 text-sm text-muted-foreground">Aucun résultat disponible pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedResults.map((result) => (
                      <div key={result.id} className="rounded-lg border p-4 bg-card">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="font-medium">{result.epreuveNom || "Épreuve"}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {result.discipline && <span>{result.discipline}</span>}
                              {result.niveauEpreuve && <Badge variant="outline">{result.niveauEpreuve}</Badge>}
                            </div>
                            {result.dateResultat && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(result.dateResultat).toLocaleString("fr-FR")}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getStatusVariant(result.statut)}>{getStatusLabel(result.statut)}</Badge>
                            <Badge variant={result.published ? "default" : "secondary"}>
                              {result.published ? "Publié" : "Non publié"}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">Performance</p>
                            <p className="font-semibold">
                              {result.valeurPrincipale || "-"}
                              {result.unite ? ` ${result.unite}` : ""}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">Classement</p>
                            <p className="font-semibold">{result.classement ?? "-"}</p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">Médaille</p>
                            <p className="font-semibold">{getMedalLabel(result.medaille)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
