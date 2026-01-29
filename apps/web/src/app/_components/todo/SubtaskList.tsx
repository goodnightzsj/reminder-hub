"use client";

import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { Icons } from "../Icons";
import {
    createSubtask,
    deleteSubtask,
    toggleSubtask,
} from "../../_actions/todos.actions";
import { useToast } from "../ui/Toast";

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
    const progress = subtasks.length === 0 ? 0 : Math.round((subtaskDoneCount / subtasks.length) * 100);
    const { success } = useToast();

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        success("已复制到剪贴板");
    };

    return (
        <section className="group/section relative overflow-hidden rounded-3xl bg-surface/40 backdrop-blur-md transition-all">
            {/* ... existing header code ... */}
            {/* Header & Progress */}
            <div className="relative p-6 pb-2">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-base font-bold text-primary">
                        <Icons.CheckSquare className="h-5 w-5 text-brand-primary" />
                        子任务
                    </h2>
                    {subtasks.length > 0 && (
                        <span className="font-mono text-xs font-bold text-brand-primary/80">
                            {progress}%
                        </span>
                    )}
                </div>

                {/* Visual Progress Bar (Only show if there are tasks) */}
                {subtasks.length > 0 && (
                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-default/20">
                        <div
                            className="h-full rounded-full bg-brand-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* List */}
            <div className="px-3 py-2">
                <ul className="space-y-0.5">
                    {subtasks.length === 0 ? (
                        <li className="flex flex-col items-center justify-center py-6 text-center text-muted/50">
                            <span className="text-xs">暂无子任务</span>
                        </li>
                    ) : (
                        subtasks.map((s, index) => (
                            <li
                                key={s.id}
                                className={`group/item relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50 animate-slide-up stagger-${Math.min(index + 1, 5)}`}
                            >
                                <form action={toggleSubtask} className="flex shrink-0 items-center">
                                    <input type="hidden" name="id" value={s.id} />
                                    <input type="hidden" name="todoId" value={todoId} />
                                    <label className="relative flex cursor-pointer items-center justify-center p-1">
                                        <input
                                            type="checkbox"
                                            name="isDone"
                                            value={s.isDone ? "0" : "1"}
                                            checked={s.isDone}
                                            onChange={(e) => e.target.form?.requestSubmit()}
                                            className="peer sr-only"
                                        />
                                        <div
                                            className={[
                                                "flex h-5 w-5 items-center justify-center rounded-[6px] border transition-all duration-300",
                                                s.isDone
                                                    ? "border-brand-primary bg-brand-primary text-white"
                                                    : "border-default/60 bg-transparent group-hover/item:border-brand-primary/50",
                                            ].join(" ")}
                                        >
                                            <Icons.Check
                                                className={`h-3.5 w-3.5 transition-transform duration-200 ${s.isDone ? "scale-100" : "scale-0"}`}
                                            />
                                        </div>
                                    </label>
                                </form>

                                <span
                                    onClick={() => handleCopy(s.title)}
                                    className={[
                                        "flex-1 select-none break-all text-sm transition-colors duration-200 cursor-pointer hover:text-brand-primary active:opacity-70",
                                        s.isDone
                                            ? "text-muted line-through opacity-70"
                                            : "text-primary",
                                    ].join(" ")}
                                    title="点击复制"
                                >
                                    {s.title}
                                </span>

                                <form
                                    action={deleteSubtask}
                                    className="transition-opacity duration-200"
                                >
                                    <input type="hidden" name="id" value={s.id} />
                                    <input type="hidden" name="todoId" value={todoId} />
                                    <ConfirmSubmitButton
                                        confirmMessage="删除子任务？"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                                    >
                                        <Icons.Trash className="h-4 w-4" />
                                    </ConfirmSubmitButton>
                                </form>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Chat-style Input Footer */}
            <div className="bg-muted/40 p-3">
                <form action={createSubtask} className="relative flex items-center">
                    <input type="hidden" name="todoId" value={todoId} />
                    <Input
                        name="title"
                        placeholder="添加新步骤..."
                        className="h-10 w-full rounded-xl border-none bg-elevated pl-4 pr-12 text-sm shadow-sm ring-1 ring-black/5 transition-all placeholder:text-muted-foreground/70 focus:bg-surface focus:ring-2 focus:ring-brand-primary/20 dark:bg-white/5 dark:ring-white/10"
                        required
                        autoComplete="off"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                        <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg text-brand-primary hover:bg-brand-primary/10 active:scale-95"
                        >
                            <Icons.Plus className="h-5 w-5" />
                        </Button>
                    </div>
                </form>
            </div>
        </section>
    );
}
