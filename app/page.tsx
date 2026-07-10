"use client";

import { useEffect, useState } from "react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  archived: boolean;
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todos";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loaded, setLoaded] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Todo>[];
        // Backfill `archived` for todos saved before this feature existed.
        setTodos(
          parsed.map((t) => ({
            id: t.id ?? crypto.randomUUID(),
            text: t.text ?? "",
            done: t.done ?? false,
            archived: t.archived ?? false,
          }))
        );
      }
    } catch {}

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [todos, loaded]);

  function addTodo() {
    const value = text.trim();

    if (!value) {
      alert("Please enter a todo!");
      return;
    }

    setTodos((prev) => [
      {
        id: crypto.randomUUID(),
        text: value,
        done: false,
        archived: false,
      },
      ...prev,
    ]);

    setText("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      )
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.done));
  }

  // NEW FEATURE
  function deleteAll() {
    if (confirm("Delete all todos?")) {
      setTodos([]);
    }
  }

  // NEW FEATURE: Archive / Unarchive
  function toggleArchive(id: string) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, archived: !t.archived } : t
      )
    );
  }

  // NEW FEATURE: Edit
  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function saveEdit(id: string) {
    const value = editText.trim();

    if (!value) {
      // Empty edit deletes the todo, matching common todo-app behavior.
      deleteTodo(id);
    } else {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, text: value } : t))
      );
    }

    cancelEdit();
  }

  // NEW FEATURE: Reorder. `dir` is -1 to move up, +1 to move down.
  // Operates on the position within the currently visible list so the
  // arrows do what the user sees, then maps back to the full array.
  function moveTodo(id: string, dir: -1 | 1) {
    setTodos((prev) => {
      const view = prev.filter((t) => t.archived === showArchived);
      const viewIndex = view.findIndex((t) => t.id === id);
      const swapWith = view[viewIndex + dir];

      if (!swapWith) return prev; // Already at the edge.

      const next = [...prev];
      const from = next.findIndex((t) => t.id === id);
      const to = next.findIndex((t) => t.id === swapWith.id);
      [next[from], next[to]] = [next[to], next[from]];

      return next;
    });
  }

  const visible = todos.filter((t) => {
    if (t.archived !== showArchived) return false;
    return filter === "active"
      ? !t.done
      : filter === "completed"
      ? t.done
      : true;
  });

  const active = todos.filter((t) => !t.archived);
  const remaining = active.filter((t) => !t.done).length;

  // NEW FEATURE
  const completed = active.length - remaining;
  const archivedCount = todos.length - active.length;

  return (
    <div className="flex min-h-screen flex-col items-center p-6 sm:p-24">
      <main className="flex w-full max-w-md flex-1 flex-col gap-6">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
           Todo Application
        </h1>

        {/* NEW FEATURE */}
        <p className="text-sm text-zinc-500">
          Stay organized and finish your tasks.
        </p>

        {/* NEW FEATURE */}
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="text-sm">
            <strong>Total:</strong> {active.length}
          </p>
          <p className="text-sm">
            <strong>Completed:</strong> {completed}
          </p>
          <p className="text-sm">
            <strong>Remaining:</strong> {remaining}
          </p>
          <p className="text-sm">
            <strong>Archived:</strong> {archivedCount}
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="What needs to be done?"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />

          <button
            onClick={addTodo}
            className="rounded-lg bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            Add
          </button>
        </div>

        {/* NEW FEATURE: Active / Archived view toggle */}
        <div className="flex gap-1 text-sm">
          <button
            onClick={() => setShowArchived(false)}
            className={
              "rounded px-2 py-1 transition-colors " +
              (!showArchived
                ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-black dark:hover:text-zinc-50")
            }
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={
              "rounded px-2 py-1 transition-colors " +
              (showArchived
                ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-black dark:hover:text-zinc-50")
            }
          >
            Archived ({archivedCount})
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {visible.map((todo, index) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              {/* Reorder controls */}
              <div className="flex flex-col">
                <button
                  onClick={() => moveTodo(todo.id, -1)}
                  disabled={index === 0}
                  className="text-xs leading-none text-zinc-400 transition-colors hover:text-black disabled:opacity-30 dark:hover:text-zinc-50"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveTodo(todo.id, 1)}
                  disabled={index === visible.length - 1}
                  className="text-xs leading-none text-zinc-400 transition-colors hover:text-black disabled:opacity-30 dark:hover:text-zinc-50"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>

              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
                className="h-4 w-4 accent-black dark:accent-zinc-50"
              />

              {editingId === todo.id ? (
                <input
                  type="text"
                  value={editText}
                  autoFocus
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(todo.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={() => saveEdit(todo.id)}
                  className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              ) : (
                <span
                  onDoubleClick={() => startEdit(todo)}
                  className={
                    "flex-1 cursor-text text-black dark:text-zinc-50 " +
                    (todo.done
                      ? "text-zinc-400 line-through dark:text-zinc-500"
                      : "")
                  }
                >
                  {todo.text}
                </span>
              )}

              {/* Edit */}
              {editingId !== todo.id && (
                <button
                  onClick={() => startEdit(todo)}
                  className="text-sm text-zinc-400 transition-colors hover:text-black dark:hover:text-zinc-50"
                  aria-label="Edit todo"
                >
                  ✎
                </button>
              )}

              {/* Archive / Unarchive */}
              <button
                onClick={() => toggleArchive(todo.id)}
                className="text-sm text-zinc-400 transition-colors hover:text-black dark:hover:text-zinc-50"
                aria-label={todo.archived ? "Unarchive todo" : "Archive todo"}
                title={todo.archived ? "Unarchive" : "Archive"}
              >
                {todo.archived ? "↩" : "🗄"}
              </button>

              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-sm text-zinc-400 transition-colors hover:text-red-500"
                aria-label="Delete todo"
              >
                ✕
              </button>
            </li>
          ))}

          {visible.length === 0 && (
            <li className="py-8 text-center text-sm text-zinc-400">
              {showArchived
                ? "No archived todos."
                : todos.length === 0
                ? "No todos yet."
                : "Nothing here."}
            </li>
          )}
        </ul>

        {!showArchived && active.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
            <span>
              {remaining} item{remaining === 1 ? "" : "s"} left
            </span>

            <div className="flex gap-1">
              {(["all", "active", "completed"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    "rounded px-2 py-1 capitalize transition-colors " +
                    (filter === f
                      ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-50"
                      : "hover:text-black dark:hover:text-zinc-50")
                  }
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearCompleted}
                className="transition-colors hover:text-black dark:hover:text-zinc-50"
              >
                Clear Done
              </button>

              {/* NEW FEATURE */}
              <button
                onClick={deleteAll}
                className="transition-colors hover:text-red-500"
              >
                Delete All
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
