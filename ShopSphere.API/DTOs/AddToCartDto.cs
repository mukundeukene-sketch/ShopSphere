using System.ComponentModel.DataAnnotations;

namespace ShopSphere.API.DTOs;

public class AddToCartDto
{
    [Required]
    public int ProductId { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; }
}