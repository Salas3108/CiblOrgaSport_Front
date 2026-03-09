// config/metabaseConfig.ts
// Centralise toutes les URLs des iframes Metabase.
//
// ── COMMENT RÉCUPÉRER LES TOKENS ─────────────────────────────────────────────
// 1. Connectez-vous sur http://localhost:3001
// 2. Ouvrez la question ou le dashboard à intégrer
// 3. Cliquez sur les trois points (•••) → "Embed in your application"
// 4. Activez l'option "Enable embedding"
// 5. Copiez l'URL générée dans la section "Embedding URL"
//    Elle ressemble à : /embed/question/eyJh...#bordered=true&titled=false
// 6. Remplacez le TOKEN_X correspondant ci-dessous par cette URL complète
// ─────────────────────────────────────────────────────────────────────────────

export const METABASE_BASE_URL = 'http://localhost:3001'

export const METABASE_CHARTS = {
  // Courbe — connexions par jour
  daily_connections:
    '/embed/question/TOKEN_1#bordered=true&titled=false&theme=night',

  // Camembert — répartition athlètes / spectateurs / volontaires
  role_distribution:
    '/embed/question/TOKEN_2#bordered=true&titled=false&theme=night',

  // Barres empilées — notifications par type
  notifications:
    '/embed/question/TOKEN_3#bordered=true&titled=false&theme=night',

  // Barres horizontales — top 5 compétitions
  top_competitions:
    '/embed/question/TOKEN_4#bordered=true&titled=false&theme=night',

  // Jauge / valeur unique — temps moyen de session
  session_duration:
    '/embed/question/TOKEN_5#bordered=true&titled=false&theme=night',

  // Tableau — récapitulatif hebdomadaire
  weekly_summary:
    '/embed/question/TOKEN_6#bordered=true&titled=false&theme=night',
} as const

export type ChartKey = keyof typeof METABASE_CHARTS
