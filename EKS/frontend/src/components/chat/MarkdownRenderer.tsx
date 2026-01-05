import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Partial<Components> = {
    h2: ({ children }) => (
      <h2 className="text-base font-semibold mt-2 mb-1 text-foreground">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-sm mb-2 leading-relaxed text-foreground">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-4 space-y-1 text-sm mb-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-4 space-y-1 text-sm mb-2">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-sm text-foreground">{children}</li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    code: ({ children }) => (
      <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-primary/30 pl-3 py-1 my-2 text-xs text-muted-foreground bg-muted/30 rounded-r">
        {children}
      </blockquote>
    ),
    br: () => <br className="my-1" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border-2 border-gray-400 dark:border-gray-500 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-muted/50">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-gray-300 dark:divide-gray-600">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="border-b border-gray-300 dark:border-gray-600 last:border-0">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 text-left text-xs font-semibold text-foreground border-r border-gray-300 dark:border-gray-600 last:border-r-0">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-sm text-foreground border-r border-gray-300 dark:border-gray-600 last:border-r-0">
        {children}
      </td>
    ),
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

