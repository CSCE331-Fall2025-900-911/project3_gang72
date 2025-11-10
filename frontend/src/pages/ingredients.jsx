import { useOutletContext } from "react-router-dom";

export default function Ingredients() {
    const { ingredients } = useOutletContext();

    return (
        <div>
            <h2>Ingredients</h2>
            {ingredients && ingredients.length > 0 ? (
                <ul>
                    {ingredients.map(ing => (
                        <li key={ing.id}>{ing.name} - {ing.quantity}</li>
                    ))}
                </ul>
            ) : <p>No ingredients found</p>}
        </div>
    );
}