import { useRef } from "react";
import { useDrop } from "react-dnd";
import { X } from "lucide-react";
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
                {food.grams > 0 && (
                  <span className="weekly-cell-grams">{food.grams}g</span>
                )}
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
                      onAddFood={(food) => onAddFood(day, meal, food, 0)}
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