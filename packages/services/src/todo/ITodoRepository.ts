import type { Todo } from "@todo/model";

export interface ITodoRepository {
  getAll(): Promise<Todo[]>;
  getByUuid(uuid: string): Promise<Todo | undefined>;
  create(todo: Todo): Promise<Todo>;
  remove(uuid: string): Promise<Todo[]>;
  persist(todo: Todo): Promise<boolean>;
  update(todo: Todo): Promise<boolean>;
}
