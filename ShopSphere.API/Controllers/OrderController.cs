using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopSphere.API.Data;
using ShopSphere.API.Models;

namespace ShopSphere.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrderController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrderController(ApplicationDbContext context)
    {
        _context = context;
    }

    // POST: api/Order/checkout/1
    [HttpPost("checkout/{userId:int}")]
    public async Task<ActionResult> Checkout(int userId)
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

        var cartItems = await _context.CartItems
            .Include(c => c.Product)
            .Where(c => c.UserId == userId)
            .ToListAsync();

        if (!cartItems.Any())
        {
            return BadRequest(new
            {
                message = "Your cart is empty."
            });
        }

        foreach (var item in cartItems)
        {
            if (item.Product == null)
            {
                return BadRequest(new
                {
                    message = "One or more products are no longer available."
                });
            }

            if (!item.Product.IsActive)
            {
                return BadRequest(new
                {
                    message = $"{item.Product.Name} is no longer available."
                });
            }

            if (item.Quantity > item.Product.StockQuantity)
            {
                return BadRequest(new
                {
                    message = $"Insufficient stock for {item.Product.Name}."
                });
            }
        }

        var totalAmount = cartItems.Sum(item =>
            item.Product!.Price * item.Quantity);

        var order = new Order
        {
            UserId = userId,
            TotalAmount = totalAmount,
            Status = "Confirmed",
            PaymentStatus = "Paid",
            OrderDate = DateTime.UtcNow
        };

        _context.Orders.Add(order);

        await _context.SaveChangesAsync();

        foreach (var item in cartItems)
        {
            var orderItem = new OrderItem
            {
                OrderId = order.Id,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.Product!.Price
            };

            _context.OrderItems.Add(orderItem);

            item.Product.StockQuantity -= item.Quantity;
        }

        _context.CartItems.RemoveRange(cartItems);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Order placed successfully.",
            orderId = order.Id,
            totalAmount = order.TotalAmount,
            status = order.Status,
            paymentStatus = order.PaymentStatus,
            orderDate = order.OrderDate
        });
    }

    // GET: api/Order/user/1
    [HttpGet("user/{userId:int}")]
    public async Task<ActionResult> GetUserOrders(int userId)
    {
        var orders = await _context.Orders
            .Where(o => o.UserId == userId)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new
            {
                o.Id,
                o.TotalAmount,
                o.Status,
                o.PaymentStatus,
                o.OrderDate,
                Items = o.OrderItems.Select(oi => new
                {
                    oi.ProductId,
                    ProductName = oi.Product != null
                        ? oi.Product.Name
                        : string.Empty,
                    oi.Quantity,
                    oi.UnitPrice,
                    TotalPrice = oi.UnitPrice * oi.Quantity
                })
            })
            .ToListAsync();

        return Ok(new
        {
            count = orders.Count,
            orders
        });
    }

    // GET: api/Order/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetOrder(int id)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Where(o => o.Id == id)
            .Select(o => new
            {
                o.Id,
                o.UserId,
                o.TotalAmount,
                o.Status,
                o.PaymentStatus,
                o.OrderDate,
                Items = o.OrderItems.Select(oi => new
                {
                    oi.ProductId,
                    ProductName = oi.Product != null
                        ? oi.Product.Name
                        : string.Empty,
                    oi.Quantity,
                    oi.UnitPrice,
                    TotalPrice = oi.UnitPrice * oi.Quantity
                })
            })
            .FirstOrDefaultAsync();

        if (order == null)
        {
            return NotFound(new
            {
                message = "Order not found."
            });
        }

        return Ok(order);
    }
}