import { useRef } from "react";
import { useDrop } from "react-dnd";
import { X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import type { FoodItem } from "./FoodDatabase";
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
    grams: number
  ) => void;
  onUpdateGrams: (
    day: WeekDay,
    meal: MealTime,
    foodIndex: number,
    grams: number
  ) => void;
  onRemoveFood: (day: WeekDay, meal: MealTime, foodIndex: number) => void;
}

function MealCellContent({
  day: _day,
  meal: _meal,
  foods,
  onUpdateGrams,
  onRemoveFood,
}: {
  day: WeekDay;
  meal: MealTime;
  foods: MealFood[];
  onUpdateGrams: (foodIndex: number, grams: number) => void;
  onRemoveFood: (foodIndex: number) => void;
}) {
  const carbFoods = foods.filter((f) => f.category === "Carbs");
  const proteinFoods = foods.filter((f) => f.category === "Protein");
  const vegFoods = foods.filter((f) => f.category === "Vegetables");

  const totalCarbs = carbFoods.reduce((sum, f) => sum + f.grams, 0);
  const totalProtein = proteinFoods.reduce((sum, f) => sum + f.grams, 0);
  const totalVeg = vegFoods.reduce((sum, f) => sum + f.grams, 0);

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
                <Input
                  type="number"
                  value={food.grams}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;
                    onUpdateGrams(foodIndex, value);
                  }}
                  className="weekly-cell-input"
                  min="0"
                />
                <span className="weekly-cell-unit">g</span>
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
      {renderFoodGroup(carbFoods, "Carbs")}
      {renderFoodGroup(proteinFoods, "Protein")}
      {renderFoodGroup(vegFoods, "Vegetables")}

      {foods.length > 0 && (
        <div className="weekly-cell-summary">
          {totalCarbs > 0 && (
            <div className="weekly-cell-summary-row">
              <span>Total Carbs:</span>
              <span>{totalCarbs}g</span>
            </div>
          )}
          {totalProtein > 0 && (
            <div className="weekly-cell-summary-row">
              <span>Total Protein:</span>
              <span>{totalProtein}g</span>
            </div>
          )}
          {totalVeg > 0 && (
            <div className="weekly-cell-summary-row">
              <span>Total Vegetables:</span>
              <span>{totalVeg}g</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DroppableCell({
  day,
  meal,
  foods,
  onAddFood,
  onUpdateGrams,
  onRemoveFood,
}: {
  day: WeekDay;
  meal: MealTime;
  foods: MealFood[];
  onAddFood: (food: FoodItem) => void;
  onUpdateGrams: (foodIndex: number, grams: number) => void;
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
          onUpdateGrams={onUpdateGrams}
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
  onUpdateGrams,
  onRemoveFood,
}: PlanGridProps) {
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
                      onAddFood={(food) => onAddFood(day, meal, food, 100)}
                      onUpdateGrams={(foodIndex, grams) =>
                        onUpdateGrams(day, meal, foodIndex, grams)
                      }
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
    </div>
  );
}