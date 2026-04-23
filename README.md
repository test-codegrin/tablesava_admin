# TableSeva Admin Frontend

Admin frontend for TableSeva vendor operations (vendor auth, vendor profile, categories, items, tables, and order lifecycle).

## Environment

Create `.env` with:

```env
VITE_API_BASE_URL=https://your-backend-base-url
```

Only `VITE_API_BASE_URL` is used for API calls.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## Backend Contract Notes

Detailed backend quirks and the Admin manual QA checklist:

- `src/docs/admin-backend-contract-notes.md`

