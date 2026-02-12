Backend integration notes
=========================

Quick setup
- copy `.env.example` to `.env` and set `VITE_API_URL` to your backend URL
- install dependencies: `npm install` (or `yarn` / `pnpm`)
- run dev: `npm run dev`

Expected endpoints
- GET /ambulances -> returns array of ambulance objects
- POST /ambulances -> create ambulance, returns created object
- PATCH /ambulances/:id -> update ambulance (e.g., availability), returns updated object
- GET /users/me -> user profile
- GET /expenses -> list of expenses
- POST /expenses -> create expense

Minimal ambulance object shape
{
  id: string,
  ownerName: string,
  licenseNumber: string,
  ambulanceNumber: string,
  vehicleType: string,
  contact: string,
  available: boolean
}

Notes
- The frontend uses `import.meta.env.VITE_API_URL` to set the API base URL.
- We added `src/lib/api.ts` (axios client) and wired `AppContext` to fetch ambulances on startup.
- `AmbulanceAdmin` now calls the backend to register ambulances and toggle availability.
