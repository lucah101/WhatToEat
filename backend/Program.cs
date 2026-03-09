using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// DbContext
builder.Services.AddDbContext<WhatToEatContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString);
});

// CORS for local dev front-end
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Apply migrations / create database schema
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WhatToEatContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors();

// Foods API
app.MapGet("/api/foods", async (WhatToEatContext db) =>
    await db.Foods.OrderBy(f => f.Category).ThenBy(f => f.Name).ToListAsync());

app.MapPost("/api/foods", async (WhatToEatContext db, FoodDto dto) =>
{
    var food = new Food
    {
        Name = dto.Name,
        Category = dto.Category
    };
    db.Foods.Add(food);
    await db.SaveChangesAsync();
    return Results.Created($"/api/foods/{food.Id}", food);
});

app.MapPut("/api/foods/{id:int}", async (WhatToEatContext db, int id, FoodDto dto) =>
{
    var food = await db.Foods.FindAsync(id);
    if (food is null) return Results.NotFound();
    food.Name = dto.Name;
    food.Category = dto.Category;
    await db.SaveChangesAsync();
    return Results.Ok(food);
});

app.MapDelete("/api/foods/{id:int}", async (WhatToEatContext db, int id) =>
{
    var food = await db.Foods.FindAsync(id);
    if (food is null) return Results.NotFound();
    db.Foods.Remove(food);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// Weekly plan API
app.MapGet("/api/weekly-plan", async (WhatToEatContext db) =>
{
    var entries = await db.MealEntries
        .Include(e => e.Food)
        .ToListAsync();

    var result = WeeklyPlanMapper.ToDto(entries);
    return Results.Ok(result);
});

app.MapPost("/api/weekly-plan", async (WhatToEatContext db, WeeklyPlanDto dto) =>
{
    var entries = WeeklyPlanMapper.ToEntities(dto);

    // Clear existing data then insert new plan
    db.MealEntries.RemoveRange(db.MealEntries);
    await db.SaveChangesAsync();

    await db.MealEntries.AddRangeAsync(entries);
    await db.SaveChangesAsync();

    return Results.Ok();
});

app.Run();

public class WhatToEatContext : DbContext
{
    public WhatToEatContext(DbContextOptions<WhatToEatContext> options) : base(options)
    {
    }

    public DbSet<Food> Foods => Set<Food>();
    public DbSet<MealEntry> MealEntries => Set<MealEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Food>(entity =>
        {
            entity.ToTable("foods");
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Name).IsRequired().HasMaxLength(200);
            entity.Property(f => f.Category).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<MealEntry>(entity =>
        {
            entity.ToTable("meal_entries");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Day).IsRequired().HasMaxLength(20);
            entity.Property(e => e.MealTime).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Grams).IsRequired();

            entity.HasOne(e => e.Food)
                .WithMany()
                .HasForeignKey(e => e.FoodId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

public class Food
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}

public class MealEntry
{
    public int Id { get; set; }
    public string Day { get; set; } = string.Empty;       // Monday ... Sunday
    public string MealTime { get; set; } = string.Empty;  // Breakfast / Lunch / Dinner
    public string Category { get; set; } = string.Empty;  // Carbs / Protein / Vegetables
    public int Grams { get; set; }

    public int FoodId { get; set; }
    public Food? Food { get; set; }
}

public record FoodDto(string Name, string Category);

public class WeeklyPlanDto
{
    public required Dictionary<string, Dictionary<string, List<MealFoodDto>>> Plan { get; set; }
}

public class MealFoodDto
{
    public required int FoodId { get; set; }
    public required string FoodName { get; set; }
    public required string Category { get; set; }
    public int Grams { get; set; }
}

public static class WeeklyPlanMapper
{
    public static WeeklyPlanDto ToDto(IEnumerable<MealEntry> entries)
    {
        var dict = new Dictionary<string, Dictionary<string, List<MealFoodDto>>>(StringComparer.OrdinalIgnoreCase);

        foreach (var e in entries)
        {
            if (!dict.TryGetValue(e.Day, out var meals))
            {
                meals = new Dictionary<string, List<MealFoodDto>>(StringComparer.OrdinalIgnoreCase);
                dict[e.Day] = meals;
            }

            if (!meals.TryGetValue(e.MealTime, out var foods))
            {
                foods = new List<MealFoodDto>();
                meals[e.MealTime] = foods;
            }

            foods.Add(new MealFoodDto
            {
                FoodId = e.FoodId,
                FoodName = e.Food?.Name ?? string.Empty,
                Category = e.Category,
                Grams = e.Grams
            });
        }

        return new WeeklyPlanDto { Plan = dict };
    }

    public static IEnumerable<MealEntry> ToEntities(WeeklyPlanDto dto)
    {
        var list = new List<MealEntry>();

        foreach (var (day, meals) in dto.Plan)
        {
            foreach (var (mealTime, foods) in meals)
            {
                foreach (var food in foods)
                {
                    list.Add(new MealEntry
                    {
                        Day = day,
                        MealTime = mealTime,
                        Category = food.Category,
                        Grams = food.Grams,
                        FoodId = food.FoodId
                    });
                }
            }
        }

        return list;
    }
}
