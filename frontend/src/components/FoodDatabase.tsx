import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export type FoodCategory = "Carbs" | "Protein" | "Vegetables" | "Soup";

export interface FoodItem {
  id: number;
  name: string;
  category: FoodCategory;
  defaultAmount: number;
  defaultUnit: FoodUnit;
  notes: string;
}

export type FoodUnit = "g";

const CATEGORIES: FoodCategory[] = ["Carbs", "Protein", "Vegetables", "Soup"];
const API_BASE = "http://localhost:5234";

export function FoodDatabase() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDefaultAmount, setEditingDefaultAmount] = useState<number>(0);
  const [editingNotes, setEditingNotes] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<FoodCategory, boolean>
  >({
    Carbs: false,
    Protein: false,
    Vegetables: false,
    Soup: false,
  });
  const [newFoodNames, setNewFoodNames] = useState<Record<FoodCategory, string>>({
    Carbs: "",
    Protein: "",
    Vegetables: "",
    Soup: "",
  });
  const [newFoodNotes, setNewFoodNotes] = useState<Record<FoodCategory, string>>({
    Carbs: "",
    Protein: "",
    Vegetables: "",
    Soup: "",
  });
  const [newFoodDefaults, setNewFoodDefaults] = useState<
    Record<FoodCategory, { amount: number; unit: FoodUnit }>
  >({
    Carbs: { amount: 0, unit: "g" },
    Protein: { amount: 0, unit: "g" },
    Vegetables: { amount: 0, unit: "g" },
    Soup: { amount: 0, unit: "g" },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/foods`);
      if (!res.ok) throw new Error("Failed to load foods");
      const data: FoodItem[] = await res.json();
      setFoods(
        data.map((f) => ({
          ...f,
          defaultAmount: Number.isFinite(f.defaultAmount) ? f.defaultAmount : 0,
          defaultUnit: (f.defaultUnit ?? "g") as FoodUnit,
          notes: typeof f.notes === "string" ? f.notes : "",
        }))
      );
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
        body: JSON.stringify({
          name,
          category,
          defaultAmount: Math.max(0, Math.trunc(newFoodDefaults[category].amount)),
          defaultUnit: newFoodDefaults[category].unit,
          notes: newFoodNotes[category] ?? "",
        }),
      });
      if (!res.ok) throw new Error("Failed to add food");
      await fetchFoods();
      setNewFoodNames((prev) => ({ ...prev, [category]: "" }));
      setNewFoodNotes((prev) => ({ ...prev, [category]: "" }));
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
    setEditingDefaultAmount(food.defaultAmount ?? 0);
    setEditingNotes(food.notes ?? "");
  };

  const saveEdit = async () => {
    if (editingId === null || !editingName.trim()) return;

    const food = foods.find((f) => f.id === editingId);
    if (!food) return;

    setSaving(true);
    try {
      const safeAmount = Number.isFinite(editingDefaultAmount)
        ? Math.max(0, Math.trunc(editingDefaultAmount))
        : 0;
      const res = await fetch(`${API_BASE}/api/foods/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingName,
          category: food.category,
          defaultAmount: safeAmount,
          defaultUnit: "g",
          notes: editingNotes ?? "",
        }),
      });
      if (!res.ok) throw new Error("Failed to update food");
      await fetchFoods();
      setEditingId(null);
      setEditingName("");
      setEditingDefaultAmount(0);
      setEditingNotes("");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDefaultAmount(0);
    setEditingNotes("");
  };

  return (
    <div className="page-container">
      <div className="page-header">
        {(loading || saving) && (
          <p className="page-status">Syncing with server...</p>
        )}
      </div>

      <div className="food-table-wrapper">
        <table className="food-table">
          <thead>
            <tr>
              <th className="food-table__th food-table__th--name">Food</th>
              <th className="food-table__th food-table__th--amount">Default</th>
              <th className="food-table__th food-table__th--notes">Notes</th>
              <th className="food-table__th food-table__th--actions">Actions</th>
            </tr>
          </thead>
          {CATEGORIES.map((category) => {
            const categoryFoods = foods.filter((f) => f.category === category);
            const isCollapsed = collapsedCategories[category];

            return (
              <tbody key={category}>
                <tr className="food-category-row">
                  <td className="food-category-cell" colSpan={4}>
                    <button
                      type="button"
                      className="food-category-toggle"
                      onClick={() =>
                        setCollapsedCategories((prev) => ({
                          ...prev,
                          [category]: !prev[category],
                        }))
                      }
                      aria-expanded={!isCollapsed}
                      aria-controls={`food-category-${category}`}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="food-category-toggle__icon" />
                      ) : (
                        <ChevronDown className="food-category-toggle__icon" />
                      )}
                      <span>{category}</span>
                    </button>
                  </td>
                </tr>

                {isCollapsed ? null : categoryFoods.length === 0 ? (
                  <tr>
                    <td className="food-table__td food-table__td--empty" colSpan={4}>
                      No foods yet.
                    </td>
                  </tr>
                ) : (
                  categoryFoods.map((food) => (
                    <tr
                      key={food.id}
                      className="food-table__row"
                      id={`food-category-${category}`}
                    >
                      <td className="food-table__td food-table__td--name">
                        {editingId === food.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                          />
                        ) : (
                          <span className="food-table__name">{food.name}</span>
                        )}
                      </td>
                      <td className="food-table__td food-table__td--amount">
                        {editingId === food.id ? (
                          <div className="food-table__amount-editor">
                            <Input
                              value={String(editingDefaultAmount)}
                              type="number"
                              min={0}
                              step={1}
                              inputMode="numeric"
                              onChange={(e) =>
                                setEditingDefaultAmount(
                                  Number.isFinite(parseInt(e.target.value, 10))
                                    ? parseInt(e.target.value, 10)
                                    : 0
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void saveEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                            <span className="food-table__unit-label">g</span>
                          </div>
                        ) : (
                          <span className="food-table__amount">
                            {(food.defaultAmount ?? 0).toString()}
                            g
                          </span>
                        )}
                      </td>
                      <td className="food-table__td food-table__td--notes">
                        {editingId === food.id ? (
                          <Input
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            placeholder="Notes..."
                            className="food-table__notes-input"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                          />
                        ) : (
                          <span className="food-table__notes">{food.notes}</span>
                        )}
                      </td>
                      <td className="food-table__td food-table__td--actions">
                        {editingId === food.id ? (
                          <div className="food-table__actions">
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
                          </div>
                        ) : (
                          <div className="food-table__actions">
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
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}

                {isCollapsed ? null : (
                  <tr className="food-table__row food-table__row--add">
                    <td className="food-table__td food-table__td--name" colSpan={4}>
                      <div className="food-table__add">
                        <Input
                          placeholder={`Add new ${category.toLowerCase()}...`}
                          value={newFoodNames[category]}
                          className="food-table__add-name"
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
                        <Input
                          value={String(newFoodDefaults[category].amount)}
                        type="number"
                        min={0}
                        step={1}
                          inputMode="numeric"
                          className="food-table__add-amount"
                          onChange={(e) =>
                            setNewFoodDefaults((prev) => ({
                              ...prev,
                              [category]: {
                                ...prev[category],
                              amount: Number.isFinite(parseInt(e.target.value, 10))
                                ? parseInt(e.target.value, 10)
                                : 0,
                              },
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void addFood(category);
                          }}
                        />
                        <span className="food-table__unit-label">g</span>
                        <Input
                          value={newFoodNotes[category]}
                          onChange={(e) =>
                            setNewFoodNotes((prev) => ({
                              ...prev,
                              [category]: e.target.value,
                            }))
                          }
                          placeholder="Notes..."
                          className="food-table__notes-input food-table__add-notes"
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
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}

