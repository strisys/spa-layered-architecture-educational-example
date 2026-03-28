import { describe, it, expect, beforeEach } from "vitest";
import { Todo, TodoStatus } from "@todo/model";
import { RepositoryRegistry } from "../../src/index";

describe("TodoRepository", () => {
  let registry: RepositoryRegistry;

  beforeEach(() => {
    registry = new RepositoryRegistry();
  });

  describe("getAll", () => {
    it("should return 10 default todos", async () => {
      const todos = await registry.todos.getAll();
      expect(todos).toHaveLength(10);
    });

    it("should return a copy of the list", async () => {
      const todos = await registry.todos.getAll();
      todos.pop();
      expect(await registry.todos.getAll()).toHaveLength(10);
    });
  });

  describe("getByUuid", () => {
    it("should return a todo by uuid", async () => {
      const todos = await registry.todos.getAll();
      const found = await registry.todos.getByUuid(todos[0].uuid);
      expect(found).toBeDefined();
      expect(found!.uuid).toBe(todos[0].uuid);
    });

    it("should return undefined for unknown uuid", async () => {
      expect(await registry.todos.getByUuid("nonexistent")).toBeUndefined();
    });
  });

  describe("create", () => {
    it("should create and add a new todo", async () => {
      const todo = new Todo({ title: "New task" });
      const created = await registry.todos.create(todo);
      expect(created.title).toBe("New task");
      expect(created.status).toBe(TodoStatus.Active);
      expect(await registry.todos.getAll()).toHaveLength(11);
    });
  });

  describe("remove", () => {
    it("should remove a todo by uuid", async () => {
      const todos = await registry.todos.getAll();
      const remaining = await registry.todos.remove(todos[0].uuid);
      expect(remaining).toHaveLength(9);
      expect(remaining.find((t) => t.uuid === todos[0].uuid)).toBeUndefined();
    });

    it("should return all todos for unknown uuid", async () => {
      const remaining = await registry.todos.remove("nonexistent");
      expect(remaining).toHaveLength(10);
    });
  });

  describe("update", () => {
    it("should update an existing todo", async () => {
      const todos = await registry.todos.getAll();
      const todo = todos[0];
      todo.title = "Updated title";
      const result = await registry.todos.update(todo);
      expect(result).toBe(true);
      expect((await registry.todos.getByUuid(todo.uuid))!.title).toBe("Updated title");
    });

    it("should return false for unknown todo", async () => {
      const todo = new Todo({ title: "Unknown" });
      expect(await registry.todos.update(todo)).toBe(false);
    });
  });

});
