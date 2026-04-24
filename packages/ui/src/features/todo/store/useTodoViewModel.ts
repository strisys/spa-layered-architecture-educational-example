import { create } from "zustand";
import type { UseBoundStore, StoreApi } from "zustand";
import { TodoViewModel } from "./TodoViewModel";

export interface ITodoViewModelStore {
  vm: TodoViewModel;
  version: number;
}

const incrementVersion = (state: ITodoViewModelStore): Partial<ITodoViewModelStore> => {
  return { version: state.version + 1 };
};

export const useTodoViewModel: UseBoundStore<StoreApi<ITodoViewModelStore>> = create<ITodoViewModelStore>((set) => {
  const notify = () => {
    set(incrementVersion);
  };

  const vm = new TodoViewModel(notify);

  return { vm, version: 0 };
});
