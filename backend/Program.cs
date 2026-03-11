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
        Category = dto.Category,
        DefaultAmount = dto.DefaultAmount,
        DefaultUnit = dto.DefaultUnit,
        Notes = dto.Notes
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
    food.DefaultAmount = dto.DefaultAmount;
    food.DefaultUnit = dto.DefaultUnit;
    food.Notes = dto.Notes;
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

    var goals = await db.GoalEntries.ToListAsync();

    var result = WeeklyPlanMapper.ToDto(entries, goals);
    return Results.Ok(result);
});

app.MapPost("/api/weekly-plan", async (WhatToEatContext db, WeeklyPlanDto dto) =>
{
    var entries = WeeklyPlanMapper.ToEntities(dto);
    var goalEntries = WeeklyPlanMapper.GoalsToEntities(dto);

    // Clear existing data then insert new plan
    db.MealEntries.RemoveRange(db.MealEntries);
    db.GoalEntries.RemoveRange(db.GoalEntries);
    await db.SaveChangesAsync();

    await db.MealEntries.AddRangeAsync(entries);
    await db.GoalEntries.AddRangeAsync(goalEntries);
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
    public DbSet<GoalEntry> GoalEntries => Set<GoalEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Food>(entity =>
        {
            entity.ToTable("foods");
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Name).IsRequired().HasMaxLength(200);
            entity.Property(f => f.Category).IsRequired().HasMaxLength(50);
            entity.Property(f => f.DefaultAmount).IsRequired();
            entity.Property(f => f.DefaultUnit).IsRequired().HasMaxLength(10);
            entity.Property(f => f.Notes).IsRequired().HasMaxLength(2000);
        });

        modelBuilder.Entity<MealEntry>(entity =>
        {
            entity.ToTable("meal_entries");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Day).IsRequired().HasMaxLength(20);
            entity.Property(e => e.MealTime).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Amount).IsRequired();
            entity.Property(e => e.Unit).IsRequired().HasMaxLength(10);

            entity.HasOne(e => e.Food)
                .WithMany()
                .HasForeignKey(e => e.FoodId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GoalEntry>(entity =>
        {
            entity.ToTable("goal_entries");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Day).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TargetGrams).IsRequired();
        });
    }
}

public class Food
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int DefaultAmount { get; set; }
    public string DefaultUnit { get; set; } = "g";
    public string Notes { get; set; } = string.Empty;
}

public class MealEntry
{
    public int Id { get; set; }
    public string Day { get; set; } = string.Empty;       // Monday ... Sunday
    public string MealTime { get; set; } = string.Empty;  // Breakfast / Lunch / Dinner
    public string Category { get; set; } = string.Empty;  // Carbs / Protein / Vegetables
    public int Amount { get; set; }
    public string Unit { get; set; } = "g";

    public int FoodId { get; set; }
    public Food? Food { get; set; }
}

public class GoalEntry
{
    public int Id { get; set; }
    public string Day { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // Carbs / Protein / Vegetables
    public int TargetGrams { get; set; }
}

public record FoodDto(string Name, string Category, int DefaultAmount, string DefaultUnit, string Notes);

public class WeeklyPlanDto
{
    public required Dictionary<string, Dictionary<string, List<MealFoodDto>>> Plan { get; set; }
    public Dictionary<string, Dictionary<string, int>>? Goals { get; set; }
}

public class MealFoodDto
{
    public required int FoodId { get; set; }
    public required string FoodName { get; set; }
    public required string Category { get; set; }
    public int Amount { get; set; }
    public string Unit { get; set; } = "g";
}

public static class WeeklyPlanMapper
{
    public static WeeklyPlanDto ToDto(IEnumerable<MealEntry> entries, IEnumerable<GoalEntry> goals)
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
                Amount = e.Amount,
                Unit = e.Unit
            });
        }

        var goalsDict = new Dictionary<string, Dictionary<string, int>>(StringComparer.OrdinalIgnoreCase);
        foreach (var g in goals)
        {
            if (!goalsDict.TryGetValue(g.Day, out var cats))
            {
                cats = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                goalsDict[g.Day] = cats;
            }
            cats[g.Category] = g.TargetGrams;
        }

        return new WeeklyPlanDto { Plan = dict, Goals = goalsDict };
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
                        Amount = food.Amount,
                        Unit = food.Unit,
                        FoodId = food.FoodId
                    });
                }
            }
        }

        return list;
    }

    public static IEnumerable<GoalEntry> GoalsToEntities(WeeklyPlanDto dto)
    {
        var list = new List<GoalEntry>();
        if (dto.Goals is null) return list;

        foreach (var (day, categories) in dto.Goals)
        {
            foreach (var (category, target) in categories)
            {
                list.Add(new GoalEntry
                {
                    Day = day,
                    Category = category,
                    TargetGrams = target
                });
            }
        }

        return list;
    }
}
