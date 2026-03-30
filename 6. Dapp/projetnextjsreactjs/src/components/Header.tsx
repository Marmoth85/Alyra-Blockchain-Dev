import Link from "next/link";

const Header = () => {
    return (
        <div className="bg-sky-500 p-5">
            <div>Logo</div>
            <div className="menu">
                <Link href="/">Home</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/cv">CV</Link>
            </div> 
        </div>
        
    )
}

export default Header;