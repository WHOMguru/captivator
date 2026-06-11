// Layout for the PowerPoint task pane. The task pane is a tall, narrow surface,
// so we constrain width and let content scroll vertically.
export default function AddinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50">{children}</div>
  );
}
