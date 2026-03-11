import { useRef } from "react";
import { useDrop } from "react-dnd";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
  foods,
  onRemoveFood,
  onUpdateAmount,
}: {
  foods: MealFood[];
  onRemoveFood: (foodIndex: number) => void;
  onUpdateAmount: (foodIndex: number, amount: number) => void;
}) {
  return (
    <div className="weekly-cell-content">
      <table className="weekly-cell-table">
        <tbody>
          {foods.map((food, index) => (
            <tr key={index}>
              <td className="weekly-cell-table-name">{food.foodName}</td>
              <td className="weekly-cell-table-amount">
                <div className="weekly-cell-amount-input-wrapper">
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={String(Number.isFinite(food.amount) ? food.amount : 0)}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      const safeAmount = Number.isFinite(parsed) ? parsed : 0;
                      onUpdateAmount(index, safeAmount);
                    }}
                    className="weekly-cell-amount-input"
                  />
                  <span className="weekly-cell-amount-unit">g</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFood(index)}
                    className="icon-button icon-button--muted"
                  >
                    <X className="icon-button__icon" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DroppableCell({
  foods,
  onAddFood,
  onRemoveFood,
  onUpdateFoodAmount,
}: {
  foods: MealFood[];
  onAddFood: (food: FoodItem) => void;
  onRemoveFood: (foodIndex: number) => void;
  onUpdateFoodAmount: (foodIndex: number, amount: number) => void;
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
          foods={foods}
          onRemoveFood={onRemoveFood}
          onUpdateAmount={onUpdateFoodAmount}
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
  onUpdateAmount,
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
                <div>Day</div>
              </th>
              {mealTimes.map((meal) => (
                <th key={meal} className="weekly-table-day-header">
                  <div>{meal}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDays.map((day) => (
              <tr key={day}>
                <td className="weekly-meal-row-header">
                  <div>{day}</div>
                </td>
                {mealTimes.map((meal) => (
                  <td key={`${day}-${meal}`} className="weekly-table-cell">
                    <DroppableCell
                      foods={plan[day][meal].foods}
                      onAddFood={(food) => onAddFood(day, meal, food)}
                      onRemoveFood={(foodIndex) =>
                        onRemoveFood(day, meal, foodIndex)
                      }
                      onUpdateFoodAmount={(foodIndex, amount) =>
                        onUpdateAmount(day, meal, foodIndex, amount)
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