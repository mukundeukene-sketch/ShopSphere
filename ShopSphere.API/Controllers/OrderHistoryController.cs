using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopSphere.API.Data;

namespace ShopSphere.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrderHistoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrderHistoryController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/OrderHistory/1
    [HttpGet("{userId:int}")]
    public async Task<ActionResult> GetOrderHistory(int userId)
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

        var orders = await _context.Orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new
            {
                orderId = o.Id,
                totalAmount = o.TotalAmount,
                status = o.Status,
                paymentStatus = o.PaymentStatus,
                orderDate = o.OrderDate,

                items = o.OrderItems
                    .Select(oi => new
                    {
                        productId = oi.ProductId,
                        productName = oi.Product != null
                            ? oi.Product.Name
                            : "Product",
                        imageUrl = oi.Product != null
                            ? oi.Product.ImageUrl
                            : string.Empty,
                        quantity = oi.Quantity,
                        unitPrice = oi.UnitPrice,
                        totalPrice = oi.UnitPrice * oi.Quantity
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            orderCount = orders.Count,
            orders
        });
    }
}