const { OAuth2Client } = require('google-auth-library');

// Load GOOGLE_CLIENT_ID from environment (backend/.env)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

/**
 * verifyIdToken: verifies an ID token and returns the payload
 * @param {string} idToken
 * @returns {Promise<object>} payload
 */
async function verifyIdToken(idToken) {
    if (!idToken) throw new Error('idToken required');
    const ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
    return ticket.getPayload();
}

const MANAGER_EMAIL = (process.env.MANAGER_EMAIL || 'reveille.bubbletea@gmail.com').toLowerCase();

async function verifyTokenHandler(req, res) {
    try {
        const { id_token, idToken, token } = req.body || {};
        const id = id_token || idToken || token;
        if (!id) return res.status(400).json({ error: 'id_token is required in JSON body' });
        
        const payload = await verifyIdToken(id);

        // Determine role (simple: match manager email)
        const email = (payload.email || '').toLowerCase();
        const role = email === MANAGER_EMAIL ? 'manager' : 'staff';
        const redirect = role === 'manager' ? '/manager' : '/';
         console.log({
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            email_verified: payload.email_verified,
            role,
            redirect,
        });
        // Basic payload returned to frontend; in a real app, create/find a local user record
        return res.json({
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            email_verified: payload.email_verified,
            role,
            redirect,
        });
    } catch (err) {
        console.error('Error verifying Google ID token:', err && err.stack ? err.stack : err);
        return res.status(401).json({ error: 'Invalid ID token' });
    }
}

/**
 * logoutHandler: handles logout by clearing user session
 * @param {object} req
 * @param {object} res
 */
function logoutHandler(req, res) {
    try {
        // Log the logout event
        console.log('User logout request processed');
        
        // Return success response - frontend will handle clearing sessionStorage
        return res.json({ 
            success: true,
            message: 'Logout successful' 
        });
    } catch (err) {
        console.error('Error during logout:', err);
        return res.status(500).json({ error: 'Logout failed' });
    }
}

module.exports = {
    verifyIdToken,
    verifyTokenHandler,
    logoutHandler,
};
