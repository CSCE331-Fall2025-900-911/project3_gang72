
import { useEffect, useState } from 'react';

export default function HighContrastToggle() {
    const [isHighContrast, setIsHighContrast] = useState(false);

    useEffect(() => {
        // Check if high contrast was previously enabled
        const savedPref = localStorage.getItem('highContrastMode');
        if (savedPref === 'true') {
            enableHighContrast();
            setIsHighContrast(true);
        }
    }, []);

    const enableHighContrast = () => {
        document.body.classList.add('high-contrast-mode');
    };

    const disableHighContrast = () => {
        document.body.classList.remove('high-contrast-mode');
    };

    const toggleHighContrast = () => {
        if (isHighContrast) {
            disableHighContrast();
            setIsHighContrast(false);
            localStorage.setItem('highContrastMode', 'false');
        } else {
            enableHighContrast();
            setIsHighContrast(true);
            localStorage.setItem('highContrastMode', 'true');
        }
    };

    return (
        <button
            onClick={toggleHighContrast}
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '90px', // Next to voice button
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: isHighContrast ? '#000' : '#757575',
                color: 'white',
                border: isHighContrast ? '3px solid #fff' : 'none',
                fontSize: '28px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 9999,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            title={isHighContrast ? 'High Contrast: ON (Click to disable)' : 'High Contrast: OFF (Click to enable)'}
            aria-label={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
        >
            {isHighContrast ? '◐' : '○'}
        </button>
    );
}