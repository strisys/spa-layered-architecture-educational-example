import { EntityBase, generateUuid, parseSchema, z } from "../shared/EntityBase";
import type { IBrokenRule, IEntityState } from "../shared/EntityBase";

export const TodoStatus = {
  Active: "active",
  Completed: "completed",
} as const;

export type TodoStatus = (typeof TodoStatus)[keyof typeof TodoStatus];

export const TodoStateSchema = z.object({
  uuid: z.string(),
  title: z.string(),
  status: z.enum(["active", "completed"]),
  createdAt: z.date(),
});

export interface ITodoState extends IEntityState, z.infer<typeof TodoStateSchema> {}

export const TodoValidationSchema = z.object({
  uuid: z.string(),
  title: z.string().check(
    z.refine((val) => val.trim().length > 0, { message: "Title is required" })
  ),
  status: z.enum(["active", "completed"]),
  createdAt: z.date(),
});

export class Todo extends EntityBase<ITodoState> {
  protected _state: ITodoState;

  constructor(state: Partial<ITodoState> = {}) {
    super();
    this._state = Todo.parse({ ...Todo.newState(), ...state });
  }

  public get title(): string {
    return this._state.title;
  }

  public set title(value: string) {
    this._state.title = value;
    this.notify();
  }

  public get status(): TodoStatus {
    return this._state.status;
  }

  public set status(value: TodoStatus) {
    this._state.status = value;
    this.notify();
  }

  public get brokenRules(): IBrokenRule[] {
    return this.validateSchema(TodoValidationSchema);
  }

  public get isCompleted(): boolean {
    return this._state.status === TodoStatus.Completed;
  }

  public get createdAt(): Date {
    return this._state.createdAt;
  }

  public override toString(): string {
    return `Todo(${this._state.uuid}): ${this._state.title} [${this._state.status}]`;
  }

  public clone(): Todo {
    const clone = new Todo({ ...this._state });
    clone.persistenceStatus = this.persistenceStatus;
    return clone;
  }

  public toggle(): void {
    const isActive = (this._state.status === TodoStatus.Active);
    this.status = ((isActive) ? TodoStatus.Completed: TodoStatus.Active);
  }

  static emptyState(): Omit<ITodoState, "uuid"> {
    return {
      title: "",
      status: TodoStatus.Active,
      createdAt: new Date(),
    };
  }

  static newState(): ITodoState {
    return {
      uuid: generateUuid(),
      ...Todo.emptyState(),
    };
  }

  static parse(state: ITodoState): ITodoState {
    return parseSchema(TodoStateSchema, state);
  }
}
