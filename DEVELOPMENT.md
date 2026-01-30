# 开发规范（3M / 敏捷 / 低耦合 / 质量门槛）

本文档用于约束本项目的日常开发行为：在保证交付速度的同时，避免代码质量和架构不可持续，确保后续迭代“越改越快”。

---

## 1. 核心原则：Muda / Mura / Muri（精益 3M）

### 1.1 Muda（浪费：重复、无效、返工）

**典型表现**
- 同一逻辑多处复制（如 JSON 解析、FormData 解析、日期格式化、Badge/按钮样式）
- “临时 any”长期遗留，导致后续改动需要到处猜类型
- 大量 unused/死代码，让阅读和定位成本上升

**约束**
- 同类逻辑出现第 2 次就应考虑抽取（工具函数/组件/adapter）
- 禁止新增 `any`（允许 `unknown` + 显式收敛）
- 组件/函数不要为了“快”复制粘贴，优先复用现有组件与语义化样式
- 共享类型（DTO/props shape）优先抽到 `*.types.ts`，跨模块引用用 `import type`（减少耦合与循环依赖）

### 1.2 Mura（不均：风格/抽象不一致）

**典型表现**
- 相同概念不同命名/不同数据结构（同为“提醒预览”却字段不同）
- 同类页面组件写法差异巨大（导致新人/未来的自己无法形成心智模型）

**约束**
- 新增能力必须对齐既有模式：语义化颜色、统一 UI 组件、统一 Action/Server Lib 组织方式
- 对外暴露的数据结构（props/返回值）优先稳定、可预测
- 避免在 JSX 里堆叠多层三元表达式；优先用映射表（Record）或小的纯函数收敛逻辑

### 1.3 Muri（过载：单文件/单组件/单函数过重）

**典型表现**
- 一个组件同时处理：展示 + 动效 + 数据解析 + 操作编排（认知负担高）
- 关键文件过长（阅读成本与改动风险上升）
- 高频路径上出现“并发风暴”（例如每次请求都触发一次网络同步/全量查询），导致 DB/外部 API 被过载

**软约束（建议目标）**
- 单文件尽量控制在 200~300 行以内（超过就优先拆分）
- 单函数尽量控制在 50 行以内（超过就优先拆分为纯函数/子组件）
- 对可并发调用的同步/缓存函数，优先使用 in-flight Promise lock（同一时刻只允许一次真实执行）

---

## 2. 敏捷开发：小步、可验收、可回滚

**约束**
- 每次改动尽量只引入一个关键变量（一个核心问题/一个核心能力）
- 变更必须有清晰 DoD（完成定义）与验证方式（lint/build/手动冒烟）
- 避免“一次性大重构”：优先用 adapter/纯函数抽取实现逐步迁移

---

## 3. 低耦合：分层清晰、边界明确

### 3.1 分层约定（方向性）

- `apps/web/src/server/*`：领域逻辑、DB、调度/通知、计算类纯函数
- `apps/web/src/app/_actions/*`：Server Actions（表单解析 + 权限/校验 + 调用 server 层 + revalidate/redirect）
- `apps/web/src/app/**/_lib/*`：页面/路由专用的纯函数与查询组装（让 `page.tsx` 更像“编排层”，避免堆满解析/计算/查询细节）
- `apps/web/src/app/_components/*`：UI 组件（尽量只做展示与交互）
  - 若组件包含较多“纯逻辑”（解析/格式化/计算），优先拆到同目录 `*.utils.ts`（降低 Muri，减少重复实现）
  - 若存在大量“共享 UI 片段/小组件”，可拆到 `*.shared.tsx`（降低 Muri，避免一个文件塞满所有子块）
  - 大型静态映射/配置（如 alias、预置 icon 表）优先拆到 `*.constants.ts`（避免主文件过长；保持职责单一）

### 3.2 关键约束

- Server Actions 的实现可拆分，但需遵守 Next 的约束：
  - 带 `"use server"` 的入口文件 **只能导出 async function**
  - 若要多文件组织：用一个薄的入口（`*_actions/*.ts`）导出 async wrapper，再在 `*.actions.ts / *.helpers.ts / *.subtasks.ts` 等文件中承载实现
