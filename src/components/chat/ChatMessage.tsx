import { memo } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage as ChatMessageType } from "../../stores/chat";

interface Props {
  message: ChatMessageType;
}

function ChatMessageRaw({ message }: Props) {
  const isUser = message.role === "user";
  const envelope = message.envelope;
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`max-w-[85%] rounded-lg text-[13px] leading-relaxed animate-[fade-in_0.3s_ease] break-words ${
        isUser ? "self-end rounded-br-sm" : "self-start rounded-bl-sm"
      }`}
      style={{
        padding: "10px 14px",
        background: isUser ? "rgba(0, 50, 100, 0.35)" : "rgba(0, 0, 0, 0.35)",
        border: isUser
          ? "1px solid rgba(0, 212, 255, 0.25)"
          : "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div
        className="text-[9px] font-bold uppercase tracking-[0.5px] mb-1"
        style={{ color: isUser ? "#00d4ff" : "rgba(224, 224, 240, 0.5)" }}
      >
        {isUser ? (message.source === "dashboard" ? "YOU" : message.source || "USER") : "ARQITECT"}
      </div>

      {/* Text content */}
      {message.text && (
        <div
          style={{ color: "rgba(255, 255, 255, 0.88)" }}
          className="[&_strong]:text-white [&_em]:italic [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs"
        >
          {envelope?.content.markdown ? (
            <ReactMarkdown>{message.text}</ReactMarkdown>
          ) : (
            <span>{message.text}</span>
          )}
        </div>
      )}

      {/* GIF */}
      {envelope?.media?.gifUrl && (
        <img
          src={envelope.media.gifUrl}
          alt=""
          className="mt-2 max-w-[200px] max-h-[150px] rounded border border-[var(--border)]"
        />
      )}

      {/* Image */}
      {envelope?.media?.image && (
        <img
          src={`data:${envelope.media.image.mime};base64,${envelope.media.image.data}`}
          alt=""
          className="mt-2 max-w-[200px] max-h-[150px] rounded border border-[var(--border)]"
        />
      )}

      {/* Card */}
      {envelope?.rich?.card && (
        <div
          className="mt-2 rounded-md"
          style={{
            padding: "10px 12px",
            background: "rgba(0, 212, 255, 0.06)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
          }}
        >
          <div
            className="text-xs font-semibold mb-1"
            style={{ color: "#00d4ff" }}
          >
            {envelope.rich.card.title}
          </div>
          <div
            className="text-xs leading-relaxed"
            style={{ color: "rgba(255, 255, 255, 0.78)" }}
          >
            {envelope.rich.card.body}
          </div>
          {envelope.rich.card.footer && (
            <div
              className="text-[10px] mt-1.5 italic"
              style={{ color: "rgba(255, 255, 255, 0.35)" }}
            >
              {envelope.rich.card.footer}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {envelope?.rich?.actions && envelope.rich.actions.length > 0 && (
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {envelope.rich.actions.map((action) => (
            <button
              key={action.value}
              className="text-[10px] px-2.5 py-1 rounded border border-[var(--accent)]/30 text-[var(--accent)] bg-[var(--accent)]/15 hover:bg-[var(--accent)]/30 transition-all cursor-pointer"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="text-[9px] mt-1 text-right" style={{ color: "rgba(255, 255, 255, 0.3)" }}>
        {time}
      </div>
    </div>
  );
}

export const ChatMessage = memo(ChatMessageRaw);
