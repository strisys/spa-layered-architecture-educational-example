import { Todo } from "@todo/model";
export { Todo } from "@todo/model";
import { RepositoryRegistry } from "@todo/services";

export class TodoViewModel {
  private _notify: () => void;

  private _todos: Todo[] = [];
  private _editingTodo: Todo | null = null;
  private _error: string | null = null;
  private _isLoading: boolean = true;

  constructor(notify: () => void) {
    this._notify = notify;
  }

  public async init(): Promise<void> {
    this._isLoading = true;
    this._notify();

    try {
      this._todos = await this.repository.getAll();
    } catch (error) {
      this._error = this.toErrorMessage("Failed to load todos.", error);
    }

    this._isLoading = false;
    this._notify();
  }

  public get todos(): Todo[] {
    return this._todos;
  }

  public get editingTodo(): Todo | null {
    return this._editingTodo;
  }

  public get error(): string | null {
    return this._error;
  }

  public get isLoading(): boolean {
    return this._isLoading;
  }

  public isEditing(todo: Todo): boolean {
    return this._editingTodo?.uuid === todo.uuid;
  }

  public create(): void {
    const todo = new Todo();
    todo.observeChange(this._notify);
    this._todos = [todo, ...this._todos];
    this._editingTodo = todo;
    this._notify();
  }

  public async remove(uuid: string): Promise<void> {
    this._isLoading = true;
    this._notify();

    try {
      this._todos = await this.repository.remove(uuid);
    } catch (error) {
      this._error = this.toErrorMessage("Failed to remove todo.", error);
    }

    this._isLoading = false;
    this._notify();
  }

  public async toggle(uuid: string): Promise<void> {
    const todo = this._todos.find((t) => t.uuid === uuid);

    if (!todo) {
      return;
    }

    this._isLoading = true;
    this._notify();

    try {
      todo.toggle();
      await this.repository.update(todo);
      await this.refresh(false);
    } catch (error) {
      todo.toggle();
      this._error = this.toErrorMessage("Failed to update todo.", error);
    }

    this._isLoading = false;
    this._notify();
  }

  public startEditing(todo: Todo): void {
    this._editingTodo = todo.clone();
    this._editingTodo.observeChange(this._notify);
    this._notify();
  }

  public async cancelEditing(): Promise<void> {
    this._editingTodo = null;
    await this.refresh(true);
  }

  public async submitEditing(): Promise<void> {
    if (!this._editingTodo) {
      return;
    }

    if (!this._editingTodo.isValid) {
      await this.cancelEditing();
      return;
    }

    this._isLoading = true;
    this._notify();

    try {
      await this.repository.persist(this._editingTodo);

      this._editingTodo = null;
      await this.refresh(false);
    } catch (error) {
      this._error = this.toErrorMessage("Failed to save todo.", error);
    }

    this._isLoading = false;
    this._notify();
  }

  private get repository() {
    this._error = null;
    return RepositoryRegistry.current().todos;
  }

  private toErrorMessage(prefix: string, error: unknown): string {
    if (error instanceof Error) {
      return `${prefix} ${error.message}`;
    }

    return `${prefix} ${String(error)}`;
  }

  private async refresh(notify: boolean): Promise<void> {
    this._todos = await this.repository.getAll();

    if (notify) {
      this._notify();
    }
  }
}
