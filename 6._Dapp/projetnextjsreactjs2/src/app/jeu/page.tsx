'use client';
import { useState, useEffect } from "react";
import Link from "next/link";

const JeuPage = () => {

    const [compteur, setCompteur] = useState(0)

    const increment = () => {
        setCompteur((compteur) => compteur + 1);
    }

    // Qu'est ce qu'il se passe lorsque le state compteur a changé
    useEffect(() => {
        console.log('Compteur a changé !!!');
    }, [compteur])

    // Qu'est ce qu'il se passe lorsque le composant est monté
    useEffect(() => {
        console.log('La page est chargée');
    }, [])

    // Qu'est ce qu'il se passe lorsque il y a eu un rerender ?
    useEffect(() => {
        console.log('Quelque chose a changé');
    })

    // Que faire au démontage du composant ?
    useEffect(() => {
        return () => {
            alert('Le composant est démonté');
        }
    }, [])

    return (
        <>
            State : {compteur}<br />
            <button onClick={() => increment()}>Incrémenter</button>
            <Link href="/">Home</Link>
        </>
    )
}

export default JeuPage;