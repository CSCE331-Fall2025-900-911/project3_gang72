const { OAuth2Client } = require('google-auth-library');

// Read env vars
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:3000/oauth2/callback`;

// Fail fast with a clear error message when required env is missing.
if (!CLIENT_ID) {
    // Throw during module load so the server fails to mount OAuth routes with a clear message.
    throw new Error(
        'GOOGLE_CLIENT_ID is not set. Add `GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com` to backend/.env and restart the server.'
    );
}

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

function getAuthUrlHandler(req, res) {
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['openid', 'email', 'profile'],
        prompt: 'consent',
        redirect_uri: REDIRECT_URI,
    });
    return res.redirect(url);
}

async function oauthCallbackHandler(req, res) {
    try {
        const code = req.query.code;
        if (!code) return res.status(400).send('Missing code');

        const r = await client.getToken({ code, redirect_uri: REDIRECT_URI });
        const tokens = r.tokens;
        client.setCredentials(tokens);

        // Verify ID token and extract payload
        let payload = null;
        if (tokens.id_token) {
            const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: CLIENT_ID });
            payload = ticket.getPayload();
        }

        // determine role and redirect based on manager email
        const MANAGER_EMAIL = (process.env.MANAGER_EMAIL || 'reveille.bubbletea@gmail.com').toLowerCase();
        const email = (payload.email || '').toLowerCase();
        const role = email === MANAGER_EMAIL ? 'manager' : 'staff';
        const redirect = role === 'manager' ? '/manager' : '/';

        // Return a small HTML page that posts the verified payload (including role/redirect) to the opener
        const safePayload = JSON.stringify({ payload, role, redirect, tokens: { hasRefresh: !!tokens.refresh_token } });
        const html = `<!doctype html><html><body><script>\n      (function(){\n        try {\n          const data = ${safePayload};\n          if (window.opener && typeof window.opener.postMessage === 'function') {\n            window.opener.postMessage({ type: 'GOOGLE_AUTH', data }, '*');\n            window.close();\n          } else {\n            document.body.innerText = 'Authentication complete. You may close this window.';\n            console.log('Auth data', data);\n          }\n        } catch (e) { document.body.innerText = 'Auth error'; console.error(e) }\n      })();\n    </script></body></html>`;

        res.set('Content-Type', 'text/html');
        return res.send(html);
    } catch (err) {
        console.error('OAuth callback error', err && err.stack ? err.stack : err);
        return res.status(500).send('OAuth callback error');
    }
}

module.exports = { getAuthUrlHandler, oauthCallbackHandler };
