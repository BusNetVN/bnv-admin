export function PagePlaceholder({
  title,
  description = "Nội dung sẽ được xây dựng tại đây.",
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 p-6">
      <h1 className="font-heading text-2xl font-medium tracking-tight">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
