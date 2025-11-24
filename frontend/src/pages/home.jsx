import { Link } from "react-router-dom";
import { useEffect } from 'react';

export default function Home() {
    useEffect(() => {
        if (window.voiceController) {
            // Add home-specific helpful commands
            window.voiceController.registerCommand(
                ['show options', 'what can I do', 'help'],
                () => {
                    window.voiceController.speak('You can say: go to manager, go to cashier, go to kiosk, or go to menu');
                }
            );
        }
    }, []);

    return (
        <div className="text-center mt-5">
            <h1>Welcome Home!</h1>
            <p>Choose a page below:</p>
            <div className="d-flex justify-content-center gap-3 mt-4">
                <Link to="/manager" className="btn btn-primary">Manager</Link>
                <Link to="/cashier" className="btn btn-success">Cashier</Link>
                <Link to="/kiosk" className="btn btn-primary">Kiosk</Link>
                <Link to="/menu" className="btn btn-success">Menu</Link>
            </div>
        </div>
    );
}