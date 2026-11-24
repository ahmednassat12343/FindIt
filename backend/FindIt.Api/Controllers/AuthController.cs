using FindIt.Api.Models;
using FindIt.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FindIt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(InMemoryFindItStore store) : ControllerBase
{
    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            request.Password.Length < 8)
        {
            return BadRequest(new { error = "Name, valid email, and a password of at least 8 characters are required." });
        }

        var (ok, error, user) = store.Register(request);
        if (!ok || user is null) return Conflict(new { error });

        return Created($"/api/users/{user.UserId}", new { user.UserId, user.Name, user.Email, user.Role });
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = store.Authenticate(request.Email, request.Password);
        if (user is null) return Unauthorized(new { error = "Invalid email or password." });

        return Ok(new { user.UserId, user.Name, user.Email, user.Role });
    }
}
