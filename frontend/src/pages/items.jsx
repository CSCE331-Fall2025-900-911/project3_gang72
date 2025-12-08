import { useState, useEffect } from "react";

export default function Items() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form state for adding new item
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // Edit price state
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  // Fetch all data
  useEffect(() => {
    document.body.classList.add('manager-page');
    return () => {
      document.body.classList.remove('manager-page');
    };
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch items
      const itemsRes = await fetch("/api/menu");
      const itemsData = await itemsRes.json();
      if (itemsData.success) {
        setItems(itemsData.items || []);
      }

      // Fetch categories
      const catRes = await fetch("/api/categories");
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.categories || []);
      }

      // Fetch ingredients
      const ingRes = await fetch("/api/ingredients");
      const ingData = await ingRes.json();
      if (ingData.success) {
        setIngredients(ingData.ingredients || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle ingredient selection
  const toggleIngredient = (ingId) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingId)
        ? prev.filter((id) => id !== ingId)
        : [...prev, ingId]
    );
  };

  // Add new item
  const handleAddItem = async () => {
    if (!newName.trim()) {
      alert("Item name is required");
      return;
    }
    if (!newPrice || isNaN(Number(newPrice)) || Number(newPrice) <= 0) {
      alert("Valid price is required");
      return;
    }
    if (!newCategory.trim()) {
      alert("Category is required");
      return;
    }
    if (selectedIngredients.length === 0) {
      alert("At least one ingredient is required");
      return;
    }

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          price: Number(newPrice),
          category: newCategory.trim(),
          ingredientIDs: selectedIngredients,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Item added successfully!");
        setNewName("");
        setNewPrice("");
        setNewCategory("");
        setSelectedIngredients([]);
        setShowAddForm(false);
        fetchData();
      } else {
        alert("Failed to add item: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error adding item: " + err.message);
    }
  };

  // Start editing price
  const startEditPrice = (item) => {
    setEditingId(item.id);
    setEditPrice(item.price.toString());
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  // Delete item
  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Item deleted successfully!");
        fetchData();
      } else {
        alert("Failed to delete item: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error deleting item: " + err.message);
    }
  };

  // Update price
  const handleUpdatePrice = async (itemId) => {
    if (!editPrice || isNaN(Number(editPrice)) || Number(editPrice) <= 0) {
      alert("Valid price is required");
      return;
    }

    try {
      const res = await fetch(`/api/menu/${itemId}/price`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(editPrice),
        }),
      });

      if (res.ok) {
        alert("Price updated successfully!");
        cancelEdit();
        fetchData();
      } else {
        const data = await res.json();
        alert("Failed to update price: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error updating price: " + err.message);
    }
  };

  // Filter items by category
  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  // Group items by category for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

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
        <h2>Menu Items Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "+ Add Menu Item"}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Add New Menu Item</h5>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Classic Milk Tea"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Price ($) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="e.g., 4.99"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Category *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Milk Tea"
                  list="categoryList"
                />
                <datalist id="categoryList">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Select Ingredients *</label>
              <div className="border rounded p-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                {ingredients.length === 0 ? (
                  <p className="text-muted">No ingredients available</p>
                ) : (
                  <div className="row g-2">
                    {ingredients.map((ing) => (
                      <div key={ing.id} className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`ing-${ing.id}`}
                            checked={selectedIngredients.includes(ing.id)}
                            onChange={() => toggleIngredient(ing.id)}
                          />
                          <label className="form-check-label" htmlFor={`ing-${ing.id}`}>
                            {ing.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedIngredients.length > 0 && (
                <div className="mt-2 text-muted small">
                  Selected: {selectedIngredients.length} ingredient(s)
                </div>
              )}
            </div>

            <div>
              <button className="btn btn-success me-2" onClick={handleAddItem}>
                Add Item
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewPrice("");
                  setNewCategory("");
                  setSelectedIngredients([]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-3">
        <div className="btn-group" role="group">
          <button
            className={`btn ${
              selectedCategory === "All" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setSelectedCategory("All")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn ${
                selectedCategory === cat ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Display */}
      {Object.keys(groupedItems).length === 0 ? (
        <div className="alert alert-info">No items found</div>
      ) : (
        Object.keys(groupedItems).map((category) => (
          <div key={category} className="mb-4">
            <h4 className="border-bottom pb-2">{category}</h4>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedItems[category].map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="fw-bold">{item.name}</td>
                      <td>
                        {editingId === item.id ? (
                          <div className="input-group input-group-sm" style={{ width: "150px" }}>
                            <span className="input-group-text">$</span>
                            <input
                              type="number"
                              className="form-control"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        ) : (
                          <span>${Number(item.price).toFixed(2)}</span>
                        )}
                      </td>
                      <td>
                        {editingId === item.id ? (
                          <>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleUpdatePrice(item.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => startEditPrice(item)}
                            >
                              Edit Price
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteItem(item.id, item.name)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Summary Stats */}
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Items</h5>
              <p className="display-6">{items.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Categories</h5>
              <p className="display-6">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Average Price</h5>
              <p className="display-6">
                ${items.length > 0
                  ? (
                      items.reduce((sum, item) => sum + Number(item.price), 0) /
                      items.length
                    ).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}