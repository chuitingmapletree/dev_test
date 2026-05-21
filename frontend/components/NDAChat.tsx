"use client";

import { useEffect, useRef, useState } from "react";
import { NDAFormData, Party } from "@/types/nda";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  data: NDAFormData;
  onChange: (data: NDAFormData) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function NDAChat({ data, onChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dataRef = useRef(data);
  const greetingSentRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!greetingSentRef.current) {
      greetingSentRef.current = true;
      sendToBackend([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendToBackend = async (conversationMessages: Message[]) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationMessages,
          current_fields: dataRef.current,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") break outer;

            try {
              const event = JSON.parse(payload);
              if (event.type === "token") {
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: last.content + event.content },
                  ];
                });
              } else if (event.type === "fields") {
                onChange(mergeFields(dataRef.current, event.fields));
              } else if (event.type === "error") {
                setMessages((prev) => [
                  ...prev.slice(0, -1),
                  { role: "assistant", content: event.content ?? "An error occurred." },
                ]);
              }
            } catch {
              // Ignore malformed SSE events
            }
          }
        }
      }

      // Flush any remaining buffer after stream closes
      if (buffer.trim()) {
        for (const line of buffer.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const event = JSON.parse(payload);
            if (event.type === "token") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, content: last.content + event.content }];
              });
            } else if (event.type === "fields") {
              onChange(mergeFields(dataRef.current, event.fields));
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          return [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content:
                "Sorry, I couldn't connect to the backend. Please ensure it is running on port 8000.",
            },
          ];
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    setInput("");
    setMessages((prev) => {
      const newMessages = [...prev, userMsg];
      sendToBackend(newMessages);
      return newMessages;
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 min-h-[320px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
              style={msg.role === "user" ? { backgroundColor: "#209dd7" } : {}}
            >
              {msg.content ||
                (isLoading && i === messages.length - 1 ? (
                  <span className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                ) : (
                  "​"
                ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 pt-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) sendMessage();
            }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#753991" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function mergeFields(current: NDAFormData, update: Record<string, unknown>): NDAFormData {
  const result = { ...current };
  for (const [key, value] of Object.entries(update)) {
    if (value == null) continue;
    if (key === "party1" || key === "party2") {
      result[key] = { ...current[key], ...(value as Partial<Party>) };
    } else {
      (result as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}
