import Header from "./Header"
import Footer from "./Footer"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <div className="grow p-5">
            {children}
        </div>
        <Footer />
    </div>
  )
}

export default Layout