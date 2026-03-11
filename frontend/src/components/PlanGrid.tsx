import { useRef } from "react";
import { useDrop } from "react-dnd";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import type { FoodItem, FoodUnit } from "./FoodDatabase";
import type {
  WeekDay,
  MealTime,
  WeeklyPlanData,
  MealFood,
} from "./WeeklyPlan";

interface PlanGridProps {
  plan: WeeklyPlanData;
  weekDays: WeekDay[];
  mealTimes: MealTime[];
  onAddFood: (
    day: WeekDay,
    meal: MealTime,
    food: FoodItem,
    amount?: number,
    unit?: FoodUnit
  ) => void;
  onUpdateAmount: (
    day: WeekDay,
    meal: MealTime,
    foodIndex: number,
    amount: number
  ) => void;
  onRemoveFood: (day: WeekDay, meal: MealTime, foodIndex: number) => void;
}

function MealCellContent({
  day: _day,
  meal: _meal,
  foods,
  onRemoveFood,
}: {
  day: WeekDay;
  meal: MealTime;
  foods: MealFood[];
  onRemoveFood: (foodIndex: number) => void;
}) {
  const renderFoodGroup = (groupFoods: MealFood[], title: string) => {
    if (groupFoods.length === 0) return null;

    return (
      <div className="weekly-cell-group">
        <div className="weekly-cell-group-title">{title}</div>
        <div className="weekly-cell-group-list">
          {groupFoods.map((food) => {
            const foodIndex = foods.indexOf(food);
            return (
              <div key={foodIndex} className="weekly-cell-food-row">
                <span className="weekly-cell-food-name">{food.foodName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFood(foodIndex)}
                  className="icon-button icon-button--muted"
                >
                  <X className="icon-button__icon" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="weekly-cell-content">
      {renderFoodGroup(
        foods.filter((f) => f.category === "Carbs"),
        "Carbs"
      )}
      {renderFoodGroup(
        foods.filter((f) => f.category === "Protein"),
        "Protein"
      )}
      {renderFoodGroup(
        foods.filter((f) => f.category === "Vegetables"),
        "Vegetables"
      )}
      {renderFoodGroup(
        foods.filter((f) => f.category === "Soup"),
        "Soup"
      )}
    </div>
  );
}

function DroppableCell({
  day,
  meal,
  foods,
  onAddFood,
  onRemoveFood,
}: {
  day: WeekDay;
  meal: MealTime;
  foods: MealFood[];
  onAddFood: (food: FoodItem) => void;
  onRemoveFood: (foodIndex: number) => void;
}) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "FOOD",
    drop: (item: FoodItem) => {
      onAddFood(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const ref = useRef<HTMLDivElement | null>(null);
  drop(ref);

  const stateClass =
    isOver && canDrop
      ? "weekly-cell weekly-cell--over"
      : canDrop
      ? "weekly-cell weekly-cell--can-drop"
      : "weekly-cell";

  return (
    <div ref={ref} className={stateClass}>
      {foods.length === 0 ? (
        <div className="weekly-cell-empty">Drag food here</div>
      ) : (
        <MealCellContent
          day={day}
          meal={meal}
          foods={foods}
          onRemoveFood={onRemoveFood}
        />
      )}
    </div>
  );
}

export function PlanGrid({
  plan,
  weekDays,
  mealTimes,
  onAddFood,
  onUpdateAmount: _onUpdateAmount,
  onRemoveFood,
}: PlanGridProps) {
  const totalsByFood = (() => {
    const map = new Map<number, { name: string; category: MealFood["category"]; total: number }>();

    for (const day of weekDays) {
      for (const meal of mealTimes) {
        for (const f of plan[day][meal].foods) {
          const amount = Number.isFinite(f.amount) ? f.amount : 0;
          const existing = map.get(f.foodId);
          if (existing) {
            existing.total += amount;
          } else {
            map.set(f.foodId, { name: f.foodName, category: f.category, total: amount });
          }
        }
      }
    }

    return Array.from(map.entries())
      .map(([foodId, v]) => ({ foodId, ...v }))
      .sort((a, b) => b.total - a.total);
  })();

  return (
    <div className="weekly-main">
      <div className="weekly-table-wrapper">
        <table className="weekly-table">
          <thead>
            <tr>
              <th className="weekly-table-meal-header">
                <div>Meal</div>
              </th>
              {weekDays.map((day) => (
                <th key={day} className="weekly-table-day-header">
                  <div>{day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mealTimes.map((meal) => (
              <tr key={meal}>
                <td className="weekly-meal-row-header">
                  <div>{meal}</div>
                </td>
                {weekDays.map((day) => (
                  <td key={`${day}-${meal}`} className="weekly-table-cell">
                    <DroppableCell
                      day={day}
                      meal={meal}
                      foods={plan[day][meal].foods}
                      onAddFood={(food) => onAddFood(day, meal, food)}
                      onRemoveFood={(foodIndex) =>
                        onRemoveFood(day, meal, foodIndex)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="weekly-goals">
        <div className="weekly-goals__title">Food totals (g)</div>
        <div className="weekly-goals__table-wrapper">
          <table className="weekly-goals__table">
            <thead>
              <tr>
                <th className="weekly-goals__th weekly-goals__th--food">Food</th>
                <th className="weekly-goals__th weekly-goals__th--cat">Category</th>
                <th className="weekly-goals__th weekly-goals__th--num">Total</th>
              </tr>
            </thead>
            <tbody>
              {totalsByFood.length === 0 ? (
                <tr>
                  <td className="weekly-goals__td weekly-goals__td--empty" colSpan={3}>
                    No foods in plan yet.
                  </td>
                </tr>
              ) : (
                totalsByFood.map((row) => (
                  <tr key={row.foodId}>
                    <td className="weekly-goals__td weekly-goals__td--food">{row.name}</td>
                    <td className="weekly-goals__td weekly-goals__td--cat">{row.category}</td>
                    <td className="weekly-goals__td weekly-goals__td--num">
                      {row.total}g
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}