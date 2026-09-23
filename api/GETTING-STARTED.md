# Running the EvoTech API

For anyone who wants the backend running without touching C#. No .NET, no
database setup — Docker does all of it.

If you are working *on* the API rather than just using it, read
[README.md](README.md) instead.

---

## 1. Start Docker Desktop

Open it from the Start menu. Wait until the whale icon in the bottom-left is
**green** and says **"Engine running"**.

First launch may ask you to accept terms, install WSL 2, and restart your PC.
Do whatever it asks.

**Nothing below works until that icon is green.**

## 2. Open a terminal in the project

Easiest way: open the `evotech-inventory` project in **VS Code**, then press
**Ctrl + `** (backtick — the key above Tab). A terminal opens at the bottom,
already in the right folder.

You should see something like `PS C:\...\evotech-inventory>`.

## 3. Get the latest code

```bash
git checkout main
```

```bash
git pull
```

## 4. Go to the Docker folder

```bash
cd api/EvotechDatabase
```

## 5. Start everything

```bash
docker compose up
```

**The first run takes 3–5 minutes.** It downloads PostgreSQL and the .NET build
tools, then compiles the API. Lots of scrolling text is normal.

Later runs take seconds.

## 6. Wait for this line

```
evotech-api  | Now listening on: http://[::]:8080
```

That means it is ready.

**The terminal keeps printing and looks "stuck" — it is not frozen.** It is
showing live logs. Leave the window open; the API runs for as long as it is
open. If you need to type other commands, open a **second** terminal.

## 7. Open it

**http://localhost:4000/scalar/v1**

A page listing every endpoint, each with a **Test Request** button.

Try `GET /api/v1/brands`. It returns `[]` because the database is empty — that
is correct, not broken.

---

## Using it from the frontend

**Base URL:** `http://localhost:4000/api/v1`

The API already accepts requests from `http://localhost:3000`, so there is
nothing to configure on the frontend side.

### The database starts empty

Create things in this order — each one needs the one before it:

| Step | Endpoint | Example body |
|---|---|---|
| 1. Brand | `POST /api/v1/brands` | `{"name": "Apple"}` |
| 2. Category | `POST /api/v1/categories` | `{"name": "Screens"}` |
| 3. Product | `POST /api/v1/products` | needs `brandId` and `categoryId` from above |
| 4. Stock | `POST /api/v1/stock-movements` | `{"productId": 1, "quantity": 20, "kind": "Purchase"}` |

Categories are a tree of any depth — pass `parentId` to nest one under another,
and `depth` comes back calculated.

Product stock is **not** a field you set. It is the sum of that product's stock
movements, calculated on every read.

### The API contract

**http://localhost:4000/openapi/v1.json** is the source of truth, and you can
generate a typed client from it.

The older `backend/API.md` is **out of date** — it describes a `models` entity
that no longer exists, a fixed category/subcategory pair instead of a tree, and
a different error format. Do not build against it.

Errors are RFC 7807 ProblemDetails — `title`, `detail`, `status`, and an
`errors` object for validation failures:

```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "Name": ["Brand name is required."] }
}
```

### Available endpoints

`/brands`, `/categories`, `/products`, `/stock-movements`

No authentication yet — everything is open.

---

## Stopping and restarting

| What you want | Command |
|---|---|
| Stop it | Click the terminal, press **Ctrl + C** |
| Start again | `docker compose up` |
| Start in the background (no log window) | `docker compose up -d` |
| See the logs | `docker compose logs -f` |
| Stop and keep your data | `docker compose down` |
| **Delete the database** | `docker compose down -v` ← wipes everything |

Data survives restarts. Only `-v` deletes it.

---

## If something goes wrong

**"cannot connect to the Docker daemon"**
Docker Desktop is not running. Back to step 1.

**"port is already allocated"**
Something else is using port 4000 or 5432 — usually a PostgreSQL installed
directly on Windows. Run `docker compose down` first; if it persists, say so.

**Red text mentioning `libgssapi_krb5.so.2`**
Harmless. Ignore it — everything works.

**It worked yesterday, not today**
`docker compose down`, then `docker compose up`.

**localhost:4000 will not load**
Check the terminal for the "Now listening" line. If it is missing, it is either
still starting or it crashed — copy the last 20 lines and send them over.

**You changed C# and nothing changed**
`docker compose up --build`. Without `--build`, Docker reuses the image it
already built.
