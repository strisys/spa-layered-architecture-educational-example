export { generateUuid } from "@todo/shared";
import { z } from "zod/v4";
export { z } from "zod/v4";

export function parseSchema<TState>(schema: z.ZodType<TState>, data: unknown): TState {
  return schema.parse(data);
}

export interface IBrokenRule {
  name: string;
  description: string;
}

export class BrokenRule implements IBrokenRule {
  private _name: string;
  private _description: string;

  constructor(name: string, description: string) {
    this._name = name;
    this._description = description;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string {
    return this._description;
  }
}

export const PersistenceStatus = {
  IsNew: "isNew",
  InSync: "inSync",
  IsDeleted: "isDeleted",
} as const;

export type PersistenceStatus = (typeof PersistenceStatus)[keyof typeof PersistenceStatus];

export interface IEntityState {
  uuid: string;
}

export interface IEntityBase<TState extends IEntityState> {
  get uuid(): string;
  get state(): TState;
  get brokenRules(): IBrokenRule[];
  get isValid(): boolean;
  get isDirty(): boolean;
  get version(): number;
  get persistenceStatus(): PersistenceStatus;
  observeChange(callback: () => void): void;
  toString(): string;
  toJson(): string;
}

export abstract class EntityBase<TState extends IEntityState> implements IEntityBase<TState> {
  protected abstract _state: TState;
  private _persistenceStatus: PersistenceStatus = PersistenceStatus.IsNew;
  private _version: number = 0;
  private _onChange: (() => void) | null = null;

  public get uuid(): string {
    return this._state.uuid;
  }

  public get state(): TState {
    return { ...this._state };
  }

  public abstract get brokenRules(): IBrokenRule[];

  public get isValid(): boolean {
    return (this.brokenRules.length === 0);
  }

  protected validateSchema(schema: z.ZodType<TState>): IBrokenRule[] {
    const result = schema.safeParse(this._state);

    if (result.success) {
      return [];
    }

    return result.error.issues.map((issue) => {
      return new BrokenRule(String(issue.path[0] ?? "unknown"), issue.message);
    });
  }

  public get isDirty(): boolean {
    return this._version > 0;
  }

  public get version(): number {
    return this._version;
  }

  public get persistenceStatus(): PersistenceStatus {
    return this._persistenceStatus;
  }

  public set persistenceStatus(value: PersistenceStatus) {
    this._persistenceStatus = value;

    if (value === PersistenceStatus.InSync) {
      this._version = 0;
      this._onChange = null;
    }
  }

  public observeChange(callback: () => void): void {
    this._onChange = callback;
  }

  protected notify(): void {
    this._version++;
    this._onChange?.();
  }

  public toString(): string {
    return this.toJson();
  }

  public toJson(): string {
    return JSON.stringify(this._state);
  }
}
