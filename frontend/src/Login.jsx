import React, { useEffect, useRef } from 'react'

// Minimal Login component: only Google auth (GSI button if VITE_GOOGLE_CLIENT_ID present) and popup flow
export default function Login({ onLogin }) {
    const buttonRef = useRef(null)

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

    useEffect(() => {
        if (!clientId) return
        if (!window.google) return console.warn('Google Identity script not loaded')
        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (res) => {
                    // pass id token to backend for verification if desired
                    // the popup flow handles server verification; for GSI token you may POST it to /api/auth/google
                    // For now we notify parent that a login happened with the raw credential (server should verify)
                    if (typeof onLogin === 'function') {
                        try { onLogin({ id_token: res?.credential }) } catch (e) { console.error(e) }
                    }
                },
            })
            window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large' })
        } catch (e) {
            console.error('GSI init error', e)
        }

        return () => {
            if (buttonRef.current) buttonRef.current.innerHTML = ''
        }
    }, [clientId, onLogin])

    // Popup-based OAuth code flow: open backend /auth/google and receive postMessage
    useEffect(() => {
        function handleMessage(e) {
            try {
                const envelope = e.data
                if (!envelope || envelope.type !== 'GOOGLE_AUTH') return
                const d = envelope.data || {}
                // d contains: payload, role, redirect, tokens
                if (d.payload) {
                    if (typeof onLogin === 'function') {
                        try { onLogin(d.payload, d.redirect) } catch (err) { console.error('onLogin threw', err) }
                    }
                }
                if (d.redirect) {
                    window.location.href = d.redirect
                }
            } catch (err) {
                console.error('message handling error', err)
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [onLogin])

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
                {clientId ? (
                    <div ref={buttonRef} style={{ marginTop: 10 }} />
                ) : (
                    <p style={{ marginTop: 10 }}>No client ID configured for GSI. Use popup instead.</p>
                )}

                <div style={{ marginTop: 12 }}>
                    <button onClick={openPopup}>Sign in with Google (popup)</button>
                </div>
            </div>
        </div>
    )
}
