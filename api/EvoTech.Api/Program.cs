using EvoTech.Api.Data;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// =====================================================================
// 1. CONFIGURATION — read it once, at startup, and fail loudly.
//
// Configuration is a layered dictionary. Later layers win on the same key:
//     appsettings.json → appsettings.Development.json → user-secrets → env vars
// So Jwt:Issuer can live in appsettings.json (safe to commit) while Jwt:Key
// lives only in user-secrets (never committed) and both read the same way.
//
// The `?? throw` matters. Without it a missing secret surfaces as a
// NullReferenceException on the first authenticated request, days later and
// nowhere near the cause. This way the app refuses to start and names the
// key that is missing.
// =====================================================================

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is not configured. Run: dotnet user-secrets set \"Jwt:Key\" \"<32+ bytes>\"");

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer is not configured (appsettings.json).");

var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience is not configured (appsettings.json).");

// GetSection(...).Get<string[]>() binds a JSON array into a C# array.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? throw new InvalidOperationException("Cors:AllowedOrigins is not configured (appsettings.json).");

var connectionString = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:Postgres is not configured. Run: dotnet user-secrets set \"ConnectionStrings:Postgres\" \"Host=...\"");

// A named policy. Named rather than default so that when some endpoints
// later need different rules you add a second policy instead of rewriting
// this one.
const string FrontendCors = "frontend";

// =====================================================================
// 2. SERVICES — the DI container. Nothing here runs yet; you are only
//    registering what can be constructed later.
// =====================================================================

// AddJsonOptions: System.Text.Json binds enums as NUMBERS by default, so a
// client would have to send {"kind": 0} instead of {"kind": "Purchase"}. The
// database stores these as text and the API should read the same way, so the
// string converter is registered globally.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// ---- Database ----
// The connection string comes from DI, not from an OnConfiguring override in
// AppDbContext — that keeps the database choice out of the context class and
// the credentials out of source control.
//
// UseSnakeCaseNamingConvention rewrites every table and column name:
// MinStockThreshold becomes min_stock_threshold. Postgres folds unquoted
// identifiers to lowercase, so without this EF would emit "MinStockThreshold"
// in quotes and you would have to quote it forever in psql too.
builder.Services.AddDbContext<AppDbContext>(options => options
    .UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention());

// Scans this assembly and registers every AbstractValidator<T> as IValidator<T>.
// NOTE: registering a validator does NOT make it run. Nothing in the pipeline
// invokes them — the old FluentValidation.AspNetCore auto-validation package is
// deprecated. Controllers call ApiController.ValidateAsync explicitly.
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Generates the OpenAPI document at /openapi/v1.json in development.
// This document is your contract with the frontend — your friend generates
// his client from it, so it cannot drift from the real code.
builder.Services.AddOpenApi();

// Turns unhandled exceptions into RFC 7807 ProblemDetails responses:
//   { "type": ..., "title": ..., "status": 500, "traceId": ... }
// The same shape ASP.NET Core already uses for 400s and 404s, so every
// error in the API looks identical. No custom error middleware needed.
builder.Services.AddProblemDetails();

// ---- CORS ----
// Enforced by the BROWSER, not by this server. The API answers everyone;
// the browser then refuses to hand the response to JavaScript unless the
// server named that origin. This is why "works in Postman, fails in the
// app" is the classic CORS symptom — curl and Postman ignore CORS entirely.
//
// Because our requests carry an Authorization header they are not "simple"
// requests, so the browser sends a preflight OPTIONS first ("may origin X
// send method Y with header Z?") and only sends the real request if the
// answer is yes. AllowAnyHeader is mostly there so Authorization passes.
//
// No AllowCredentials: that is for cookies, and we use a bearer token.
// Combining it with AllowAnyOrigin throws at startup by design — together
// they would let any website make authenticated requests as your logged-in
// user.
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// ---- Authentication ----
// This VALIDATES tokens. It does not create them — you will write the
// issuing code in step 5 with JsonWebTokenHandler.
//
// What it does on every request: look for `Authorization: Bearer <token>`,
// verify it, and if valid build a ClaimsPrincipal and assign it to
// HttpContext.User. If there is no token, or it is bad, it does NOTHING —
// no exception, User simply stays unauthenticated. Rejecting is a separate
// job, done by [Authorize] further down the pipeline.
//
// Remember a JWT payload is base64, NOT encrypted. Anyone can read the
// claims at jwt.io. The signature only proves nobody edited it. Never put
// a secret inside a token.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // The important one. Proves the token was minted by us and not
            // altered. Without it anyone can hand themselves an admin token.
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

            // "Issued by this system, for this API." Matters most when
            // several services share a signing key. Cheap discipline now.
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,

            // Honour the token's `exp` claim.
            ValidateLifetime = true,

            // Tolerance for unsynchronised server clocks. THE DEFAULT IS
            // FIVE MINUTES, so a token is always valid five minutes longer
            // than you think. Zero it while learning, so behaviour matches
            // intent.
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Apply pending migrations at startup — DEVELOPMENT ONLY.
//
// This is what lets `docker compose up` produce a working database with no
// extra steps. It is deliberately not done in production: two instances
// starting together would race each other, and an application that can alter
// its own schema is a privilege you do not want a production process to hold.
// There, migrations are applied by a deploy step with its own credentials.
if (app.Environment.IsDevelopment())
{
    // The DbContext is scoped, and here we are outside any request, so a
    // scope has to be created by hand.
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

// =====================================================================
// 3. THE PIPELINE — ordered, and NOT validated for you.
//
// Middleware is nested, not a list: each component wraps the next one and
// may short-circuit it. Order is behaviour.
// =====================================================================

// First, so it can catch exceptions thrown by everything after it.
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// NOTE: app.UseHttpsRedirection() was deliberately REMOVED.
// The frontend calls plain http://localhost:4000. That middleware answers
// with a 307 to https://, and CORS preflight requests do not follow
// redirects — a redirected preflight is a hard failure, so every
// authenticated call would die before the real request was ever sent.

// CORS goes early so that short-circuited responses (a 401, say) still
// carry CORS headers. Put it after authentication and your 401s come back
// without them; the browser then reports a CORS error instead of the 401,
// and you lose an hour fixing CORS when the real problem was the token.
app.UseCors(FrontendCors);

// WHO ARE YOU — reads the token, fills HttpContext.User.
app.UseAuthentication();

// WHAT MAY YOU DO — reads that same User and checks it against [Authorize].
//
// This is the whole reason for the order. Reversed, authorization inspects
// a User nobody has populated yet, so it is always anonymous, so every
// [Authorize] endpoint returns 401 forever — with a perfectly valid token,
// and no warning anywhere.
app.UseAuthorization();

app.MapControllers();

app.Run();
