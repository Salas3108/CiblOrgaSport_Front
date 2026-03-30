// config/metabaseConfig.ts
// URLs d'embed signées JWT pour les graphiques Metabase (Admin_DS1)

export const METABASE_BASE_URL = 'http://137.74.133.131:3001'

const BASE = `${METABASE_BASE_URL}/embed/question`
const PARAMS = '#bordered=true&titled=false&theme=night'

export const METABASE_CHARTS = {
  // Courbe — connexions par jour (card 43)
  daily_connections:
    `${BASE}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NDN9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.yEOrZhwFwi8q3a3BwdSUjPkvM6M9mXcpLw0KM_QPu20${PARAMS}`,

  // Barres — connexions par rôle (card 44)
  role_distribution:
    `${BASE}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NDR9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.-JegVNAKT5uCa5q_iJWv_hBSaS-yFvfzNmrXmZ7mhHM${PARAMS}`,

  // Courbe — notifications par jour (card 45)
  notifications:
    `${BASE}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NDV9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.rDOMzO1G6d9as1hm4Ue6Sf4kOWaKU0XwCpNwcuLjHm0${PARAMS}`,

  // Tableau — récapitulatif hebdomadaire (card 46)
  weekly_summary:
    `${BASE}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NDZ9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.rlX2HqzRnBGR5nX76kUngZC9dbQSWSspa8LoaMu_1XM${PARAMS}`,

  // Barres — connexions par semaine (card 47)
  top_competitions:
    `${BASE}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NDd9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.pn3ip34nlsbKnoLPLsz75ZN2ZVYfFoN2R0DmL7OCDbU${PARAMS}`,

  // Courbe — taux de croissance (card 48)
  session_duration:
    `${BASE}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NDh9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.EdIJtpw_3XuFSEOpPxIQ2XoPuWvRm2wdraKqfpL0e04${PARAMS}`,
} as const

export type ChartKey = keyof typeof METABASE_CHARTS
