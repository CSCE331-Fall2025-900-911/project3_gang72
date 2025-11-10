import { useEffect, useState } from "react";

export default function Manager() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetch("/api/employees")
      .then(res => res.json())
      .then(data => {
        // backend returns { success: true, employees: [...] }
        if (data.success && Array.isArray(data.employees)) {
          setEmployees(data.employees);
        } else {
          setEmployees([]);
        }
      })
      .catch(error => console.error("Error fetching employees:", error));
  }, []);

  return (
    <div className="p-4">
      <h1>Manager Dashboard</h1>
      {employees.length > 0 ? (
        <ul>
          {employees.map(emp => (
            <li key={emp.id}>{emp.firstName} {emp.lastName}</li>
          ))}
        </ul>
      ) : (
        <p>No employees found</p>
      )}
    </div>
  );
}
