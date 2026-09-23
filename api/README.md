# EvoTech API

ASP.NET Core 10 Web API backing the EVOTECH shop frontend.
PostgreSQL 18 in Docker, EF Core 10, JWT bearer auth.

> **Just want it running to develop the frontend against?**
> See [GETTING-STARTED.md](GETTING-STARTED.md) — Docker Desktop and two
> commands, no .NET needed. This file is for working *on* the API.

```
api/
  EvotechDatabase/docker-compose.yml   Postgres + the API, both containerised
  EvoTech.Api/
    Dockerfile                         builds the API image
    Program.cs                         config, services, pipeline
    Domain/                            plain entities — no EF references
    Data/
      AppDbContext.cs
      Configurations/                  IEntityTypeConfiguration<T> per entity
    Migrations/                        generated; commit them
    Features/                          controllers + DTOs, grouped by capability
```

**The one architectural rule:** `Domain` references nothing. `Data` references
`Domain`. `Features` reference both. Nothing points backwards — in particular,
no `using Microsoft.EntityFrameworkCore` anywhere in `Domain/`. All persistence
detail lives in `Data/Configurations/`.

---

## Running it

There are two ways in. Pick by what you are doing, not by preference.

### A. Just consuming the API — everything in Docker

For the frontend developer, or anyone who wants the API running without
touching C#. **Docker Desktop is the only prerequisite** — no .NET SDK, no
`dotnet-ef`, no secrets to configure.

```bash
cd api/EvotechDatabase && docker compose up
```

That builds the API image, starts Postgres, waits for it to report healthy,
then starts the API — which applies any pending migrations on startup. A clean
clone gets a working database with no extra steps.

- API: http://localhost:4000
- Scalar UI: http://localhost:4000/scalar/v1
- OpenAPI document: http://localhost:4000/openapi/v1.json

The database starts **empty**. Create a brand, then a category, then a product
— products need both ids.

Add `--build` after changing C#, otherwise Compose reuses the cached image.

### B. Working on the API — Postgres in Docker, API locally

Rebuilding an image per change is too slow to develop against, so run only the
database in Docker:

```bash
cd api/EvotechDatabase && docker compose up -d evotech-db
```

```bash
cd api/EvoTech.Api && dotnet run --launch-profile http
```

Use the `http` launch profile, **not** `IIS Express` — that one runs on a
different port and the frontend's calls to :4000 will go nowhere.

This path needs first-time setup (below); mode A does not.

### First-time setup — mode B only

Secrets live in user-secrets, never in `appsettings.json`:

```bash
dotnet user-secrets set "Jwt:Key" "<32+ random bytes, e.g. openssl rand -base64 32>"
```

```bash
dotnet user-secrets set "ConnectionStrings:Postgres" "Host=localhost;Port=5432;Database=evotech;Username=postgres;Password=evotech"
```

Then `dotnet ef database update` to build the schema.

Note the host differs between the two modes: `localhost` running on your
machine, `evotech-db` from inside a container — because inside a container,
`localhost` means *that container*. Both are correct from their own vantage
point. Compose supplies its value as the `ConnectionStrings__Postgres`
environment variable; ASP.NET Core maps `__` to `:`, so it overrides
`appsettings.json` with no code change.

### Migrations on startup

`Program.cs` calls `Database.MigrateAsync()` **when the environment is
Development**, which is what makes mode A a single command. It is deliberately
not done in production: two instances starting together race each other, and an
application that can alter its own schema is a privilege a production process
should not hold. There, migrations are a deploy step with their own credentials.

### A harmless log line

```
Error: libgssapi_krb5.so.2: cannot open shared object file
```

Npgsql probing for Kerberos support that the slim runtime image does not carry.
Authentication here is by password, the connection succeeds, and nothing is
wrong — it is just printed by the native loader as "Error".

---

## EF Core migrations

A migration is a **diff between two model states**, not a description of the
database. `migrations add` compares your model against
`Migrations/AppDbContextModelSnapshot.cs` — a generated file the tooling
rewrites on every add — and writes out only what changed.

Applied migrations are recorded in the `__EFMigrationsHistory` table *in the
database*, which is how EF knows what to skip. That makes `database update`
safe to run repeatedly.

Run from `api/EvoTech.Api/`, or append `--project api/EvoTech.Api`.

