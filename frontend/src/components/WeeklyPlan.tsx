import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FoodList } from "./FoodList";
import { PlanGrid } from "./PlanGrid";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEAL_TIMES = ["Breakfast", "Lunch", "Dinner"];

const PLAN_STORAGE_KEY = "weekly-plan";
const FOOD_STORAGE_KEY = "food-database";

export function WeeklyPlan() {
  const [foods, setFoods] = useState([]);
  const [plan, setPlan] = useState(() => {
    const stored = localStorage.getItem(PLAN_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    const initialPlan = {};
    WEEK_DAYS.forEach((day) => {
      initialPlan[day] = {};
      MEAL_TIMES.forEach((meal) => {
        initialPlan[day][meal] = { foods: [] };
      });
    });
    return initialPlan;
  });

  useEffect(() => {
    const stored = localStorage.getItem(FOOD_STORAGE_KEY);
    if (stored) {
      setFoods(JSON.parse(stored));
    }
  }, []);

  const savePlan = (newPlan) => {
    setPlan(newPlan);
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(newPlan));
  };

  const addFoodToCell = (day, meal, food, grams = 100) => {
    const newPlan = { ...plan };
    const cell = newPlan[day][meal];

    if (food.category !== "Soup") {
      const mealFood = {
        foodId: food.id,
        foodName: food.name,
        category: food.category,
        grams,
      };
      cell.foods = [...cell.foods, mealFood];
      savePlan(newPlan);
    }
  };

  const updateFoodGrams = (day, meal, foodIndex, grams) => {
    const newPlan = { ...plan };
    newPlan[day][meal].foods[foodIndex].grams = grams;
    savePlan(newPlan);
  };

  const removeFood = (day, meal, foodIndex) => {
    const newPlan = { ...plan };
    newPlan[day][meal].foods = newPlan[day][meal].foods.filter(
      (_, idx) => idx !== foodIndex
    );
    savePlan(newPlan);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-[calc(100vh-73px)] flex bg-gray-50">
        <FoodList foods={foods} />
        <PlanGrid
          plan={plan}
          weekDays={WEEK_DAYS}
          mealTimes={MEAL_TIMES}
          onAddFood={addFoodToCell}
          onUpdateGrams={updateFoodGrams}
          onRemoveFood={removeFood}
        />
      </div>
    </DndProvider>
  );
}
