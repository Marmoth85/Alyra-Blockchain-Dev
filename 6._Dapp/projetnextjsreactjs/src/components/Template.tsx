import Header from "./Header";
import Footer from "./Footer";

const Template = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Header />
            <div className="bg-green-500 p-5">{children}</div>
            <Footer />
        </>
    )
}

export default Template;