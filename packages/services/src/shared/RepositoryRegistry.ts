import { TodoRepository } from "../todo/TodoRepository";

export class RepositoryRegistry {
  private static _current: RepositoryRegistry = new RepositoryRegistry();

  private _todos: TodoRepository = new TodoRepository();

  // TODO: When isTesting is true, return a registry wired with fake repositories
  public static current(isTesting: boolean = false): RepositoryRegistry {
    return RepositoryRegistry._current;
  }

  public get todos(): TodoRepository {
    return this._todos;
  }
}
