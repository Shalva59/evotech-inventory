using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvoTech.Api.Controllers;

[ApiController]
[Route("api/v1/ping")]
public class PingController : ControllerBase
{
    [HttpGet("open")]
    public IActionResult Open() => Ok(new { status = "ok" });

    [HttpGet("secure")]
    [Authorize]
    public IActionResult Secure() => Ok(new
    {
        status = "ok",
        name = User.Identity?.Name,
        claims = User.Claims.Select(c => new { c.Type, c.Value })
    });
}
