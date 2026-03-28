import { describe, it, expect } from "vitest";
import { PersistenceStatus, Todo, TodoStatus } from "../../src/index";

describe("Todo", () => {
  describe("constructor", () => {
    it("should create with defaults when no state provided", () => {
      const todo = new Todo();
      expect(todo.uuid).toBeDefined();
      expect(todo.title).toBe("");
      expect(todo.status).toBe(TodoStatus.Active);
      expect(todo.createdAt).toBeInstanceOf(Date);
      expect(todo.persistenceStatus).toBe(PersistenceStatus.IsNew);
    });

    it("should create with provided state", () => {
      const date = new Date("2025-01-01");
      const todo = new Todo({
        uuid: "test-id",
        title: "Buy milk",
        status: TodoStatus.Completed,
        createdAt: date,
      });
      expect(todo.uuid).toBe("test-id");
      expect(todo.title).toBe("Buy milk");
      expect(todo.status).toBe(TodoStatus.Completed);
      expect(todo.createdAt).toEqual(date);
    });

    it("should create with partial state", () => {
      const todo = new Todo({ title: "Walk dog" });
      expect(todo.uuid).toBeDefined();
      expect(todo.title).toBe("Walk dog");
      expect(todo.status).toBe(TodoStatus.Active);
    });
  });

  describe("setters", () => {
    it("should set title", () => {
      const todo = new Todo({ title: "Original" });
      todo.title = "Updated";
      expect(todo.title).toBe("Updated");
    });

    it("should set status", () => {
      const todo = new Todo({ title: "Test" });
      todo.status = TodoStatus.Completed;
      expect(todo.status).toBe(TodoStatus.Completed);
    });
  });

  describe("state", () => {
    it("should return a shallow copy", () => {
      const todo = new Todo({ title: "Test" });
      const state = todo.state;
      state.title = "Modified";
      expect(todo.title).toBe("Test");
    });
  });

  describe("toggle", () => {
    it("should toggle from active to completed", () => {
      const todo = new Todo({ title: "Test" });
      todo.toggle();
      expect(todo.status).toBe(TodoStatus.Completed);
    });

    it("should toggle from completed to active", () => {
      const todo = new Todo({ title: "Test", status: TodoStatus.Completed });
      todo.toggle();
      expect(todo.status).toBe(TodoStatus.Active);
    });
  });

  describe("toString", () => {
    it("should return a readable string", () => {
      const todo = new Todo({ uuid: "abc", title: "Test" });
      expect(todo.toString()).toBe("Todo(abc): Test [active]");
    });
  });

  describe("toJson", () => {
    it("should return valid JSON with all state properties", () => {
      const todo = new Todo({ uuid: "abc", title: "Test" });
      const parsed = JSON.parse(todo.toJson());
      expect(parsed.uuid).toBe("abc");
      expect(parsed.title).toBe("Test");
      expect(parsed.status).toBe("active");
      expect(parsed.createdAt).toBeDefined();
    });
  });

  describe("emptyState", () => {
    it("should return defaults without uuid", () => {
      const empty = Todo.emptyState();
      expect(empty).not.toHaveProperty("uuid");
      expect(empty.title).toBe("");
      expect(empty.status).toBe(TodoStatus.Active);
      expect(empty.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("newState", () => {
    it("should return a full state with a generated uuid", () => {
      const state = Todo.newState();
      expect(state.uuid).toBeDefined();
      expect(state.title).toBe("");
      expect(state.status).toBe(TodoStatus.Active);
      expect(state.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("brokenRules", () => {
    it("should return a broken rule when title is empty", () => {
      const todo = new Todo();
      expect(todo.brokenRules).toHaveLength(1);
      expect(todo.brokenRules[0].name).toBe("title");
      expect(todo.brokenRules[0].description).toBe("Title is required");
      expect(todo.isValid).toBe(false);
    });

    it("should return a broken rule when title is whitespace", () => {
      const todo = new Todo({ title: "   " });
      expect(todo.brokenRules).toHaveLength(1);
      expect(todo.isValid).toBe(false);
    });

    it("should return no broken rules when title is set", () => {
      const todo = new Todo({ title: "Buy milk" });
      expect(todo.brokenRules).toHaveLength(0);
      expect(todo.isValid).toBe(true);
    });

    it("should update when title changes", () => {
      const todo = new Todo({ title: "Buy milk" });
      expect(todo.isValid).toBe(true);

      todo.title = "";
      expect(todo.isValid).toBe(false);

      todo.title = "Walk dog";
      expect(todo.isValid).toBe(true);
    });
  });

  describe("isDirty", () => {
    it("should not be dirty when created", () => {
      const todo = new Todo({ title: "Test" });
      expect(todo.isDirty).toBe(false);
    });

    it("should be dirty after setting title", () => {
      const todo = new Todo({ title: "Test" });
      todo.title = "Changed";
      expect(todo.isDirty).toBe(true);
    });

    it("should be dirty after setting status", () => {
      const todo = new Todo({ title: "Test" });
      todo.status = TodoStatus.Completed;
      expect(todo.isDirty).toBe(true);
    });

    it("should be dirty after toggle", () => {
      const todo = new Todo({ title: "Test" });
      todo.toggle();
      expect(todo.isDirty).toBe(true);
    });

    it("should reset when persistenceStatus is set to inSync", () => {
      const todo = new Todo({ title: "Test" });
      todo.title = "Changed";
      expect(todo.isDirty).toBe(true);

      todo.persistenceStatus = PersistenceStatus.InSync;
      expect(todo.isDirty).toBe(false);
    });
  });

  describe("parse", () => {
    it("should validate and return full state", () => {
      const state = Todo.parse({ uuid: "abc", title: "Parsed", status: TodoStatus.Active, createdAt: new Date() });
      expect(state.uuid).toBe("abc");
      expect(state.title).toBe("Parsed");
      expect(state.status).toBe(TodoStatus.Active);
    });
  });
});
