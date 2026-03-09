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
      className={`weekly-food-item ${isDragging ? "weekly-food-item--dragging" : ""}`}
    >
      <GripVertical className="weekly-food-item__icon" />
      <span className="weekly-food-item__name">{food.name}</span>
    </div>
  );
}

export function FoodList({ foods }: FoodListProps) {
  const categories = ["Carbs", "Protein", "Vegetables"];

  return (
    <div className="weekly-sidebar">
      <div className="weekly-sidebar-header">
        <h3 className="weekly-sidebar-title">Available Foods</h3>
        <p className="weekly-sidebar-subtitle">Drag to the table on the right</p>
      </div>

      <div className="weekly-sidebar-body">
        {categories.map((category) => {
          const categoryFoods = foods.filter((f) => f.category === category);

          return (
            <div key={category} className="weekly-sidebar-section">
              <div className="weekly-sidebar-section-title">{category}</div>
              <div className="weekly-sidebar-section-list">
                {categoryFoods.length > 0 ? (
                  categoryFoods.map((food) => (
                    <DraggableFood key={food.id} food={food} />
                  ))
                ) : (
                  <p className="weekly-sidebar-empty">
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
