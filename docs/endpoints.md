# Documentation de endpoints

Base URLs configurables via variables d’environnement:
- NEXT_PUBLIC_AUTH_BASE / VITE_AUTH_BASE (ex: http://localhost:8081)
- NEXT_PUBLIC_EVENTS_BASE / VITE_EVENTS_BASE (ex: http://localhost:8082)
- NEXT_PUBLIC_INCIDENTS_BASE / VITE_INCIDENTS_BASE (ex: http://localhost:8084)
- NEXT_PUBLIC_TICKETS_BASE / VITE_TICKETS_BASE (ex: http://localhost:8083/api)

Liste des endpoints par microservice

incident-service
- GET/POST    {INCIDENTS_BASE}/api/incidents
- GET/PUT/DEL {INCIDENTS_BASE}/api/incidents/{id}

event-service
- GET/POST    {EVENTS_BASE}/lieux
- GET/PUT/DEL {EVENTS_BASE}/lieux/{id}
- GET/POST    {EVENTS_BASE}/events
- GET/PUT/DEL {EVENTS_BASE}/events/{id}
- GET/POST    {EVENTS_BASE}/epreuves
- GET/PUT/DEL {EVENTS_BASE}/epreuves/{id}
- GET/POST    {EVENTS_BASE}/competitions
- GET/PUT/DEL {EVENTS_BASE}/competitions/{id}
- GET/POST/DEL {EVENTS_BASE}/admin/events
- DEL         {EVENTS_BASE}/admin/events/{id}
- POST        {EVENTS_BASE}/admin/events/{eventId}/competitions
- POST        {EVENTS_BASE}/admin/events/competitions/{competitionId}/epreuves

auth-service
- POST {AUTH_BASE}/auth/user/upload-documents
- POST {AUTH_BASE}/auth/admin/validate-athlete
- GET  {AUTH_BASE}/auth/user/username/{username}
- GET  {AUTH_BASE}/auth/hello
- POST {AUTH_BASE}/auth/login
- POST {AUTH_BASE}/auth/register

billetterie
- GET/POST    {TICKETS_BASE}/tickets
- GET/PUT/DEL {TICKETS_BASE}/tickets/{id}
- GET         {TICKETS_BASE}/tickets/price