- 所有 server-only 模块（尤其是 `apps/web/src/server/**`）建议在文件顶部添加 `import "server-only"`，防止被 `use client` 组件误引入
- UI 组件尽量不要直接依赖 DB 的存储格式细节（例如字段是 JSON 字符串）
  - 更推荐：在 server/actions 层先转换为“可直接消费”的结构（ViewModel/DTO）
- 除设置页（需要展示/编辑通知配置）外，不要把敏感配置（如通知 token / SMTP 密码）传入 `use client` 组件
  - 例如：不要直接把 `getAppSettings()` 的返回值作为 props 透传给客户端组件；优先使用 `getAppTimeSettings()` 或显式 `Pick` 出安全字段
- `server` → `app/_components` 单向依赖；UI 不反向侵入 server 实现细节
- 数据结构对齐：同类 props/返回值尽量统一字段命名与语义
- Page 组件的 `searchParams` 类型统一使用 `@/lib/search-params` 的 `SearchParams`，避免散落的 `Record<string, string | string[] | undefined>`；解析 query 统一用 `getSearchParamString`
- 枚举值（如 `priority/status/cycleUnit/dateType`）优先在 `apps/web/src/lib/*` 定义 `*Values` + 对应 `type` + `CONST_OBJECT`（如 `ITEM_STATUS`），业务逻辑/查询条件避免散落字面量字符串
- 纪念日分类（`anniversaries.category`）写入前统一用 `canonicalizeAnniversaryCategory`；列表筛选需用 `getAnniversaryCategoryAliases` 扩展匹配，避免历史数据造成重复标签/过滤遗漏
- 路由路径（如 `"/settings"`/`"/todo"`）统一从 `@/lib/routes` 引用，避免跨模块硬编码导致的漂移与重复
- 全局 Toast/重定向错误码（flash messages）统一在 `@/lib/flash` 定义：新增/修改 error code 时必须同步更新映射表，确保 UI 提示与 server 行为一致
- Query 参数枚举解析统一用 `@/lib/parse-enum`；FormData 字段解析统一使用 Zod Validation Schemas (`@/lib/validation/*`)。
- 禁止随意使用 `as SomeEnumType` 来“糊”类型：优先使用 `@/lib/*` 中的 `is*` type guard（或 `parseEnumString/parseEnumField`）在边界处完成收敛，避免无声引入非法值

---

## 4. 质量门槛（必须）

### 4.1 P0：Lint 作为底线

在开始合并/交付前，必须通过：

```bash
npm -C apps/web run lint -- --max-warnings=0
```

要求：**errors = 0 且 warnings = 0**（不允许靠 warning “先糊上”；如确需引入 warning，必须先说明原因并在同一阶段清理）。

### 4.2 推荐项

也可以一行执行（包含 lint/test/build）：

```bash
npm -C apps/web run check
```

```bash
npm -C apps/web run test
```

```bash
npm -C apps/web run build
```

以及手动冒烟：
- Todo/纪念日/订阅/物品列表正常渲染
- Modal（Create/Confirm/Search）打开/关闭/ESC 正常
- Tooltip 显示位置正常
- Confetti/MicroConfetti 触发正常

### 4.3 依赖安全（建议）

```bash
npm -C apps/web audit
```

约定：
- 优先做 **非破坏性** 升级（不建议默认使用 `npm audit fix --force`）
- 若某条漏洞无法在不引入破坏性变更的前提下修复，应在这里记录原因与影响面

已知项：
- `esbuild@0.18.20`（经由 `drizzle-kit` → `@esbuild-kit/core-utils`）会被 `npm audit` 标记为 `moderate`
  - `npm audit fix --force` 会建议降级 `drizzle-kit`（破坏性变更），因此当前选择 **保留** 并避免将相关 dev server 暴露到不可信网络

---

## 5. 功能实现前自检（每个模块/模型都必须过一遍）

在开始实现任何一个模块（Todo / 纪念日 / 订阅 / 物品 / 通知）的新功能前，先逐项自检：

