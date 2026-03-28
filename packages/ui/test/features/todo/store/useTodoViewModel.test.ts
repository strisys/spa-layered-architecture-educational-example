// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { UseBoundStore, StoreApi } from "zustand";
import type { ITodoViewModelStore } from "../../../../src/features/todo/store/useTodoViewModel";

/**
 * Each test needs a fresh Zustand store (the production module creates a singleton).
 * We dynamically re-import the module with a cache-busting query so Vite treats it
 * as a new module each time.
 */
let useTodoViewModel: UseBoundStore<StoreApi<ITodoViewModelStore>>;
let importCounter = 0;

beforeEach(async () => {
  importCounter++;
  const mod = await import(
    `../../../../src/features/todo/store/useTodoViewModel?t=${importCounter}`
  );
  useTodoViewModel = mod.useTodoViewModel;
});

describe("useTodoViewModel", () => {
  it("should initialise with a ViewModel instance and begin loading", () => {
    const { result } = renderHook(() => useTodoViewModel());

    // version may already be ≥1 because queueMicrotask fires vm.init() synchronously
    // within the microtask queue before renderHook returns
    expect(result.current.version).toBeGreaterThanOrEqual(0);
    expect(result.current.vm).toBeDefined();
    expect(typeof result.current.vm.init).toBe("function");
  });

  it("should load todos via queueMicrotask on creation", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    // queueMicrotask + async repository delay — flush both
    await act(async () => {
      // Allow the microtask (vm.init()) and its internal awaits to resolve
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.vm.todos.length).toBeGreaterThan(0);
    expect(result.current.vm.isLoading).toBe(false);
  });

  it("should increment version when init completes", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // init calls notify at least twice (loading start + loading end)
    expect(result.current.version).toBeGreaterThanOrEqual(2);
  });

  it("should increment version when create is called", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    const versionBefore = result.current.version;

    act(() => {
      result.current.vm.create();
    });

    expect(result.current.version).toBeGreaterThan(versionBefore);
  });

  it("should increment version when remove is called", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    const versionBefore = result.current.version;
    const uuid = result.current.vm.todos[0].uuid;

    await act(async () => {
      await result.current.vm.remove(uuid);
    });

    expect(result.current.version).toBeGreaterThan(versionBefore);
  });

  it("should increment version when toggle is called", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    const versionBefore = result.current.version;
    const uuid = result.current.vm.todos[0].uuid;

    await act(async () => {
      await result.current.vm.toggle(uuid);
    });

    expect(result.current.version).toBeGreaterThan(versionBefore);
  });

  it("should increment version when startEditing is called", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    const versionBefore = result.current.version;

    act(() => {
      result.current.vm.startEditing(result.current.vm.todos[0]);
    });

    expect(result.current.version).toBeGreaterThan(versionBefore);
  });

  it("should increment version when submitEditing is called", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    act(() => {
      result.current.vm.startEditing(result.current.vm.todos[0]);
    });

    result.current.vm.editingTodo!.title = "Updated via hook test";
    const versionBefore = result.current.version;

    await act(async () => {
      await result.current.vm.submitEditing();
    });

    expect(result.current.version).toBeGreaterThan(versionBefore);
  });

  it("should increment version when cancelEditing is called", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    act(() => {
      result.current.vm.startEditing(result.current.vm.todos[0]);
    });

    const versionBefore = result.current.version;

    await act(async () => {
      await result.current.vm.cancelEditing();
    });

    expect(result.current.version).toBeGreaterThan(versionBefore);
  });

  it("should keep the same vm reference across version bumps", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    const vmBefore = result.current.vm;

    act(() => {
      result.current.vm.create();
    });

    expect(result.current.vm).toBe(vmBefore);
  });

  it("should increment version when editing todo title changes", async () => {
    const { result } = renderHook(() => useTodoViewModel());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    act(() => {
      result.current.vm.startEditing(result.current.vm.todos[0]);
    });

    const versionBefore = result.current.version;

    act(() => {
      result.current.vm.editingTodo!.title = "Changed title";
    });

    expect(result.current.version).toBeGreaterThan(versionBefore);
  });
});
