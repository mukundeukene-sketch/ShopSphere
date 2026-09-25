using System.ComponentModel.DataAnnotations;

namespace ShopSphere.API.DTOs;

public class CreateProductDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Range(0.01, 10000000)]
    public decimal Price { get; set; }

    [Range(0, 100000)]
    public int StockQuantity { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }
}