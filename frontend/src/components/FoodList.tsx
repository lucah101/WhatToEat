import { useRef } from "react";
import { useDrag } from "react-dnd";
import { GripVertical } from "lucide-react";
import { Button } from "../ui/button";
import type { FoodItem } from "./FoodDatabase";

interface FoodListProps {
  foods: FoodItem[];
  isCollapsed: boolean;
  onToggleSidebar: () => void;
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

export function FoodList({ foods, isCollapsed, onToggleSidebar }: FoodListProps) {
  const categories = ["Carbs", "Protein", "Vegetables"];

  return (
    <div
      className={
        isCollapsed ? "weekly-sidebar weekly-sidebar--collapsed" : "weekly-sidebar"
      }
      onClick={isCollapsed ? onToggleSidebar : undefined}
      role={isCollapsed ? "button" : undefined}
      tabIndex={isCollapsed ? 0 : undefined}
      onKeyDown={
        isCollapsed
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onToggleSidebar();
            }
          : undefined
      }
    >
      <div className="weekly-sidebar-header">
        {!isCollapsed && (
          <div className="weekly-sidebar-header-main">
            <h3 className="weekly-sidebar-title">Available Foods</h3>
            <p className="weekly-sidebar-subtitle">
              Drag to the table on the right
            </p>
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="weekly-sidebar-toggle"
          onClick={onToggleSidebar}
        >
          {isCollapsed ? ">" : "<"}
        </Button>
      </div>

      {!isCollapsed && (
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
      )}
    </div>
  );
}
