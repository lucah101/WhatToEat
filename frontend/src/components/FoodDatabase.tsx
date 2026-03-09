import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export type FoodCategory = "Carbs" | "Protein" | "Vegetables" | "Soup";

export interface FoodItem {
  id: number;
  name: string;
  category: FoodCategory;
}

const CATEGORIES: FoodCategory[] = ["Carbs", "Protein", "Vegetables", "Soup"];
const API_BASE = "http://localhost:5234";

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
      const res = await fetch(`${API_BASE}/api/foods`);
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
      const res = await fetch(`${API_BASE}/api/foods`, {
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
      const res = await fetch(`${API_BASE}/api/foods/${id}`, {
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
      const res = await fetch(`${API_BASE}/api/foods/${editingId}`, {
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
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Food Database</h2>
        <p className="page-subtitle">Manage your food categories and options</p>
        {(loading || saving) && (
          <p className="page-status">Syncing with server...</p>
        )}
      </div>

      <div className="food-grid">
        {CATEGORIES.map((category) => {
          const categoryFoods = foods.filter((f) => f.category === category);

          return (
            <div key={category} className="food-card">
              <div className="food-card__title">{category}</div>

              <div className="food-card__list">
                {categoryFoods.map((food) => (
                  <div key={food.id} className="food-row">
                    {editingId === food.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <Button
                          onClick={saveEdit}
                          size="sm"
                          variant="ghost"
                          className="icon-button"
                        >
                          <Check className="icon-button__icon" />
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          size="sm"
                          variant="ghost"
                          className="icon-button icon-button--muted"
                        >
                          <X className="icon-button__icon" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="food-row__name">{food.name}</span>
                        <Button
                          onClick={() => startEdit(food)}
                          size="sm"
                          variant="ghost"
                          className="icon-button icon-button--muted"
                        >
                          <Edit2 className="icon-button__icon" />
                        </Button>
                        <Button
                          onClick={() => void deleteFood(food.id)}
                          size="sm"
                          variant="ghost"
                          className="icon-button icon-button--danger"
                        >
                          <Trash2 className="icon-button__icon" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="food-card__add">
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
                />
                <Button
                  size="sm"
                  onClick={() => void addFood(category)}
                  className="add-button"
                >
                  <Plus className="add-button__icon" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

