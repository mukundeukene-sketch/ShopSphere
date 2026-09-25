using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopSphere.API.Data;
using ShopSphere.API.DTOs;
using ShopSphere.API.Models;

namespace ShopSphere.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CartController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Cart/1
    [HttpGet("{userId:int}")]
    public async Task<ActionResult> GetCart(int userId)
    {
        var cartItems = await _context.CartItems
            .Include(c => c.Product)
            .Where(c => c.UserId == userId)
            .Select(c => new CartItemDto
            {
                Id = c.Id,
                ProductId = c.ProductId,
                ProductName = c.Product != null
                    ? c.Product.Name
                    : string.Empty,
                ImageUrl = c.Product != null
                    ? c.Product.ImageUrl
                    : string.Empty,
                UnitPrice = c.Product != null
                    ? c.Product.Price
                    : 0,
                Quantity = c.Quantity,
                TotalPrice = c.Product != null
                    ? c.Product.Price * c.Quantity
                    : 0,
                AvailableStock = c.Product != null
                    ? c.Product.StockQuantity
                    : 0
            })
            .ToListAsync();

        var subtotal = cartItems.Sum(c => c.TotalPrice);

        return Ok(new
        {
            items = cartItems,
            itemCount = cartItems.Sum(c => c.Quantity),
            subtotal
        });
    }

    // POST: api/Cart/1
    [HttpPost("{userId:int}")]
    public async Task<ActionResult> AddToCart(
        int userId,
        [FromBody] AddToCartDto dto)
    {
        var userExists = await _context.Users
            .AnyAsync(u => u.Id == userId);

        if (!userExists)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var product = await _context.Products
            .FirstOrDefaultAsync(p =>
                p.Id == dto.ProductId &&
                p.IsActive);

        if (product == null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }

        if (product.StockQuantity < dto.Quantity)
        {
            return BadRequest(new
            {
                message = "Requested quantity is not available in stock."
            });
        }

        var existingItem = await _context.CartItems
            .FirstOrDefaultAsync(c =>
                c.UserId == userId &&
                c.ProductId == dto.ProductId);

        if (existingItem != null)
        {
            var newQuantity = existingItem.Quantity + dto.Quantity;

            if (newQuantity > product.StockQuantity)
            {
                return BadRequest(new
                {
                    message = "Requested quantity exceeds available stock."
                });
            }

            existingItem.Quantity = newQuantity;
        }
        else
        {
            var cartItem = new CartItem
            {
                UserId = userId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity
            };

            _context.CartItems.Add(cartItem);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Product added to cart successfully."
        });
    }

    // PUT: api/Cart/1/3
    [HttpPut("{userId:int}/{cartItemId:int}")]
    public async Task<ActionResult> UpdateCartItem(
        int userId,
        int cartItemId,
        [FromBody] int quantity)
    {
        if (quantity < 1)
        {
            return BadRequest(new
            {
                message = "Quantity must be at least 1."
            });
        }

        var cartItem = await _context.CartItems
            .Include(c => c.Product)
            .FirstOrDefaultAsync(c =>
                c.Id == cartItemId &&
                c.UserId == userId);

        if (cartItem == null)
        {
            return NotFound(new
            {
                message = "Cart item not found."
            });
        }

        if (cartItem.Product == null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }

        if (quantity > cartItem.Product.StockQuantity)
        {
            return BadRequest(new
            {
                message = "Requested quantity exceeds available stock."
            });
        }

        cartItem.Quantity = quantity;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Cart quantity updated successfully."
        });
    }

    // DELETE: api/Cart/1/3
    [HttpDelete("{userId:int}/{cartItemId:int}")]
    public async Task<IActionResult> RemoveFromCart(
        int userId,
        int cartItemId)
    {
        var cartItem = await _context.CartItems
            .FirstOrDefaultAsync(c =>
                c.Id == cartItemId &&
                c.UserId == userId);

        if (cartItem == null)
        {
            return NotFound(new
            {
                message = "Cart item not found."
            });
        }

        _context.CartItems.Remove(cartItem);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Product removed from cart successfully."
        });
    }

    // DELETE: api/Cart/1
    [HttpDelete("{userId:int}")]
    public async Task<IActionResult> ClearCart(int userId)
    {
        var cartItems = await _context.CartItems
            .Where(c => c.UserId == userId)
            .ToListAsync();

        if (!cartItems.Any())
        {
            return Ok(new
            {
                message = "Cart is already empty."
            });
        }

        _context.CartItems.RemoveRange(cartItems);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Cart cleared successfully."
        });
    }
}