# RAF Tool — Deployment

Architecture: **frontend** (static Vite/React) on **Netlify**, **backend** (Express API) on **Railway**.
The frontend calls relative `/api/*` paths; Netlify proxies those to the Railway backend, so there is
no backend URL baked into the client and no CORS to manage.

```
Browser ──> Netlify (static frontend, /api/* proxy) ──> Railway (Express API) ──> Anthropic API
```

---

## 1. Test everything locally with Docker (do this first)

Prerequisite: Docker Desktop running, and `app/server/.env` filled in (copy `app/server/.env.example`).

```bash
cd app
docker compose up --build
```

- Frontend: <http://localhost:8080>
- Backend:  <http://localhost:8787/api/health> → `{"ok":true}`

The frontend container (nginx) proxies `/api` to the backend container, mirroring the Netlify→Railway
split. Upload GIS/LTR/FS/CBR documents and click **Generate** to exercise the full path. Stop with
`Ctrl+C`; `docker compose down` to remove containers.

To build/run a single service:
```bash
docker build -t raf-api ./server        # backend image (same one Railway builds)
docker run --rm -p 8787:8787 --env-file ./server/.env raf-api
```

---

## 2. Deploy the backend to Railway

1. Push this repo to GitHub.
2. Railway → **New Project → Deploy from GitHub repo**.
3. In the service **Settings**:
   - **Root Directory**: `app/server`  (Railway then uses `app/server/Dockerfile` and `railway.json`).
   - Build/start are handled by the Dockerfile — no start command needed.
4. Service → **Variables**, add:
   - `ANTHROPIC_API_KEY` = your key
   - `ANTHROPIC_MODEL` = `claude-sonnet-5` (optional)
   - Do **not** set `PORT` — Railway injects it automatically.
5. Deploy. Under **Settings → Networking**, generate a public domain, then confirm:
   `https://<your-app>.up.railway.app/api/health` → `{"ok":true}`

Copy that public URL for the next step.

---

## 3. Deploy the frontend to Netlify

1. Netlify → **Add new site → Import from Git**, pick this repo.
2. Netlify reads `netlify.toml` at the repo root (base `app/client`, build `npm run build`, publish `dist`) —
   leave the build settings as detected.
3. **Edit `netlify.toml`** and replace the placeholder host in the `/api/*` redirect with your Railway
   public host, then commit:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://<your-app>.up.railway.app/api/:splat"
     status = 200
     force = true
   ```
4. Deploy. Open the Netlify URL and run a generation — requests to `/api/generate` proxy through to Railway.

---

## Notes

- **Secrets**: `ANTHROPIC_API_KEY` lives only on the backend (Railway variables / local `server/.env`, which is
  gitignored and excluded from the Docker image via `.dockerignore`). It is never shipped to the browser.
- **Upload size**: the API accepts up to 20 MB per file; the local nginx proxy is set to 25 MB. Railway's proxy
  allows large bodies by default. Netlify's proxy also passes them through.
- **CORS**: not needed with the proxy setup. If you ever point the frontend directly at Railway (no proxy),
  the backend already enables permissive CORS (`app/server/index.js`), so it will still work.
- **No Docker on Netlify**: Netlify builds the static site from source; `app/client/Dockerfile` + `nginx.conf`
  are only for local `docker compose` parity.
