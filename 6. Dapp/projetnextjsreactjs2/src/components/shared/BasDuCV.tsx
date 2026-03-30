'use client';
import { useTheme } from "@/context/useTheme";

const BasDuCV = () => {

    const { darkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                backgroundColor: darkMode ? "black" : "white",
                color: darkMode ? "white": "black"
            }}
        >
            {darkMode ? "Passer en mode clair": "Passer en mode dark"}
        </button>
    )
}

export default BasDuCV