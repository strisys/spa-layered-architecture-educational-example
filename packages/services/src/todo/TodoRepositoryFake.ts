import { delay } from "@todo/shared";
import { PersistenceStatus, Todo, TodoStatus } from "@todo/model";
import type { ITodoState } from "@todo/model";
import type { ITodoRepository } from "./ITodoRepository";


function createPersistedTodo(state: Partial<ITodoState>): Todo {
  const todo = new Todo(state);
  todo.persistenceStatus = PersistenceStatus.InSync;
  return todo;
}

const defaultTodos: Todo[] = [
  createPersistedTodo({ title: "Buy groceries", status: TodoStatus.Active }),
  createPersistedTodo({ title: "Walk the dog", status: TodoStatus.Active }),
  createPersistedTodo({ title: "Read a book", status: TodoStatus.Completed }),
  createPersistedTodo({ title: "Write unit tests", status: TodoStatus.Active }),
  createPersistedTodo({ title: "Clean the kitchen", status: TodoStatus.Completed }),
  createPersistedTodo({ title: "Fix the leaky faucet", status: TodoStatus.Active }),
  createPersistedTodo({ title: "Schedule dentist appointment", status: TodoStatus.Active }),
  createPersistedTodo({ title: "Update resume", status: TodoStatus.Completed }),
  createPersistedTodo({ title: "Plan weekend trip", status: TodoStatus.Active }),
  createPersistedTodo({ title: "Organize desk", status: TodoStatus.Active }),
];

export class TodoRepositoryFake implements ITodoRepository {
  private _todos: Todo[] = [...defaultTodos];

  public async getAll(): Promise<Todo[]> {
    await delay(TodoRepositoryFake.FAKE_DELAY_MS);
    return [...this._todos];
  }

  public async getByUuid(uuid: string): Promise<Todo | undefined> {
    await delay(TodoRepositoryFake.FAKE_DELAY_MS);
    return this._todos.find((todo) => todo.uuid === uuid);
  }

  public async create(todo: Todo): Promise<Todo> {
    await delay(TodoRepositoryFake.FAKE_DELAY_MS);
    todo.persistenceStatus = PersistenceStatus.InSync;
    this._todos.unshift(todo);
    return todo;
  }

  public async remove(uuid: string): Promise<Todo[]> {
    await delay(TodoRepositoryFake.FAKE_DELAY_MS);
    const index = this._todos.findIndex((todo) => todo.uuid === uuid);

    if (index !== -1) {
      this._todos.splice(index, 1);
    }

    return [...this._todos];
  }

  public async persist(todo: Todo): Promise<boolean> {
    todo.title = todo.title.trim();

    if (todo.persistenceStatus === PersistenceStatus.IsNew) {
      await this.create(todo);
      return true;
    }

    return this.update(todo);
  }

  public async update(todo: Todo): Promise<boolean> {
    await delay(TodoRepositoryFake.FAKE_DELAY_MS);
    const index = this._todos.findIndex((t) => t.uuid === todo.uuid);

    if (index === -1) {
      return false;
    }

    todo.persistenceStatus = PersistenceStatus.InSync;
    this._todos[index] = todo;
    return true;
  }

  private static readonly FAKE_DELAY_MS: number = 100;
}
