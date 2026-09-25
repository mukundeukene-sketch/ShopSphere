using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopSphere.API.Data;
using ShopSphere.API.DTOs;
using ShopSphere.API.Models;

namespace ShopSphere.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuthController(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================
    // REGISTER
    // POST: api/Auth/register
    // =========================

    [HttpPost("register")]
    public async Task<ActionResult> Register(
        [FromBody] RegisterDto dto)
    {
        var email = dto.Email.Trim().ToLower();

        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);

        if (existingUser != null)
        {
            return Conflict(new
            {
                message = "An account with this email already exists."
            });
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                dto.Password
            ),
            Role = "Customer"
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return StatusCode(201, new
        {
            message = "Registration successful.",
            user = new
            {
                userId = user.Id,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role
            }
        });
    }

    // =========================
    // LOGIN
    // POST: api/Auth/login
    // =========================

    [HttpPost("login")]
    public async Task<ActionResult> Login(
        [FromBody] LoginDto dto)
    {
        var email = dto.Email.Trim().ToLower();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        var passwordValid =
            BCrypt.Net.BCrypt.Verify(
                dto.Password,
                user.PasswordHash
            );

        if (!passwordValid)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        return Ok(new AuthResponseDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            Token = $"demo-token-{user.Id}"
        });
    }
}