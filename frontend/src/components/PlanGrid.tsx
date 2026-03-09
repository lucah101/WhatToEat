import { useDrop } from "react-dnd";
import { X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

function MealCellContent({ day, meal, foods, onUpdateGrams, onRemoveFood }) {
  const carbFoods = foods.filter((f) => f.category === "Carbs");
  const proteinFoods = foods.filter((f) => f.category === "Protein");
  const vegFoods = foods.filter((f) => f.category === "Vegetables");

  const totalCarbs = carbFoods.reduce((sum, f) => sum + f.grams, 0);
  const totalProtein = proteinFoods.reduce((sum, f) => sum + f.grams, 0);
  const totalVeg = vegFoods.reduce((sum, f) => sum + f.grams, 0);

  const renderFoodGroup = (groupFoods, title) => {
    if (groupFoods.length === 0) return null;

    return (
      <div className="mb-3">
        <div className="text-xs font-bold mb-1.5 text-gray-900 flex items-center gap-1">
          <span>{title}</span>
        </div>
        <div className="space-y-1.5">
          {groupFoods.map((food) => {
            const foodIndex = foods.indexOf(food);
            return (
              <div
                key={foodIndex}
                className="flex items-center gap-1.5 bg-gray-50 rounded-md p-1.5 border border-gray-200"
              >
                <span className="text-xs flex-1 truncate font-medium text-gray-700">
                  {food.foodName}
                </span>
                <Input
                  type="number"
                  value={food.grams}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;
                    onUpdateGrams(foodIndex, value);
                  }}
                  className="w-16 h-7 text-xs px-2"
                  min="0"
                />
                <span className="text-xs text-gray-500 font-medium">g</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFood(foodIndex)}
                  className="h-7 w-7 p-0"
                >
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      {renderFoodGroup(carbFoods, "Carbs")}
      {renderFoodGroup(proteinFoods, "Protein")}
      {renderFoodGroup(vegFoods, "Vegetables")}

      {foods.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs space-y-1 bg-gray-50 rounded-md p-2">
          {totalCarbs > 0 && (
            <div className="font-bold text-gray-900 flex items-center justify-between">
              <span>Total Carbs:</span>
              <span className="text-gray-700">{totalCarbs}g</span>
            </div>
          )}
          {totalProtein > 0 && (
            <div className="font-bold text-gray-900 flex items-center justify-between">
              <span>Total Protein:</span>
              <span className="text-gray-700">{totalProtein}g</span>
            </div>
          )}
          {totalVeg > 0 && (
            <div className="font-bold text-gray-900 flex items-center justify-between">
              <span>Total Vegetables:</span>
              <span className="text-gray-700">{totalVeg}g</span>
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
}) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "FOOD",
    drop: (item) => {
      onAddFood(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`h-full min-h-[140px] p-3 rounded-lg transition-all ${
        isOver && canDrop
          ? "border-2 border-blue-400 bg-blue-50"
          : canDrop
          ? "border-2 border-dashed border-gray-300 bg-white"
          : "border border-gray-200 bg-white"
      }`}
    >
      {foods.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">
          Drag food here
        </div>
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
}) {
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-6">
        <div className="inline-block min-w-full">
          <table className="border-collapse shadow-sm rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-blue-500 border border-blue-600 w-24 p-3">
                  <div className="text-sm font-bold text-white">Meal</div>
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="bg-blue-500 border border-blue-600 min-w-[180px] p-3"
                  >
                    <div className="text-sm font-bold text-white">{day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mealTimes.map((meal) => (
                <tr key={meal}>
                  <td className="sticky left-0 z-10 bg-gray-100 border border-gray-200 p-3">
                    <div className="text-sm font-bold text-gray-900">{meal}</div>
                  </td>
                  {weekDays.map((day) => (
                    <td
                      key={`${day}-${meal}`}
                      className="border border-gray-200 p-2 bg-white"
                    >
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
    </div>
  );
}