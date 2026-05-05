import { TodoRepository } from "../todo/TodoRepository";
import { TodoRepositoryFake } from "../todo/TodoRepositoryFake";
import type { ITodoRepository } from "../todo/ITodoRepository";

export class RepositoryRegistry {
  private _todos: ITodoRepository;

  public constructor(isTesting: boolean = true) {
    this._todos = isTesting ? new TodoRepositoryFake() : new TodoRepository();
  }

  public get todos(): ITodoRepository {
    return this._todos;
  }

  public static current(isTesting: boolean = true): RepositoryRegistry {
    if (isTesting) {
      RepositoryRegistry._fake ??= new RepositoryRegistry(true);
      return RepositoryRegistry._fake;
    }

    RepositoryRegistry._real ??= new RepositoryRegistry(false);
    return RepositoryRegistry._real;
  }

  private static _fake: RepositoryRegistry | null = null;
  private static _real: RepositoryRegistry | null = null;
}
