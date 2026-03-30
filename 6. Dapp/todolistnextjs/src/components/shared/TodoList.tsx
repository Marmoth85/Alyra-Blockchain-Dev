"use client"

import { useEffect, useState } from "react"
import { TodoInput } from "./TodoInput"
import { TodoItem } from "./TodoItem"

interface Todo {
  id: string
  text: string
  completed: boolean
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    try {
      const stored = localStorage.getItem("todos")
      if (stored) setTodos(JSON.parse(stored))
    } catch {
      // localStorage inaccessible — on garde le tableau vide
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))
  }, [todos])

  const handleAddTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, { id: crypto.randomUUID(), text: inputValue.trim(), completed: false }])
      setInputValue("")
    }
  }

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <TodoInput
        value={inputValue}
        setInputValue={setInputValue}
        handleAddTodo={handleAddTodo}
      />

      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune tâche pour le moment
          </p>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                {...todo}
                handleToggleTodo={handleToggleTodo}
                handleDeleteTodo={handleDeleteTodo}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}