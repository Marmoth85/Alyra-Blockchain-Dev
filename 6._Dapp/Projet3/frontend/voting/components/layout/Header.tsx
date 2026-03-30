import { Vote } from 'lucide-react'
import ConnectButton from './ConnectButton'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-amber-500/15 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-[0_1px_20px_oklch(0.78_0.17_55/8%)]">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 font-bold tracking-tight text-foreground">
          <div className="flex items-center justify-center size-7 rounded-md bg-amber-500/15 ring-1 ring-amber-500/30">
            <Vote className="size-4 text-amber-400" />
          </div>
          <span>VotingDApp</span>
        </div>
        <ConnectButton />
      </div>
    </header>
  )
}
