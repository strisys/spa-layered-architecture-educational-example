import { QueryClient } from "@tanstack/query-core";
import { PersistenceStatus, Todo } from "@todo/model";
import { queryClient } from "../shared/queryClient";
import type { ITodoRepository } from "./ITodoRepository";
import { todoKeys } from "./todoKeys";

export class TodoRepository implements ITodoRepository {
  private _queryClient: QueryClient;

  public constructor(client: QueryClient = queryClient) {
    this._queryClient = client;
  }

  public async getAll(): Promise<Todo[]> {
    return this._queryClient.ensureQueryData({
      queryKey: todoKeys.list(),
      queryFn: (): Promise<Todo[]> => this.fetchAll(),
    });
  }

  public async getByUuid(uuid: string): Promise<Todo | undefined> {
    return this._queryClient.ensureQueryData({
      queryKey: todoKeys.detail(uuid),
      queryFn: (): Promise<Todo | undefined> => this.fetchByUuid(uuid),
    });
  }

  public async create(todo: Todo): Promise<Todo> {
    const created = await this.postCreate(todo);
    await this._queryClient.invalidateQueries({ queryKey: todoKeys.all });
    return created;
  }

  public async remove(uuid: string): Promise<Todo[]> {
    await this.deleteByUuid(uuid);
    await this._queryClient.invalidateQueries({ queryKey: todoKeys.all });
    return this.getAll();
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
    const result = await this.putUpdate(todo);
    await this._queryClient.invalidateQueries({ queryKey: todoKeys.all });
    return result;
  }

  private fetchAll(): Promise<Todo[]> {
    throw new Error("TodoRepository.fetchAll: not implemented");
  }

  private fetchByUuid(_uuid: string): Promise<Todo | undefined> {
    throw new Error("TodoRepository.fetchByUuid: not implemented");
  }

  private postCreate(_todo: Todo): Promise<Todo> {
    throw new Error("TodoRepository.postCreate: not implemented");
  }

  private deleteByUuid(_uuid: string): Promise<void> {
    throw new Error("TodoRepository.deleteByUuid: not implemented");
  }

  private putUpdate(_todo: Todo): Promise<boolean> {
    throw new Error("TodoRepository.putUpdate: not implemented");
  }
}
