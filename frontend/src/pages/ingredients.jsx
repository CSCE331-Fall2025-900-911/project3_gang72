import { useState, useEffect } from "react";

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for adding new ingredient
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("oz");

  // Edit quantity state
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");

  // Fetch ingredients
  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ingredients");
      const data = await res.json();
      if (data.success) {
        setIngredients(data.ingredients || []);
      } else {
        setError(data.error || "Failed to fetch ingredients");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Add ingredient
  const handleAddIngredient = async () => {
    if (!newName.trim()) {
      alert("Ingredient name is required");
      return;
    }
    if (!newQuantity || isNaN(Number(newQuantity))) {
      alert("Valid quantity is required");
      return;
    }
    if (!newUnit.trim()) {
      alert("Unit is required");
      return;
    }

    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          quantity: Number(newQuantity),
          unit: newUnit.trim(),
        }),
      });

      if (res.ok) {
        alert("Ingredient added successfully!");
        setNewName("");
        setNewQuantity("");
        setNewUnit("oz");
        setShowAddForm(false);
        fetchIngredients();
      } else {
        const data = await res.json();
        alert("Failed to add ingredient: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error adding ingredient: " + err.message);
    }
  };

  // Start editing quantity
  const startEditQuantity = (ing) => {
    setEditingId(ing.id);
    setEditQuantity(ing.quantity.toString());
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditQuantity("");
  };

  // Update quantity
  const handleUpdateQuantity = async (ingId) => {
    if (!editQuantity || isNaN(Number(editQuantity))) {
      alert("Valid quantity is required");
      return;
    }

    try {
      const res = await fetch(`/api/ingredients/${ingId}/quantity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(editQuantity),
        }),
      });

      if (res.ok) {
        alert("Quantity updated successfully!");
        cancelEdit();
        fetchIngredients();
      } else {
        const data = await res.json();
        alert("Failed to update quantity: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error updating quantity: " + err.message);
    }
  };

  // Delete ingredient
  const handleDeleteIngredient = async (ingId, ingName) => {
    if (!confirm(`Are you sure you want to delete ${ingName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/ingredients/${ingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Ingredient deleted successfully!");
        fetchIngredients();
      } else {
        const data = await res.json();
        alert("Failed to delete ingredient: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error deleting ingredient: " + err.message);
    }
  };

  // Restock - add 100 to quantity
  const handleRestock = async (ing) => {
    try {
      const newQuantity = Number(ing.quantity) + 100;
      const res = await fetch(`/api/ingredients/${ing.id}/quantity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (res.ok) {
        alert(`Restocked ${ing.name}! New quantity: ${newQuantity} ${ing.unit}`);
        fetchIngredients();
      } else {
        const data = await res.json();
        alert("Failed to restock: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error restocking: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Inventory Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "+ Add Ingredient"}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Add Ingredient Form */}
      {showAddForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Add New Ingredient</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Ingredient Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Black Tea Leaves"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  className="form-control"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="e.g., 100"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Unit *</label>
                <select
                  className="form-select"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                >
                  <option value="oz">oz (ounces)</option>
                  <option value="lbs">lbs (pounds)</option>
                  <option value="g">g (grams)</option>
                  <option value="kg">kg (kilograms)</option>
                  <option value="ml">ml (milliliters)</option>
                  <option value="L">L (liters)</option>
                  <option value="units">units</option>
                  <option value="cups">cups</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <button className="btn btn-success me-2" onClick={handleAddIngredient}>
                Add Ingredient
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewQuantity("");
                  setNewUnit("oz");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {ingredients.filter((ing) => Number(ing.quantity) < 20).length > 0 && (
        <div className="alert alert-warning" role="alert">
          <strong>⚠️ Low Stock Alert:</strong>{" "}
          {ingredients
            .filter((ing) => Number(ing.quantity) < 20)
            .map((ing) => ing.name)
            .join(", ")}
        </div>
      )}

      {/* Ingredients Table */}
      <div className="card">
        <div className="card-body">
          {ingredients.length === 0 ? (
            <p className="text-muted text-center">No ingredients found</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ingredient Name</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing) => {
                    const qty = Number(ing.quantity);
                    const isLowStock = qty < 20;
                    const isOutOfStock = qty === 0;

                    return (
                      <tr key={ing.id} className={isOutOfStock ? "table-danger" : isLowStock ? "table-warning" : ""}>
                        <td>{ing.id}</td>
                        <td className="fw-bold">{ing.name}</td>
                        <td>
                          {editingId === ing.id ? (
                            <div className="input-group input-group-sm" style={{ width: "150px" }}>
                              <input
                                type="number"
                                className="form-control"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          ) : (
                            <span>{qty.toFixed(2)}</span>
                          )}
                        </td>
                        <td>{ing.unit}</td>
                        <td>
                          {isOutOfStock ? (
                            <span className="badge bg-danger">Out of Stock</span>
                          ) : isLowStock ? (
                            <span className="badge bg-warning text-dark">Low Stock</span>
                          ) : (
                            <span className="badge bg-success">In Stock</span>
                          )}
                        </td>
                        <td>
                          {editingId === ing.id ? (
                            <>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleUpdateQuantity(ing.id)}
                              >
                                Save
                              </button>
                              <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => startEditQuantity(ing)}
                                title="Edit quantity"
                              >
                                Edit Qty
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success me-2"
                                onClick={() => handleRestock(ing)}
                                title="Add 100 units"
                              >
                                +100
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                                title="Delete ingredient"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Ingredients</h5>
              <p className="display-6">{ingredients.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Low Stock Items</h5>
              <p className="display-6 text-warning">
                {ingredients.filter((ing) => Number(ing.quantity) < 20 && Number(ing.quantity) > 0).length}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Out of Stock</h5>
              <p className="display-6 text-danger">
                {ingredients.filter((ing) => Number(ing.quantity) === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}