import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Login page: Google OAuth with @tamu.edu email verification
export default function Login() {
    const buttonRef = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

    // Get the page the user was trying to access and any error message
    const from = location.state?.from || '/'
    const routeError = location.state?.error || ''

    // Set initial error from route state if present
    useEffect(() => {
        if (routeError) {
            setError(routeError)
        }
    }, [routeError])

    useEffect(() => {
        if (!clientId) return
        if (!window.google) return console.warn('Google Identity script not loaded')
        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
            })
            window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large' })
        } catch (e) {
            console.error('GSI init error', e)
            setError('Failed to initialize Google Sign-In')
        }

        return () => {
            if (buttonRef.current) buttonRef.current.innerHTML = ''
        }
    }, [clientId])

    // Popup-based OAuth code flow
    useEffect(() => {
        function handleMessage(e) {
            try {
                const envelope = e.data
                if (!envelope || envelope.type !== 'GOOGLE_AUTH') return
                const d = envelope.data || {}

                if (d.payload) {
                    handleAuthSuccess(d.payload)
                }
            } catch (err) {
                console.error('message handling error', err)
                setError('Authentication failed. Please try again.')
                setLoading(false)
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [from])

    function handleCredentialResponse(response) {
        if (!response.credential) return
        setLoading(true)
        setError('')

        // Send token to backend for verification
        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
        fetch(`${apiBase}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: response.credential })
        })
            .then(res => res.json())
            .then(data => {
                if (data.email) {
                    handleAuthSuccess(data)
                } else {
                    setError('Failed to verify authentication')
                    setLoading(false)
                }
            })
            .catch(err => {
                console.error('Auth verification failed:', err)
                setError('Authentication failed. Please try again.')
                setLoading(false)
            })
    }

    function resetGoogleButton() {
        // Force re-render of Google Sign-In button
        if (buttonRef.current) {
            buttonRef.current.innerHTML = ''
            if (window.google && window.google.accounts && window.google.accounts.id) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: clientId,
                        callback: handleCredentialResponse,
                    })
                    window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large' })
                    window.google.accounts.id.disableAutoSelect()
                } catch (e) {
                    console.error('Error resetting Google button:', e)
                }
            }
        }
    }

    function handleAuthSuccess(userData) {
        // Check if email ends with @tamu.edu
        if (!userData.email || !userData.email.toLowerCase().endsWith('@tamu.edu')) {
            setError('Access denied. Only @tamu.edu email addresses are allowed.')
            setLoading(false)
            sessionStorage.removeItem('user')

            // Reset the Google Sign-In button to allow selecting a different account
            setTimeout(() => {
                resetGoogleButton()
            }, 100)
            return
        }

        // Store user data in sessionStorage
        sessionStorage.setItem('user', JSON.stringify(userData))
        setLoading(false)

        // Navigate back to the page they were trying to access
        navigate(from, { replace: true })
    }

    function openPopup() {
        setError('')
        setLoading(true)
        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
        const url = `${apiBase}/auth/google`
        const w = window.open(url, 'google-auth', 'width=500,height=700')
        if (!w) {
            alert('Popup blocked — allow popups for this site')
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <div className="row justify-content-center mt-5">
                <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
                    <div className="card shadow" style={{ minWidth: '350px' }}>
                        <div className="card-body text-center p-5">
                            <h2 className="card-title mb-3">Sign in with Google</h2>
                            <p className="text-muted mb-4">Authentication required to access this page</p>

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            {loading && (
                                <div className="mb-3">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            )}

                            {clientId && !loading && (
                                <div ref={buttonRef} className="mb-3" />
                            )}

                            {!clientId && !loading && (
                                <div className="alert alert-warning" role="alert">
                                    <small>Google Sign-In is not configured. Please contact an administrator.</small>
                                </div>
                            )}                            <div className="mt-4 text-muted small">
                                <p className="mb-0">Only @tamu.edu accounts can access</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
