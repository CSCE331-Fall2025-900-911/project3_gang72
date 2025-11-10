import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import Login from './Login'
import EmployeeManager from './EmployeeManager'
import './styles.css'

function App() {
    const [user, setUser] = useState(null)

    function handleLogin(payload, redirect) {
        // store user in memory (SPA) then perform a full-page redirect so the URL and server state match
        setUser(payload)
        try {
            // prefer server-provided redirect unless it's the root '/'
            const dest = redirect && redirect !== '/' ? redirect : '/employees'
            window.location.href = dest
        } catch (e) {
            console.error('redirect failed', e)
        }
    }

    function handleLogout() {
        setUser(null)
        try { window.history.pushState({}, '', '/') } catch (e) { }
    }

    return (
        <div style={{ padding: 16 }}>
            <h1>POS Demo</h1>
            {!user ? (
                <Login onLogin={handleLogin} />
            ) : (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>Signed in: <strong>{user.email || user.name || 'user'}</strong></div>
                        <div>
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                    <hr />
                    <EmployeeManager />
                </div>
            )}
        </div>
    )
}

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
