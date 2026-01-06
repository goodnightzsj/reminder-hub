"use client";

import { Input } from "../Input";
import { Button } from "../Button";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import {
    createSubtask,
    deleteSubtask,
    toggleSubtask,
} from "../../_actions/todos";

type SubtaskListProps = {
    todoId: string;
    subtasks: {
        id: string;
        title: string;
        isDone: boolean;
    }[];
};

export function SubtaskList({ todoId, subtasks }: SubtaskListProps) {
    const subtaskDoneCount = subtasks.filter((s) => s.isDone).length;

    return (
        <section className="rounded-xl border border-default bg-elevated p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-medium">子任务</h2>
                    <p className="mt-1 text-xs text-muted">
                        {subtasks.length === 0
                            ? "用于拆分可执行的小步骤。"
                            : `完成进度：${subtaskDoneCount}/${subtasks.length}`}
                    </p>
                </div>
            </div>

            <form action={createSubtask} className="mt-4 flex gap-2">
                <input type="hidden" name="todoId" value={todoId} />
                <Input
                    name="title"
                    placeholder="添加子任务..."
                    className="h-9 text-xs"
                    required
                    autoComplete="off"
                />
                <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className="h-9 shrink-0"
                >
                    添加
                </Button>
            </form>

            <ul className="mt-4 divide-y divide-divider rounded-lg border border-divider">
                {subtasks.length === 0 ? (
                    <li className="p-3 text-sm text-muted">暂无子任务。</li>
                ) : (
                    subtasks.map((s, index) => (
                        <li
                            key={s.id}
                            className={`group flex items-center gap-3 p-3 animate-slide-up stagger-${Math.min(index + 1, 5)}`}
                        >
                            <form action={toggleSubtask} className="flex items-center">
                                <input type="hidden" name="id" value={s.id} />
                                <input type="hidden" name="todoId" value={todoId} />
                                <label className="flex items-center p-2 -m-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isDone"
                                        value={s.isDone ? "0" : "1"}
                                        checked={s.isDone}
                                        onChange={(e) => e.target.form?.requestSubmit()}
                                        className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 transition-all active:scale-95"
                                    />
                                </label>
                            </form>

                            <span
                                className={[
                                    "flex-1 text-sm transition-colors",
                                    s.isDone
                                        ? "text-muted line-through"
                                        : "text-primary",
                                ].join(" ")}
                            >
                                {s.title}
                            </span>

                            <form
                                action={deleteSubtask}
                                className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                            >
                                <input type="hidden" name="id" value={s.id} />
                                <input type="hidden" name="todoId" value={todoId} />
                                <ConfirmSubmitButton
                                    confirmMessage="确定删除这个子任务吗？"
                                    className="h-9 rounded-lg border border-default px-3 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                    删除
                                </ConfirmSubmitButton>
                            </form>
                        </li>
                    ))
                )}
            </ul>
        </section>
    );
}
