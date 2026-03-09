import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export type FoodCategory = "Carbs" | "Protein" | "Vegetables" | "Soup";

export interface FoodItem {
  id: number;
  name: string;
  category: FoodCategory;
}

const CATEGORIES: FoodCategory[] = ["Carbs", "Protein", "Vegetables", "Soup"];

export function FoodDatabase() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newFoodNames, setNewFoodNames] = useState<Record<FoodCategory, string>>({
    Carbs: "",
    Protein: "",
    Vegetables: "",
    Soup: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/foods");
      if (!res.ok) throw new Error("Failed to load foods");
      const data: FoodItem[] = await res.json();
      setFoods(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFoods();
  }, []);

  const addFood = async (category: FoodCategory) => {
    const name = newFoodNames[category].trim();
    if (!name) return;

    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category }),
      });
      if (!res.ok) throw new Error("Failed to add food");
      await fetchFoods();
      setNewFoodNames((prev) => ({ ...prev, [category]: "" }));
    } finally {
      setSaving(false);
    }
  };

  const deleteFood = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/foods/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete food");
      await fetchFoods();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (food: FoodItem) => {
    setEditingId(food.id);
    setEditingName(food.name);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;

    const food = foods.find((f) => f.id === editingId);
    if (!food) return;

    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/foods/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName, category: food.category }),
      });
      if (!res.ok) throw new Error("Failed to update food");
      await fetchFoods();
      setEditingId(null);
      setEditingName("");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="max-w-[1800px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Food Database</h2>
        <p className="text-gray-500">
          Manage your food categories and options (stored in PostgreSQL)
        </p>
      </div>

      {(loading || saving) && (
        <p className="text-sm text-gray-500 mb-4">Syncing with server...</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map((category) => {
          const categoryFoods = foods.filter((f) => f.category === category);

          return (
            <div
              key={category}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="font-bold text-lg mb-4 text-gray-900 pb-2 border-b border-gray-200">
                {category}
              </div>

              <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                {categoryFoods.map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    {editingId === food.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 h-9"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={saveEdit}
                          className="h-9 w-9 p-0"
                        >
                          <Check className="w-4 h-4 text-gray-900" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          className="h-9 w-9 p-0"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-gray-700">
                          {food.name}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(food)}
                          className="h-9 w-9 p-0"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void deleteFood(food.id)}
                          className="h-9 w-9 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add new food..."
                  value={newFoodNames[category]}
                  onChange={(e) =>
                    setNewFoodNames((prev) => ({
                      ...prev,
                      [category]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void addFood(category);
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={() => void addFood(category)}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