| Command | What it does |
|---|---|
| `dotnet ef migrations add <Name>` | Diff model vs snapshot, write a new migration |
| `dotnet ef migrations list` | All migrations, and which are applied |
| `dotnet ef migrations remove` | Delete the last migration, rewind the snapshot. **Only if unapplied** |
| `dotnet ef database update` | Apply all pending migrations |
| `dotnet ef database update <Name>` | Roll forward *or back* to that migration — runs `Down()` going back |
| `dotnet ef database update 0` | Undo everything; migration files kept |
| `dotnet ef migrations script` | Print the real SQL without touching the database |
| `dotnet ef migrations script <from> <to>` | SQL for a range — what you hand a DBA |
| `dotnet ef migrations has-pending-model-changes` | Model changed but no migration added? Good CI check |
| `dotnet ef dbcontext info` | Which provider and connection string actually resolve |

**To undo something already applied:** `database update <PreviousMigration>`
first, then `migrations remove`. In that order — `remove` refuses while the
migration is still applied.

### The daily loop

1. Edit an entity or a configuration
2. `dotnet ef migrations add <DescriptiveName>`
3. **Read the generated file** — the step everyone skips
4. `dotnet ef database update`
5. `\d <table>` in psql to confirm

Step 3 matters: in a model diff, a rename is indistinguishable from "drop this
column, add that one", and EF generates the destructive version. Reading the
migration is how you catch it.

### Rules

- **Never edit a migration applied anywhere but your own machine.** Its id is
  already in other databases' history tables; they will never re-run it. Fix
  forward with a new migration.
- **Commit migrations to git.** They are source, not build output.
- **Never hand-edit `AppDbContextModelSnapshot.cs`** or delete a migration file
  manually — the snapshot would then describe a schema that does not exist, and
  every future diff is computed against that lie.
- **Name migrations meaningfully.** `AddSupplierToProduct`, not `Migration2`.

---

## .NET

| Command | |
|---|---|
| `dotnet build` | Compile |
| `dotnet run --launch-profile http` | Run on port 4000 |
| `dotnet user-secrets list` | Show local secrets |
| `dotnet user-secrets set "Key" "value"` | Set one |
| `dotnet add package <Name>` | Add a dependency |
| `dotnet remove package <Name>` | Remove one |

## Docker

Run from `api/EvotechDatabase/`.

| Command | |
|---|---|
| `docker compose up` | Start **everything** — Postgres and the API |
| `docker compose up -d evotech-db` | Start **only** Postgres, for local API development |
| `docker compose up --build` | Rebuild the API image after changing C# |
| `docker compose ps` | Running? Healthy? |
| `docker compose logs -f evotech-api` | Follow the API log |
| `docker compose logs -f evotech-db` | Follow the Postgres log |
| `docker compose down` | Stop. **Data survives** |
| `docker compose down -v` | Stop and delete the volume. **Data gone** |
| `docker exec -it evotech-db psql -U postgres -d evotech` | psql shell in the container |

`down` versus `down -v` is the distinction worth burning in.

## psql

| | |
|---|---|
| `\dt` | List tables |
| `\d products` | Describe a table — columns, indexes, constraints, FKs |
| `\di` | List indexes |
| `\l` | List databases |
| `\x` | Toggle expanded output — essential for wide rows |
| `\timing` | Show query durations |
| `\e` | Open the last query in an editor |
| `\q` | Quit |

`\d <table>` is the one you will use most: it is how you verify a migration did
what you expected.

---

## Conventions

- **snake_case** tables and columns, via `UseSnakeCaseNamingConvention()`.
  Postgres folds unquoted identifiers to lowercase, so without it every
  identifier needs quoting forever.
- **Money is `decimal` with `HasPrecision(12, 2)`.** Never `float`/`double`, and
  never left unconfigured — bare `numeric` accepts `3.14159` as a price.
- **Timestamps are `DateTimeOffset`**, stored as `timestamptz`.
- **Ids are `long`**, `GENERATED BY DEFAULT AS IDENTITY`.
- **Enums are stored as text** via `HasConversion<string>()`, with a `CHECK`
  constraint listing the allowed values. Readable in psql, and reordering the
  C# enum is safe — but *renaming* a member breaks existing rows, and adding a
  value means extending the CHECK in a new migration.
- **Nothing is hard-deleted.** Brands have `IsActive`, products have
  `IsArchived`, and foreign keys are `ON DELETE RESTRICT`.
- **Never return an entity from a controller.** DTOs live beside the controller
  that returns them.
