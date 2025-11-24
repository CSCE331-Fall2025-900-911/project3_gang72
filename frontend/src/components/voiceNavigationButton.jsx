// frontend/src/components/VoiceNavigationButton.jsx

import { useEffect, useState } from 'react';
import VoiceNavigationController from '../services/voiceNavigationController';

export default function VoiceNavigationButton() {
    const [voiceController, setVoiceController] = useState(null);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

    // Initialize voice navigation
    useEffect(() => {
        console.log('🎤 Initializing voice controller...');

        const controller = new VoiceNavigationController();
        setVoiceController(controller);

        // Make it globally accessible for pages to add custom commands
        window.voiceController = controller;

        // Check if user had voice enabled before
        const savedPref = localStorage.getItem('voiceNavigationEnabled');
        if (savedPref === 'true') {
            controller.start();
            setIsVoiceEnabled(true);
        }

        // Register app-wide navigation commands
        controller.registerCommand(['go to home', 'home page'], () => {
            window.location.href = '/';
        });

        controller.registerCommand(['go to manager', 'manager page'], () => {
            window.location.href = '/manager';
        });

        controller.registerCommand(['go to cashier', 'cashier page'], () => {
            window.location.href = '/cashier';
        });

        controller.registerCommand(['go to kiosk', 'kiosk page'], () => {
            window.location.href = '/kiosk';
        });

        controller.registerCommand(['go to menu', 'menu page', 'show menu'], () => {
            window.location.href = '/menu';
        });

        controller.registerCommand(['go to employees', 'employees page'], () => {
            window.location.href = '/manager/employees';
        });

        controller.registerCommand(['go to ingredients', 'ingredients page', 'inventory'], () => {
            window.location.href = '/manager/ingredients';
        });

        controller.registerCommand(['go to sales', 'sales page', 'sales report'], () => {
            window.location.href = '/manager/sales';
        });

        controller.registerCommand(['go to items', 'items page'], () => {
            window.location.href = '/manager/items';
        });

        controller.registerCommand(['log out', 'sign out', 'logout'], () => {
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        });

        console.log('✅ Voice controller initialized');

        // Cleanup
        return () => {
            if (controller) {
                controller.stop();
            }
        };
    }, []);

    // Toggle voice on/off
    const toggleVoiceNavigation = () => {
        if (!voiceController) {
            console.error('Voice controller not initialized');
            return;
        }

        if (isVoiceEnabled) {
            voiceController.stop();
            setIsVoiceEnabled(false);
            localStorage.setItem('voiceNavigationEnabled', 'false');
            console.log('🔇 Voice navigation disabled');
        } else {
            voiceController.start();
            setIsVoiceEnabled(true);
            localStorage.setItem('voiceNavigationEnabled', 'true');
            console.log('🎤 Voice navigation enabled');
        }
    };

    return (
        <>
            {/* Voice Control Toggle Button */}
            <button
                onClick={toggleVoiceNavigation}
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
                    justifyContent: 'center'
                }}
                title={isVoiceEnabled ? 'Voice Control: ON (Click to disable)' : 'Voice Control: OFF (Click to enable)'}
                aria-label={isVoiceEnabled ? 'Disable voice navigation' : 'Enable voice navigation'}
            >
                {isVoiceEnabled ? '🎤' : '🔇'}
            </button>

            {/* Voice Commands Help - shows when enabled */}
            {isVoiceEnabled && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    left: '20px',
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    zIndex: 9998,
                    maxWidth: '280px',
                    lineHeight: '1.5',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                    <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                        🎙️ Voice Commands:
                    </strong>
                    <ul style={{ margin: '0', paddingLeft: '18px', fontSize: '12px' }}>
                        <li>Go to [page name]</li>
                        <li>Click [button name]</li>
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