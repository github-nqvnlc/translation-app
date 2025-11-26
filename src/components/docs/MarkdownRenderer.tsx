import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/docs/CodeBlock";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-sky max-w-none prose-headings:scroll-mt-20">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="mb-6 mt-8 text-4xl font-bold text-white first:mt-0 border-b border-white/10 pb-3" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="mb-4 mt-8 text-3xl font-semibold text-white border-b border-white/10 pb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mb-3 mt-6 text-2xl font-semibold text-sky-400" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="mb-2 mt-4 text-xl font-semibold text-slate-200" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 text-slate-300 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-300" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-2 text-slate-300" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded bg-white/10 px-1.5 py-0.5 text-sm font-mono text-sky-300"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="text-sm font-mono text-slate-200"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }: any) => (
            <CodeBlock>
              {children}
            </CodeBlock>
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-4 border-l-4 border-sky-500/50 bg-slate-950/40 pl-4 italic text-slate-300"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-sky-400 underline transition hover:text-sky-300"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="my-6 overflow-x-auto">
              <table
                className="min-w-full border-collapse border border-white/10"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-950/60" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-white/10" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-white/5" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border border-white/10 px-4 py-3 text-left text-sm font-semibold text-white"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-white/10 px-4 py-3 text-sm text-slate-300"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-white/10" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-slate-200" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

