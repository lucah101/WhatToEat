import { useRef } from "react";
import { useDrag } from "react-dnd";
import { GripVertical } from "lucide-react";
import type { FoodItem } from "./FoodDatabase";

interface FoodListProps {
  foods: FoodItem[];
}

function DraggableFood({ food }: { food: FoodItem }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "FOOD",
    item: food,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const ref = useRef<HTMLDivElement | null>(null);
  drag(ref);

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg cursor-move transition-all hover:border-gray-300 hover:shadow-sm ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
      <span className="text-sm font-medium text-gray-700">{food.name}</span>
    </div>
  );
}

export function FoodList({ foods }: FoodListProps) {
  const categories = ["Carbs", "Protein", "Vegetables"];

  return (
    <div className="w-72 bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
        <h3 className="font-bold text-lg text-gray-900">Available Foods</h3>
        <p className="text-xs text-gray-500 mt-1">
          Drag to the table on the right
        </p>
      </div>

      <div className="p-5 space-y-6">
        {categories.map((category) => {
          const categoryFoods = foods.filter((f) => f.category === category);

          return (
            <div key={category}>
              <div className="font-bold text-sm text-gray-900 mb-3 pb-2 border-b border-gray-200">
                {category}
              </div>
              <div className="space-y-2">
                {categoryFoods.length > 0 ? (
                  categoryFoods.map((food) => (
                    <DraggableFood key={food.id} food={food} />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 px-3 py-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    No foods yet. Add some in the database first.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
