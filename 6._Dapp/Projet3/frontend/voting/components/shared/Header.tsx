import ConnectButton from "./ConnectButton"
import { Vote } from "lucide-react"

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Vote className="size-5 text-primary" />
          <span>VotingDApp</span>
        </div>
        <ConnectButton />
      </div>
    </header>
  )
}

export default Header
