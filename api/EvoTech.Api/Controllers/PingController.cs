using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvoTech.Api.Controllers;

/// <summary>
/// Throwaway controller that proves the step 2 pipeline works.
/// Delete it once the real controllers exist.
/// </summary>
[ApiController]
[Route("api/v1/ping")]
public class PingController : ControllerBase
{
    // No attribute at all = anonymous. Proves routing and Kestrel work.
    [HttpGet("open")]
    public IActionResult Open() => Ok(new { status = "ok" });

    // [Authorize] does not name a role, so it means only "must be
    // authenticated". Proves the JwtBearer handler loaded and is rejecting.
    [HttpGet("secure")]
    [Authorize]
    public IActionResult Secure() => Ok(new
    {
        status = "ok",
        // Populated by UseAuthentication() from the token's claims.
        name = User.Identity?.Name,
        claims = User.Claims.Select(c => new { c.Type, c.Value })
    });
}
