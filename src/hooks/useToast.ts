"use client";

import { useRef, useState } from "react";
import { TOAST_DURATION_MS } from "@/constants/app";

export type ToastType = "success" | "info" | "error";

export interface Toast {
  readonly id: number;
  readonly type: ToastType;
  readonly msg: string;
}

let toastCounter = 0;

export interface UseToastReturn {
  toasts: readonly Toast[];
  show: (type: ToastType, msg: string) => void;
  dismiss: (id: number) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  function dismiss(id: number): void {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }

  function show(type: ToastType, msg: string): void {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, msg }]);
    const timer = setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    timers.current.set(id, timer);
  }

  return { toasts, show, dismiss };
}
