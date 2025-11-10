import React, { useEffect, useState } from 'react'

export default function EmployeeManager() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [password, setPassword] = useState('')

    const API_BASE = import.meta.env.VITE_API_BASE || ''
    const API = API_BASE + '/api/employees'

    async function loadEmployees() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(API, { credentials: 'same-origin' })
            if (!res.ok) throw new Error(`Fetch error ${res.status}`)
            const json = await res.json()
            setEmployees(json.employees || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadEmployees() }, [])

    async function handleAdd(e) {
        e.preventDefault()
        if (!firstName.trim() || !lastName.trim()) return alert('First and last name required')
        try {
            const body = { firstName: firstName.trim(), lastName: lastName.trim(), password: password }
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) throw new Error(`Add failed ${res.status}`)
            const created = await res.json()
            // Add to local state
            setEmployees((s) => [...s, { id: created.id, firstName: created.firstName, lastName: created.lastName, password: created.password }])
            setFirstName(''); setLastName(''); setPassword('')
        } catch (err) {
            alert('Failed to add employee: ' + err.message)
        }
    }

    // Deletion has been removed per project request.

    return (
        <div className="employee-page">
            <h2>Employees</h2>
            <div style={{ marginBottom: 12 }}>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    <input placeholder="Password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit">Add</button>
                </form>
            </div>

            {loading && <div>Loading...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}

            <table className="employees-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>ID</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>First</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Last</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Password</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp) => (
                        <tr key={emp.id}>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{emp.id}</td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{emp.firstName}</td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{emp.lastName}</td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{emp.password}</td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
