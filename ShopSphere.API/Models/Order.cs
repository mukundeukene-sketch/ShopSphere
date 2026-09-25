namespace ShopSphere.API.Models;

public class Order
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = "Pending";

    public string PaymentStatus { get; set; } = "Pending";

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}