"use server";

import {
  createTodo as createTodoImpl,
  deleteTodo as deleteTodoImpl,
  restoreTodo as restoreTodoImpl,
  setTodoArchived as setTodoArchivedImpl,
  toggleTodo as toggleTodoImpl,
  updateTodo as updateTodoImpl,
} from "./todos.actions";
import {
  createSubtask as createSubtaskImpl,
  deleteSubtask as deleteSubtaskImpl,
  toggleSubtask as toggleSubtaskImpl,
  updateSubtask as updateSubtaskImpl,
} from "./todos.subtasks";
import {
  moveTodoDown as moveTodoDownImpl,
  moveTodoUp as moveTodoUpImpl,
  reorderTodos as reorderTodosImpl,
} from "./todos.ordering";

export async function createTodo(formData: FormData) {
  return createTodoImpl(formData);
}

export async function toggleTodo(formData: FormData) {
  return toggleTodoImpl(formData);
}

export async function deleteTodo(formData: FormData) {
  return deleteTodoImpl(formData);
}

export async function restoreTodo(formData: FormData) {
  return restoreTodoImpl(formData);
}

export async function updateTodo(formData: FormData) {
  return updateTodoImpl(formData);
}

export async function setTodoArchived(formData: FormData) {
  return setTodoArchivedImpl(formData);
}

export async function createSubtask(formData: FormData) {
  return createSubtaskImpl(formData);
}

export async function toggleSubtask(formData: FormData) {
  return toggleSubtaskImpl(formData);
}

export async function deleteSubtask(formData: FormData) {
  return deleteSubtaskImpl(formData);
}

export async function updateSubtask(formData: FormData) {
  return updateSubtaskImpl(formData);
}

export async function reorderTodos(ids: string[]) {
  return reorderTodosImpl(ids);
}

export async function moveTodoUp(id: string) {
  return moveTodoUpImpl(id);
}

export async function moveTodoDown(id: string) {
  return moveTodoDownImpl(id);
}
