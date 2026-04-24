export default function LoginLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-base px-4 py-8">
      <div className="fixed inset-0 z-[-1] bg-mesh-gradient opacity-70 pointer-events-none" />
      <div className="fixed inset-0 z-[-1] bg-noise pointer-events-none" />

      <div className="w-full max-w-[400px]">
        <div className="rounded-3xl bg-glass overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
          <div className="h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary" />

          <div className="px-8 pt-10 pb-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl skeleton-shimmer" />
            </div>
            <div className="mx-auto h-7 w-28 rounded-md skeleton-shimmer mb-2" />
            <div className="mx-auto h-4 w-56 rounded-md skeleton-shimmer mb-8" />
            <div className="h-12 w-full rounded-xl skeleton-shimmer mb-6" />
            <div className="h-12 w-full rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
