export type SetState<T> = (next: T | ((prev: T) => T)) => void;

export const DEFAULT_CREATE_FORM_ERROR_TOAST_MESSAGE = "创建失败，请重试";

export type ScheduleTimeout = (
  fn: () => void,
  delayMs: number,
) => ReturnType<typeof setTimeout>;

export type FormRef = { current: HTMLFormElement | null };

export type RunCreateFormSuccessOptions = {
  setIsSuccess: SetState<boolean>;
  toastSuccess: (message: string) => void;
  setFormKey: SetState<number>;
  formRef: FormRef;
  scheduleTimeout: ScheduleTimeout;
  closeCreateModalIfOpen: () => void;
  toastMessage?: string;
  closeDelayMs?: number;
  afterReset?: () => void;
};

export function runCreateFormSuccess({
  setIsSuccess,
  toastSuccess,
  setFormKey,
  formRef,
  scheduleTimeout,
  closeCreateModalIfOpen,
  toastMessage = "创建成功",
  closeDelayMs = 1000,
  afterReset,
}: RunCreateFormSuccessOptions) {
  setIsSuccess(true);
  toastSuccess(toastMessage);

  setFormKey((prev) => prev + 1);
  formRef.current?.reset();
  afterReset?.();

  scheduleTimeout(() => {
    setIsSuccess(false);
    closeCreateModalIfOpen();
  }, closeDelayMs);
}
