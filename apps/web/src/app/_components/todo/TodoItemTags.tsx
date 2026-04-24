type TodoItemTagsProps = {
    todoId: string;
    tags: string[];
};

export function TodoItemTags({ todoId, tags }: TodoItemTagsProps) {
    if (tags.length === 0) return null;

    return (
        <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
                <span
                    key={`${todoId}:${t}`}
                    title={`#${t}`}
                    className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-secondary border border-border/50 max-w-[10rem] truncate"
                >
                    #{t}
                </span>
            ))}
        </div>
    );
}

