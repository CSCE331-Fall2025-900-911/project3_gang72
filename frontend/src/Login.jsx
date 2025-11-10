import React, { useEffect, useRef, useState } from 'react'

// Login component: initializes Google Identity Services if a Vite env var is present
export default function Login({ onLogin }) {
    const [clientIdInput, setClientIdInput] = useState('')
    const [token, setToken] = useState(null)
    const buttonRef = useRef(null)
    const [verifiedUser, setVerifiedUser] = useState(null)

    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    const clientId = envClientId || clientIdInput

    useEffect(() => {
        if (!clientId) return
        if (!window.google) return console.warn('Google Identity script not loaded')
        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
            })
            window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large' })
            // optionally show One Tap
            // window.google.accounts.id.prompt()
        } catch (e) {
            console.error('GSI init error', e)
        }

        return () => {
            if (buttonRef.current) buttonRef.current.innerHTML = ''
        }
    }, [clientId])

    function handleCredentialResponse(res) {
        setToken(res?.credential || null)
    }

    function initFromInput() {
        if (!clientIdInput) return alert('Paste your Google Client ID in the box')
        setClientIdInput(clientIdInput.trim())
    }

    // Popup-based OAuth code flow: open backend /auth/google and receive postMessage
    useEffect(() => {
        function handleMessage(e) {
            try {
                const envelope = e.data;
                if (!envelope || envelope.type !== 'GOOGLE_AUTH') return;
                const d = envelope.data || {};
                // d contains: payload, role, redirect, tokens
                if (d.payload) {
                    setVerifiedUser(d.payload);
                    // inform parent that a user has just logged in and pass redirect if present
                    if (typeof onLogin === 'function') {
                        try { onLogin(d.payload, d.redirect) } catch (e) { console.error('onLogin threw', e) }
                    }
                }
                // if server wants to redirect (e.g., manager -> /manager), follow it immediately
                if (d.redirect) {
                    window.location.href = d.redirect;
                    return;
                }
            } catch (err) {
                console.error('message handling error', err);
            }
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [])

    function openPopup() {
        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
        const url = `${apiBase}/auth/google`
        const w = window.open(url, 'google-auth', 'width=500,height=700')
        if (!w) alert('Popup blocked — allow popups for this site')
    }

    return (
        <div className="login-page">
            <div className="card">
                <h2>Sign in with Google</h2>
                <p>Paste your Google Client ID below if you didn't set VITE_GOOGLE_CLIENT_ID.</p>

                <label>Google Client ID</label>
                <input
                    type="text"
                    placeholder="...apps.googleusercontent.com"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                />
                <div style={{ marginTop: 8 }}>
                    <button onClick={initFromInput}>Initialize</button>
                </div>

                <div className="gsi-button" ref={buttonRef} style={{ marginTop: 20 }} />

                <div className="token-area">
                    <label>ID Token</label>
                    <textarea readOnly value={token || ''} rows={6} />
                </div>

                <p className="note">This demo posts the ID token to your backend at <code>/api/auth/google</code> for verification.</p>
                <div style={{ marginTop: 12 }}>
                    <button onClick={openPopup}>Sign in with Google (popup)</button>
                </div>

                {verifiedUser && (
                    <div style={{ marginTop: 12 }}>
                        <h4>Verified user (from server)</h4>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(verifiedUser, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    )
}
