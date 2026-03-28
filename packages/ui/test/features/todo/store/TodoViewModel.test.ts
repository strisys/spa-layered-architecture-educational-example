import { describe, it, expect, beforeEach } from "vitest";
import { TodoStatus } from "@todo/model";
import { TodoViewModel } from "../../../../src/features/todo/store/TodoViewModel";

describe("TodoViewModel", () => {
  let vm: TodoViewModel;
  let notifyCount: number;

  beforeEach(() => {
    notifyCount = 0;
    vm = new TodoViewModel(() => { notifyCount++; });
  });

  describe("init", () => {
    it("should load todos from the repository", async () => {
      await vm.init();
      expect(vm.todos.length).toBeGreaterThan(0);
    });

    it("should set isLoading to true then false", async () => {
      const promise = vm.init();
      expect(vm.isLoading).toBe(true);

      await promise;
      expect(vm.isLoading).toBe(false);
    });

    it("should notify during and after loading", async () => {
      notifyCount = 0;
      await vm.init();
      expect(notifyCount).toBeGreaterThanOrEqual(2);
    });

    it("should have no error after successful init", async () => {
      await vm.init();
      expect(vm.error).toBeNull();
    });
  });

  describe("create", () => {
    beforeEach(async () => {
      await vm.init();
    });

    it("should add a new todo to the list", () => {
      const initialCount = vm.todos.length;
      vm.create();
      expect(vm.todos.length).toBe(initialCount + 1);
    });

    it("should place the new todo at the top of the list", () => {
      vm.create();
      expect(vm.todos[0].title).toBe("");
    });

    it("should start editing the new todo", () => {
      vm.create();
      expect(vm.editingTodo).not.toBeNull();
      expect(vm.editingTodo!.uuid).toBe(vm.todos[0].uuid);
    });

    it("should persist after editing and submitting", async () => {
      const initialCount = vm.todos.length;
      vm.create();
      vm.editingTodo!.title = "New todo";
      await vm.submitEditing();
      expect(vm.todos.length).toBe(initialCount + 1);
      expect(vm.todos.find((t) => t.title === "New todo")).toBeDefined();
    });

    it("should discard if submitted with empty title", async () => {
      const initialCount = vm.todos.length;
      vm.create();
      await vm.submitEditing();
      expect(vm.todos.length).toBe(initialCount);
    });

    it("should discard if editing is cancelled", async () => {
      const initialCount = vm.todos.length;
      vm.create();
      await vm.cancelEditing();
      expect(vm.todos.length).toBe(initialCount);
      expect(vm.editingTodo).toBeNull();
    });
  });

  describe("remove", () => {
    beforeEach(async () => {
      await vm.init();
    });

    it("should remove a todo by uuid", async () => {
      const initialCount = vm.todos.length;
      const uuid = vm.todos[0].uuid;
      await vm.remove(uuid);
      expect(vm.todos.length).toBe(initialCount - 1);
      expect(vm.todos.find((t) => t.uuid === uuid)).toBeUndefined();
    });
  });

  describe("toggle", () => {
    beforeEach(async () => {
      await vm.init();
    });

    it("should toggle a todo's status", async () => {
      const todo = vm.todos.find((t) => t.status === TodoStatus.Active)!;
      await vm.toggle(todo.uuid);
      const toggled = vm.todos.find((t) => t.uuid === todo.uuid)!;
      expect(toggled.status).toBe(TodoStatus.Completed);
    });

    it("should do nothing for unknown uuid", async () => {
      const initialCount = vm.todos.length;
      await vm.toggle("nonexistent");
      expect(vm.todos.length).toBe(initialCount);
    });
  });

  describe("editing", () => {
    beforeEach(async () => {
      await vm.init();
    });

    it("should start editing with a cloned todo", () => {
      const todo = vm.todos[0];
      vm.startEditing(todo);
      expect(vm.editingTodo).not.toBeNull();
      expect(vm.editingTodo!.uuid).toBe(todo.uuid);
      expect(vm.editingTodo).not.toBe(todo);
    });

    it("should report isEditing correctly", () => {
      const todo = vm.todos[0];
      const other = vm.todos[1];
      vm.startEditing(todo);
      expect(vm.isEditing(todo)).toBe(true);
      expect(vm.isEditing(other)).toBe(false);
    });

    it("should update the editing todo title", () => {
      vm.startEditing(vm.todos[0]);
      vm.editingTodo!.title = "Updated title";
      expect(vm.editingTodo!.title).toBe("Updated title");
    });

    it("should cancel editing without affecting the original", () => {
      const todo = vm.todos[0];
      const originalTitle = todo.title;
      vm.startEditing(todo);
      vm.editingTodo!.title = "Changed";
      vm.cancelEditing();
      expect(vm.editingTodo).toBeNull();
      expect(vm.todos.find((t) => t.uuid === todo.uuid)!.title).toBe(originalTitle);
    });

    it("should submit editing and persist the change", async () => {
      const todo = vm.todos[0];
      vm.startEditing(todo);
      vm.editingTodo!.title = "New title";
      await vm.submitEditing();

      expect(vm.editingTodo).toBeNull();
      const updated = vm.todos.find((t) => t.uuid === todo.uuid)!;
      expect(updated.title).toBe("New title");
    });

    it("should trim title on submit", async () => {
      const todo = vm.todos[0];
      vm.startEditing(todo);
      vm.editingTodo!.title = "  Trimmed  ";
      await vm.submitEditing();

      const updated = vm.todos.find((t) => t.uuid === todo.uuid)!;
      expect(updated.title).toBe("Trimmed");
    });

    it("should not persist empty title on submit", async () => {
      const todo = vm.todos[0];
      const originalTitle = todo.title;
      vm.startEditing(todo);
      vm.editingTodo!.title = "   ";
      await vm.submitEditing();

      const updated = vm.todos.find((t) => t.uuid === todo.uuid)!;
      expect(updated.title).toBe(originalTitle);
    });
  });

  describe("error handling", () => {
    beforeEach(async () => {
      await vm.init();
    });

    it("should clear error on next repository access", async () => {
      await vm.remove(vm.todos[0].uuid);
      expect(vm.error).toBeNull();
    });

    it("should clear previous error when starting a new operation", async () => {
      await vm.remove(vm.todos[0].uuid);
      expect(vm.error).toBeNull();

      await vm.remove(vm.todos[0].uuid);
      expect(vm.error).toBeNull();
    });
  });
});
