import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FoodList } from "./FoodList";
import { PlanGrid } from "./PlanGrid";
import type { FoodItem, FoodUnit } from "./FoodDatabase";

export interface MealFood {
  foodId: number;
  foodName: string;
  category: "Carbs" | "Protein" | "Vegetables";
  amount: number;
  unit: FoodUnit;
}

export interface MealCell {
  foods: MealFood[];
}

export type WeekDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
export type MealTime = "Breakfast" | "Lunch" | "Dinner";

export type WeeklyPlanData = Record<WeekDay, Record<MealTime, MealCell>>;

const WEEK_DAYS: WeekDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MEAL_TIMES: MealTime[] = ["Breakfast", "Lunch", "Dinner"];

const API_BASE = "http://localhost:5234";

export function WeeklyPlan() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [plan, setPlan] = useState<WeeklyPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const buildEmptyPlan = (): WeeklyPlanData => {
    const initialPlan: WeeklyPlanData = {} as WeeklyPlanData;
    WEEK_DAYS.forEach((day) => {
      initialPlan[day] = {} as Record<MealTime, MealCell>;
      MEAL_TIMES.forEach((meal) => {
        initialPlan[day][meal] = { foods: [] };
      });
    });
    return initialPlan;
  };

  const fetchFoods = async () => {
    const res = await fetch(`${API_BASE}/api/foods`);
    if (!res.ok) throw new Error("Failed to load foods");
    const data: FoodItem[] = await res.json();
    setFoods(data);
  };

  const fetchPlan = async () => {
    const res = await fetch(`${API_BASE}/api/weekly-plan`);
    if (!res.ok) {
      setPlan(buildEmptyPlan());
      return;
    }
    const data: {
      plan: Record<string, Record<string, MealFood[]>>;
    } = await res.json();

    const empty = buildEmptyPlan();
    for (const day of WEEK_DAYS) {
      const dayData = data.plan?.[day] ?? {};
      for (const meal of MEAL_TIMES) {
        const foodsForMeal = (dayData[meal] ?? []) as MealFood[];
        empty[day][meal] = { foods: foodsForMeal };
      }
    }
    setPlan(empty);
  };

  const syncFromServer = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchFoods(), fetchPlan()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void syncFromServer();
  }, []);

  const persistPlan = async (newPlan: WeeklyPlanData) => {
    setSaving(true);
    try {
      const payload = {
        plan: Object.fromEntries(
          WEEK_DAYS.map((day) => [
            day,
            Object.fromEntries(
              MEAL_TIMES.map((meal) => [meal, newPlan[day][meal].foods])
            ),
          ])
        ),
      };

      await fetch(`${API_BASE}/api/weekly-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } finally {
      setSaving(false);
    }
  };

  const addFoodToCell = (
    day: WeekDay,
    meal: MealTime,
    food: FoodItem,
    amount: number = food.defaultAmount ?? 0,
    unit: FoodUnit = food.defaultUnit ?? "g"
  ) => {
    if (food.category === "Soup") return;

    setPlan((prev) => {
      const current = prev ?? buildEmptyPlan();
      const newPlan: WeeklyPlanData = JSON.parse(JSON.stringify(current));
      const cell = newPlan[day][meal];

      const mealFood: MealFood = {
        foodId: food.id,
        foodName: food.name,
        category: food.category as "Carbs" | "Protein" | "Vegetables",
        amount,
        unit,
      };
      cell.foods = [...cell.foods, mealFood];

      void persistPlan(newPlan);
      return newPlan;
    });
  };

  const updateFoodAmount = (
    day: WeekDay,
    meal: MealTime,
    foodIndex: number,
    amount: number
  ) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const newPlan: WeeklyPlanData = JSON.parse(JSON.stringify(prev));
      newPlan[day][meal].foods[foodIndex].amount = amount;
      void persistPlan(newPlan);
      return newPlan;
    });
  };

  const removeFood = (day: WeekDay, meal: MealTime, foodIndex: number) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const newPlan: WeeklyPlanData = JSON.parse(JSON.stringify(prev));
      newPlan[day][meal].foods = newPlan[day][meal].foods.filter(
        (_, idx) => idx !== foodIndex
      );
      void persistPlan(newPlan);
      return newPlan;
    });
  };

  if (!plan || loading) {
    return (
      <div className="weekly-root weekly-root--loading">
        <p className="weekly-loading-text">
          {loading ? "Loading weekly plan..." : "No plan yet."}
        </p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={
          sidebarCollapsed
            ? "weekly-root weekly-root--sidebar-collapsed"
            : "weekly-root"
        }
      >
        <FoodList
          foods={foods}
          isCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        />
        <PlanGrid
          plan={plan}
          weekDays={WEEK_DAYS}
          mealTimes={MEAL_TIMES}
          onAddFood={addFoodToCell}
          onUpdateAmount={updateFoodAmount}
          onRemoveFood={removeFood}
        />
      </div>
      {saving && <div className="weekly-saving">Saving...</div>}
    </DndProvider>
  );
}

