import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TodoInputProps {
  value: string
  setInputValue: (value: string) => void
  handleAddTodo: () => void
}

export function TodoInput({ value, setInputValue, handleAddTodo }: TodoInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="todo-input">Nouvelle tâche</Label>
      <div className="flex gap-2">
        <Input
          id="todo-input"
          type="text"
          placeholder="Ajouter une tâche..."
          value={value}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <Button onClick={handleAddTodo}>Ajouter</Button>
      </div>
    </div>
  )
}