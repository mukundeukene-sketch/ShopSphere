using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopSphere.API.Data;
using ShopSphere.API.DTOs;
using ShopSphere.API.Models;

namespace ShopSphere.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProductController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Product
    // Search + Filter + Sort + Pagination
    [HttpGet]
    public async Task<ActionResult> GetProducts(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] string? sortOrder = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        // Validate pagination
        if (page < 1)
            page = 1;

        if (pageSize < 1)
            pageSize = 10;

        if (pageSize > 100)
            pageSize = 100;

        var query = _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive)
            .AsQueryable();

        // Search
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim().ToLower();

            query = query.Where(p =>
                p.Name.ToLower().Contains(searchTerm) ||
                p.Description.ToLower().Contains(searchTerm));
        }

        // Category filter
        if (categoryId.HasValue)
        {
            query = query.Where(p =>
                p.CategoryId == categoryId.Value);
        }

        // Minimum price
        if (minPrice.HasValue)
        {
            query = query.Where(p =>
                p.Price >= minPrice.Value);
        }

        // Maximum price
        if (maxPrice.HasValue)
        {
            query = query.Where(p =>
                p.Price <= maxPrice.Value);
        }

        // Total count before pagination
        var totalProducts = await query.CountAsync();

        // Sorting
        sortBy = sortBy?.Trim().ToLower();
        sortOrder = sortOrder?.Trim().ToLower();

        query = sortBy switch
        {
            "name" => sortOrder == "asc"
                ? query.OrderBy(p => p.Name)
                : query.OrderByDescending(p => p.Name),

            "price" => sortOrder == "asc"
                ? query.OrderBy(p => p.Price)
                : query.OrderByDescending(p => p.Price),

            "stock" => sortOrder == "asc"
                ? query.OrderBy(p => p.StockQuantity)
                : query.OrderByDescending(p => p.StockQuantity),

            _ => sortOrder == "asc"
                ? query.OrderBy(p => p.CreatedAt)
                : query.OrderByDescending(p => p.CreatedAt)
        };

        // Pagination
        var products = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                ImageUrl = p.ImageUrl,
                IsActive = p.IsActive,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null
                    ? p.Category.Name
                    : string.Empty,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        var totalPages = (int)Math.Ceiling(
            totalProducts / (double)pageSize);

        return Ok(new
        {
            data = products,
            pagination = new
            {
                currentPage = page,
                pageSize,
                totalProducts,
                totalPages,
                hasPreviousPage = page > 1,
                hasNextPage = page < totalPages
            }
        });
    }

    // GET: api/Product/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.Id == id)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                ImageUrl = p.ImageUrl,
                IsActive = p.IsActive,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null
                    ? p.Category.Name
                    : string.Empty,
                CreatedAt = p.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (product == null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }

        return Ok(product);
    }

    // POST: api/Product
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct(
        [FromBody] CreateProductDto dto)
    {
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == dto.CategoryId);

        if (!categoryExists)
        {
            return BadRequest(new
            {
                message = "Invalid category ID."
            });
        }

        var product = new Product
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            Price = dto.Price,
            StockQuantity = dto.StockQuantity,
            ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty,
            CategoryId = dto.CategoryId,
            IsActive = true
        };

        _context.Products.Add(product);

        await _context.SaveChangesAsync();

        var response = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.Id == product.Id)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                ImageUrl = p.ImageUrl,
                IsActive = p.IsActive,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null
                    ? p.Category.Name
                    : string.Empty,
                CreatedAt = p.CreatedAt
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetProduct),
            new { id = product.Id },
            response);
    }

    // PUT: api/Product/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProduct(
        int id,
        [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);

        if (product == null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == dto.CategoryId);

        if (!categoryExists)
        {
            return BadRequest(new
            {
                message = "Invalid category ID."
            });
        }

        product.Name = dto.Name.Trim();
        product.Description = dto.Description?.Trim() ?? string.Empty;
        product.Price = dto.Price;
        product.StockQuantity = dto.StockQuantity;
        product.ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty;
        product.CategoryId = dto.CategoryId;
        product.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Product/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);

        if (product == null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }

        _context.Products.Remove(product);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}