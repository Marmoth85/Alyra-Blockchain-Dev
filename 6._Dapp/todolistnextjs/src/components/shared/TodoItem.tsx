import { Button } from "@/components/ui/button"

interface TodoItemProps {
  id: string
  text: string
  completed: boolean
  handleToggleTodo: (id: string) => void
  handleDeleteTodo: (id: string) => void
}

export function TodoItem({ id, text, completed, handleToggleTodo, handleDeleteTodo }: TodoItemProps) {
  return (
    <li className="flex items-center justify-between gap-2 p-3 rounded-md border bg-card">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={completed}
          onChange={() => handleToggleTodo(id)}
          className="h-4 w-4 cursor-pointer"
        />
        <span className={`text-sm ${completed ? "line-through text-muted-foreground" : ""}`}>
          {text}
        </span>
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleDeleteTodo(id)}
      >
        Supprimer
      </Button>
    </li>
  )
}