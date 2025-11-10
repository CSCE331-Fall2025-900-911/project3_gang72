import { useOutletContext } from "react-router-dom";

export default function Sales() {
    const { sales } = useOutletContext();

    return (
        <div>
            <h2>Sales</h2>
            {sales && sales.length > 0 ? (
                <ul>
                    {sales.map(sale => (
                        <li key={sale.id}>Receipt #{sale.id}: ${sale.total}</li>
                    ))}
                </ul>
            ) : <p>No sales data found</p>}
        </div>
    );
}