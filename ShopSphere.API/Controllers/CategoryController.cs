using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopSphere.API.Data;
using ShopSphere.API.DTOs;
using ShopSphere.API.Models;

namespace ShopSphere.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CategoryController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Category
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        var categories = await _context.Categories
            .Include(c => c.Products)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                ProductCount = c.Products.Count
            })
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(categories);
    }

    // GET: api/Category/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .Where(c => c.Id == id)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                ProductCount = c.Products.Count
            })
            .FirstOrDefaultAsync();

        if (category == null)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        return Ok(category);
    }

    // POST: api/Category
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory(
        [FromBody] CategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Category name is required."
            });
        }

        var exists = await _context.Categories
            .AnyAsync(c =>
                c.Name.ToLower() == dto.Name.Trim().ToLower());

        if (exists)
        {
            return Conflict(new
            {
                message = "A category with this name already exists."
            });
        }

        var category = new Category
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty
        };

        _context.Categories.Add(category);

        await _context.SaveChangesAsync();

        var response = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            ProductCount = 0
        };

        return CreatedAtAction(
            nameof(GetCategory),
            new { id = category.Id },
            response);
    }

    // PUT: api/Category/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCategory(
        int id,
        [FromBody] CategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Category name is required."
            });
        }

        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        var duplicate = await _context.Categories
            .AnyAsync(c =>
                c.Id != id &&
                c.Name.ToLower() == dto.Name.Trim().ToLower());

        if (duplicate)
        {
            return Conflict(new
            {
                message = "Another category with this name already exists."
            });
        }

        category.Name = dto.Name.Trim();
        category.Description = dto.Description?.Trim() ?? string.Empty;
        category.ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Category/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        if (category.Products.Any())
        {
            return Conflict(new
            {
                message = "Cannot delete a category that contains products."
            });
        }

        _context.Categories.Remove(category);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}