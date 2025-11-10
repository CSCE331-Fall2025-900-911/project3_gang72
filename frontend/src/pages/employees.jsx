import { useOutletContext } from "react-router-dom";

export default function Employees() {
    const { employees } = useOutletContext();

    return (
        <div>
            <h2>Employees</h2>
            {employees && employees.length > 0 ? (
                <ul>
                    {employees.map(emp => (
                        <li key={emp.id}>{emp.firstName} {emp.lastName}</li>
                    ))}
                </ul>
            ) : <p>No employees found</p>}
        </div>
    );
}