import { conflict } from "@/lib/errors";
import type { TaskStatus } from "@/lib/validators";

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

export function canTransitionStatus(from: TaskStatus, to: TaskStatus): boolean {
  return from === to || allowedTransitions[from].includes(to);
}

export function assertStatusTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransitionStatus(from, to)) {
    throw conflict(`Task status cannot transition from ${from} to ${to}.`, "status");
  }
}
