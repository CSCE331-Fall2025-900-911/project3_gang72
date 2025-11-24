import { useEffect, useState } from 'react';
import VoiceNavigationController from '../services/voiceNavigationController';

export default function VoiceNavigationButton() {
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

    useEffect(() => {
        console.log('🎤 Initializing voice navigation...');

        if (!window.voiceController) {
            window.voiceController = new VoiceNavigationController();
        }

        const controller = window.voiceController;

        const savedPref = localStorage.getItem('voiceNavigationEnabled');
        if (savedPref === 'true') {
            controller.start();
            setIsVoiceEnabled(true);
        }

        return () => {
            controller.stop();
        };
    }, []);

    const toggleVoiceNavigation = () => {
        const controller = window.voiceController;

        if (isVoiceEnabled) {
            controller.stop();
            setIsVoiceEnabled(false);
            localStorage.setItem('voiceNavigationEnabled', 'false');
        } else {
            controller.start();
            setIsVoiceEnabled(true);
            localStorage.setItem('voiceNavigationEnabled', 'true');
        }
    };

    return (
        <>
            <button
                onClick={toggleVoiceNavigation}
                tabIndex={-1}   // <-- FIXED
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: isVoiceEnabled ? '#4CAF50' : '#757575',
                    color: 'white',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 9999,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto'
                }}
            >
                {isVoiceEnabled ? '🎤' : '🔇'}
            </button>

            {isVoiceEnabled && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    left: '20px',
                    background: 'rgba(0,0,0,0.9)',
                    color: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    zIndex: 9998,
                    maxWidth: '280px',
                    lineHeight: '1.5'
                }}>
                    <strong>🎙️ Voice Commands:</strong>
                    <ul style={{ paddingLeft: '18px', fontSize: '12px' }}>
                        <li>Go to [page]</li>
                        <li>Click [button]</li>
                        <li>Next / Previous</li>
                        <li>Scroll up / down</li>
                        <li>Confirm / Cancel</li>
                        <li>Log out</li>
                    </ul>
                </div>
            )}
        </>
    );
}