- [ ] **目标/非目标**：本次改动解决什么？明确不解决什么？
- [ ] **Muda**：是否引入重复实现？能否复用现有工具/组件/模式？
- [ ] **Mura**：命名、数据结构、UI 组件用法是否与既有实现一致？
- [ ] **Muri**：是否会让单文件/单组件过载？能否拆成纯函数/子组件？
- [ ] **低耦合**：是否把存储细节（如 JSON 字符串）泄漏进 UI？能否在 server/actions 层完成转换？
- [ ] **类型策略**：避免在类型声明中使用 `JSX.Element`（可能缺少 `JSX` namespace），优先 `ReactNode/ReactElement`（`import type`）
- [ ] **质量门槛**：是否能保证 `npm -C apps/web run lint -- --max-warnings=0` 通过（errors=0 且 warnings=0）？
- [ ] **回归风险**：关键路径（列表/详情/创建/删除/恢复/提醒预览）是否有手动冒烟点？

---

## 6. 可选优化空间清单（Backlog）

> 说明：这里记录“值得做但不一定现在就做”的优化点，方便后续按 3M 原则逐项清理。

- [x] **Muri**：`apps/web/src/app/_components/SmartDateInput.tsx` 继续拆分（状态管理/输入渲染进一步解耦），控制单文件复杂度
- [x] **Muri**：`apps/web/src/app/_components/SmartDateInput.tsx` 抽取 `SmartDatePartInput` 子组件（降低重复与认知负担）
- [x] **Muri**：抽取 `apps/web/src/app/_components/useSmartDateInput.ts`（状态与渲染解耦，降低组件复杂度）
- [x] **Muri**：`apps/web/src/app/_actions/backup.ts` 下沉解析/重定向逻辑到 `apps/web/src/app/_actions/backup.import.utils.ts`（入口文件只保留编排）
- [x] **Muri**：`apps/web/src/app/_actions/todos.actions.ts` 拆分为 `todos.upsert.ts` / `todos.lifecycle.ts` / `todos.redirect.ts`，并用 `todos.actions.ts` 作为薄的 re-export 层
- [x] **Muri**：`apps/web/src/app/_actions/notifications.ts` 下沉通用校验与重定向逻辑到 `apps/web/src/app/_actions/notifications.utils.ts`（入口文件只保留编排）
- [x] **Muri**：`apps/web/src/server/notifications.ts` 拆出 `apps/web/src/server/notifications.utils.ts`（纯函数/常量下沉，避免单文件承担过多职责）
- [x] **Muri**：`apps/web/src/app/_components/items/ItemCard.tsx` 抽出静态配置到 `apps/web/src/app/_components/items/ItemCard.constants.tsx`（避免主文件过长）
- [x] **Muda**：统一 FormData 字段解析，收敛到 `apps/web/src/app/_actions/form-data.ts` / `apps/web/src/app/_actions/form-fields.ts`
- [x] **Muda**：统一 Create Form 的错误 Toast 文案（`DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE`），避免多处字符串散落
- [x] **Mura**：清理 `apps/web/src/app` 中的 tab 缩进（统一空格缩进），减少格式噪声与风格漂移
- [x] **Mura**：将 `GlobalToastListener` 的静态成功提示收敛到 `apps/web/src/lib/flash.ts`（统一文案来源，减少散落字符串）
- [x] **Mura**：收敛“错误码”与“Toast 文案”的来源（避免各处字符串散落），优先集中在单一模块并在 `DEVELOPMENT.md` 约定新增规则
- [x] **低耦合**：在关键 server-only 模块顶部加入 `import "server-only"`（防止误被 `use client` 组件引入）
- [x] **低耦合**：将 `items/subscriptions/anniversaries` 列表页的 DB 查询与数据整形下沉到各自 `/_lib`（`page.tsx` 只做编排）
- [x] **低耦合**：将 `todo/[id]` 详情页的 DB 查询与数据整形下沉到 `apps/web/src/app/todo/[id]/_lib`（`page.tsx` 只做编排）
- [x] **Muda**：清理仓库根目录无 `package.json` 时遗留的 `package-lock.json`（避免误导安装方式）
- [x] **可靠性**：为 `apps/web/src/server/anniversary.ts`、`apps/web/src/server/date.ts`、`apps/web/src/server/datetime.ts`、`apps/web/src/server/recurrence.ts`、`apps/web/src/server/notifications.utils.ts`、`apps/web/src/server/reminder-preview.ts`、`apps/web/src/lib/validation/common.ts` 的关键纯函数补最小单测（使用 Node 内置 `node:test` + `apps/web/scripts/test-loader.mjs`）
