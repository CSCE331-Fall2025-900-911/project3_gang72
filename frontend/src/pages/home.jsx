import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="text-center mt-5">
            <h1>Welcome Home!</h1>
            <p>Choose a page below:</p>
            <div className="d-flex justify-content-center gap-3 mt-4">
                <Link to="/manager" className="btn btn-primary">Manager</Link>
                <Link to="/cashier" className="btn btn-success">Cashier</Link>
            </div>
        </div>
    );
}
