"use client";

import React, { useState, useEffect, useRef } from "react";
import CommandCenterLayout from "@/components/CommandCenterLayout";
import { api } from "@/utils/api";
import { Send, Bot, User, Trash2, Cpu } from "lucide-react";

interface ChatMessage {
  sender: "user" | "assistant";
  text: string;
}

const SUGGESTED_PROMPTS = [
  "Show active train delays",
  "List congested stations",
  "Are there any active alerts?",
  "How many active trains are running?",
  "Tell me about Jahangirpuri station",
  "What is the passenger flow at Rajiv Chowk?"
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "assistant",
      text: "Affirmative. Secure telemetry connection established. I am MetroMind, your AI Operations Copilot. Ask me to explain predictions, analyze station flows, recommend headway adjustments, or generate summaries."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle pre-populated prompt from Prediction Page
  useEffect(() => {
    const preQuery = sessionStorage.getItem("metroflow_assistant_query");
    if (preQuery) {
      sessionStorage.removeItem("metroflow_assistant_query");
      handleSendPrompt(preQuery);
    }
  }, []);

  const handleSendPrompt = async (text: string) => {
    if (!text.trim() || sending) return;
    
    const newMsg: ChatMessage = { sender: "user", text };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");
    setSending(true);

    try {
      // Pass bounding chat history
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));
      
      const res = await api.assistant.chat(text, historyPayload);
      
      setMessages(prev => [...prev, {
        sender: "assistant",
        text: res.response
      }]);
      setSending(false);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: "assistant",
        text: `Error contacting MetroMind AI: ${err.message || "Failed to receive response."}`
      }]);
      setSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(inputText);
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: "assistant",
        text: "Command log cleared. Telemetry links active. How can I assist you with operations today?"
      }
    ]);
  };

  return (
    <CommandCenterLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-wider font-mono text-cyan-400 text-glow-cyan flex items-center space-x-2">
              <Bot size={22} className="text-cyan-400 animate-pulse" />
              <span>METROMIND AI COPILOT</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono">Grounded operations intelligence with MetroMind AI</p>
          </div>
          
          <button
            onClick={handleClearChat}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/50 py-2 px-3.5 font-mono text-[10px] text-red-400 hover:bg-red-500/10 hover:border-red-800/40 transition-all uppercase"
          >
            <Trash2 size={13} />
            <span>Clear Logs</span>
          </button>
        </div>

        {/* Chat Output Log Panel */}
        <div className="flex-1 rounded-xl glass-card p-5 overflow-y-auto space-y-4 shadow-inner">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex space-x-3 w-full ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "assistant" && (
                <div className="h-8 w-8 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
              )}
              
              <div className={`rounded-xl border p-4 max-w-xl text-xs font-mono leading-relaxed whitespace-pre-line ${
                m.sender === "user"
                  ? "bg-cyan-500/10 border-cyan-500/35 text-cyan-200"
                  : "bg-slate-950/80 border-slate-850 text-slate-300"
              }`}>
                {m.text}
              </div>

              {m.sender === "user" && (
                <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          
          {sending && (
            <div className="flex space-x-3 justify-start animate-pulse">
              <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center shrink-0">
                <Cpu size={16} className="animate-spin" />
              </div>
              <div className="rounded-xl border border-slate-850 bg-slate-950/50 p-4 font-mono text-xs text-slate-500">
                COPILOT IS WRITING RESPONSE FROM COMMAND GROUNDING DATABASE...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        <div className="flex flex-wrap gap-2 py-1.5 font-mono text-[10px]">
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={sending}
              onClick={() => handleSendPrompt(p)}
              className="rounded-full border border-slate-800 bg-[#091124]/40 py-1.5 px-3 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleFormSubmit} className="flex gap-3 shrink-0">
          <input
            type="text"
            required
            disabled={sending}
            placeholder="Ask Copilot about metro telemetry, active alerts, schedule delays, or recommendations..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-lg border border-slate-800 bg-[#070b19]/80 py-3.5 px-4 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 font-mono text-xs font-bold uppercase tracking-wider text-slate-900 hover:from-cyan-400 hover:to-indigo-500 transition-all flex items-center justify-center disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </CommandCenterLayout>
  );
}
