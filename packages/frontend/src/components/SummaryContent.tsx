import ReactMarkdown from "react-markdown";

interface Props {
  text: string;
}

export const SummaryContent = ({ text }: Props) => (
  <ReactMarkdown
    components={{
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
      li: ({ children }) => <li>{children}</li>,
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    }}
  >
    {text}
  </ReactMarkdown>
);
