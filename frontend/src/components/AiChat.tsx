import React, { useState, useRef, useEffect } from "react";
import {
  generateReport,
  NeedsMoreInfoResponse,
  Report,
} from "../services/ai.service";

interface AiChatProps {
  userId: number;
  onReportGenerated: (reportId: number) => void;
}

const AiChat: React.FC<AiChatProps> = ({ userId, onReportGenerated }) => {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Hi! I can help you create dashboard reports using Xero data. What kind of report would you like to generate?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Add temporary loading message
      setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);

      // Generate report
      const response = await generateReport(input, userId);

      // If this is a "needs more info" response from the AI
      if (response && "needsMoreInfo" in response && response.needsMoreInfo) {
        // Replace loading message with the AI's request for more information
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages.pop(); // Remove loading message

          // Format the required information into a readable message
          const requiredInfoMessage = response.requiredInfo
            ? "\n\nPlease provide the following information:\n" +
              response.requiredInfo
                .map((info, index) => `${index + 1}. ${info}`)
                .join("\n")
            : "";

          return [
            ...newMessages,
            {
              role: "assistant",
              content: `I'm creating a report called "${response.name}". ${response.description}.${requiredInfoMessage}`,
            },
          ];
        });
        return;
      }

      // Normal successful report generation - at this point response is a Report
      const report = response as Report;

      // Replace loading message with success message
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove loading message
        return [
          ...newMessages,
          {
            role: "assistant",
            content: `I've created the "${report.name}" report for you. You can view and execute it from your reports list.`,
          },
        ];
      });

      // Notify parent component
      onReportGenerated(report.id);
    } catch (error) {
      console.error("Error generating report:", error);

      // Get a user-friendly error message
      let errorMessage =
        "Sorry, I encountered an error while generating your report.";

      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }

      // Replace loading message with error message
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove loading message
        return [...newMessages, { role: "assistant", content: errorMessage }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the report you want to create..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiChat;
