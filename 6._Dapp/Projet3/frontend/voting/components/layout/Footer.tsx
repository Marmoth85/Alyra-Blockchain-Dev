import { Vote } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-amber-500/10 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center size-6 rounded bg-amber-500/10 ring-1 ring-amber-500/25">
            <Vote className="size-3.5 text-amber-400" />
          </div>
          <span className="text-sm font-semibold text-foreground/70">VotingDApp</span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Décentralised governance on Ethereum
        </p>
        <span className="text-xs text-muted-foreground/50 shrink-0">
          &copy; {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  )
}
