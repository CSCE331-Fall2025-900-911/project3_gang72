
import { useState, useEffect } from "react";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for adding new employee
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Edit state
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
      } else {
        setError(data.error || "Failed to fetch employees");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Add employee
  const handleAddEmployee = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      alert("First and last name are required");
      return;
    }

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          password: newPassword.trim(),
        }),
      });

      if (res.ok) {
        alert("Employee added successfully!");
        setNewFirstName("");
        setNewLastName("");
        setNewPassword("");
        setShowAddForm(false);
        fetchEmployees();
      } else {
        const data = await res.json();
        alert("Failed to add employee: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error adding employee: " + err.message);
    }
  };

  // Start editing
  const startEdit = (emp) => {
    setEditingEmployee(emp.id);
    setEditFirstName(emp.firstName || "");
    setEditLastName(emp.lastName || "");
    setEditPassword("");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingEmployee(null);
    setEditFirstName("");
    setEditLastName("");
    setEditPassword("");
  };

  // Update employee (you'll need to add this endpoint to your backend)
  const handleUpdateEmployee = async (empId) => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      alert("First and last name are required");
      return;
    }

    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          password: editPassword.trim() || undefined,
        }),
      });

      if (res.ok) {
        alert("Employee updated successfully!");
        cancelEdit();
        fetchEmployees();
      } else {
        const data = await res.json();
        alert("Failed to update employee: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error updating employee: " + err.message);
    }
  };

  // Delete employee (you'll need to add this endpoint to your backend)
  const handleDeleteEmployee = async (empId, empName) => {
    if (!confirm(`Are you sure you want to delete ${empName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Employee deleted successfully!");
        fetchEmployees();
      } else {
        const data = await res.json();
        alert("Failed to delete employee: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error deleting employee: " + err.message);
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
        <h2>Employee Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "+ Add Employee"}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Add Employee Form */}
      {showAddForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Add New Employee</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="mt-3">
              <button 
                className="btn btn-success me-2"
                onClick={handleAddEmployee}
              >
                Add Employee
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setNewFirstName("");
                  setNewLastName("");
                  setNewPassword("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div className="card">
        <div className="card-body">
          {employees.length === 0 ? (
            <p className="text-muted text-center">No employees found</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Password</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      {editingEmployee === emp.id ? (
                        <>
                          <td>{emp.id}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={editFirstName}
                              onChange={(e) => setEditFirstName(e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={editLastName}
                              onChange={(e) => setEditLastName(e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="password"
                              className="form-control form-control-sm"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="Leave blank to keep current"
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleUpdateEmployee(emp.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{emp.id}</td>
                          <td>{emp.firstName}</td>
                          <td>{emp.lastName}</td>
                          <td>
                            <span className="text-muted">
                              {emp.password ? "••••••••" : "Not set"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => startEdit(emp)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleDeleteEmployee(
                                  emp.id,
                                  `${emp.firstName} ${emp.lastName}`
                                )
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}