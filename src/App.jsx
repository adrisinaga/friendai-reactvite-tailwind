import "./App.css";
import { requestToGroqAI } from "./utils/groq";
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Menu, MessageSquare, Plus, Copy, Check } from "lucide-react";

  /**
   * The main App component.
   *
   * This component renders the main chat interface, including the sidebar, main chat area,
   * and input area. It also handles the state for the chat history, active chat ID, and
   * whether the sidebar is open or not.
   *
   * @returns The main App component.
   */
function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: "New Chat", messages: [] }
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedCode !== null) {
      const timer = setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedCode]);

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: inputMessage }];
    setMessages(newMessages);
    
    // Update chat history with new messages
    setChatHistory(prev => prev.map(chat => 
      chat.id === activeChatId 
        ? { 
            ...chat, 
            messages: newMessages,
            // Update title if this is the first user message
            title: chat.title === "New Chat" && newMessages.length === 1 
              ? inputMessage.slice(0, 30) + (inputMessage.length > 30 ? "..." : "") 
              : chat.title
          }
        : chat
    ));

    setInputMessage("");

    // Get AI response
    try {
      const aiResponse = await requestToGroqAI(inputMessage);
      const updatedMessages = [...newMessages, { role: 'assistant', content: aiResponse }];
      setMessages(updatedMessages);
      
      // Update chat history with AI response
      setChatHistory(prev => prev.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: updatedMessages }
          : chat
      ));
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  };

  const startNewChat = () => {
    const newChatId = chatHistory.length + 1;
    setChatHistory(prev => [...prev, { id: newChatId, title: "New Chat", messages: [] }]);
    setActiveChatId(newChatId);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const switchChat = (chatId) => {
    setActiveChatId(chatId);
    const chat = chatHistory.find(c => c.id === chatId);
    setMessages(chat.messages);
    setIsSidebarOpen(false);
  };

  const formatMessage = (content) => {
    const lines = content.split('\n');
    let isInCodeBlock = false;
    let codeBlock = [];
    let codeBlockIndex = 0;

    const formatTextWithAsterisks = (text) => {
      const parts = text.split(/(\*[^\*]+\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          // Remove asterisks and wrap in italic span
          return (
            <span key={index} className="italic text-[#ff79c6]">
              {part.slice(1, -1)}
            </span>
          );
        }
        return part;
      });
    };

    return lines.map((line, i) => {
      // Check for code block markers
      if (line.startsWith('```')) {
        isInCodeBlock = !isInCodeBlock;
        if (!isInCodeBlock && codeBlock.length > 0) {
          // End of code block, render it
          const code = codeBlock.join('\n');
          const currentIndex = codeBlockIndex++;
          codeBlock = [];
          return (
            <div key={i} className="relative group">
              <pre className="bg-[#282a36] p-4 rounded-md my-2 overflow-x-auto">
                <code className="text-sm font-mono text-[#f8f8f2]">{code}</code>
              </pre>
              <button
                onClick={() => handleCopyCode(code, currentIndex)}
                className="absolute top-2 right-2 p-2 bg-[#44475a] rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy code"
              >
                {copiedCode === currentIndex ? (
                  <Check size={16} className="text-[#50fa7b]" />
                ) : (
                  <Copy size={16} className="text-[#f8f8f2]" />
                )}
              </button>
            </div>
          );
        }
        return null;
      }

      if (isInCodeBlock) {
        codeBlock.push(line);
        return null;
      }

      // Check for inline code
      if (line.includes('`')) {
        const parts = line.split('`');
        return (
          <span key={i} className="block text-start">
            {parts.map((part, j) => {
              if (j % 2 === 1) { // Inside backticks
                return (
                  <code key={j} className="bg-[#282a36] px-1 rounded font-mono text-sm text-[#f8f8f2]">
                    {part}
                  </code>
                );
              }
              return formatTextWithAsterisks(part);
            })}
          </span>
        );
      }

      // Regular text with possible asterisks
      return (
        <span key={i} className="block text-start">
          {formatTextWithAsterisks(line)}
        </span>
      );
    }).filter(Boolean);
  };

  return (
    <div className="flex h-screen min-h-screen w-screen overflow-hidden fixed inset-0 bg-[#282a36]">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#44475a] rounded-md text-[#f8f8f2] hover:bg-[#6272a4] transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 w-64 bg-[#1e1f29] text-[#f8f8f2] transition-transform duration-200 ease-in-out z-40`}
      >
        <div className="flex flex-col h-full p-4">
          <button
            onClick={startNewChat}
            className="flex items-center justify-center gap-2 bg-[#44475a] text-[#f8f8f2] rounded-md p-3 mb-4 hover:bg-[#6272a4] transition-colors"
          >
            <Plus size={20} />
            New Chat
          </button>
          <ScrollArea className="flex-1 overflow-y-auto">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => switchChat(chat.id)}
                className={`flex items-center gap-2 p-3 rounded-md cursor-pointer mb-2 ${
                  activeChatId === chat.id ? 'bg-[#44475a]' : 'hover:bg-[#44475a]'
                }`}
              >
                <MessageSquare size={16} />
                <span className="truncate">{chat.title}</span>
              </div>
            ))}
          </ScrollArea>
          <div className="pt-4 mt-4 border-t border-[#44475a]">
            <p className="text-sm text-[#6272a4] text-center">
              &copy; {new Date().getFullYear()} Carryu Indonesia.<br />
              All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-6 ${
                  message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                }`}
              >
                <div
                  className={`rounded-lg p-4 max-w-[85%] whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-[#bd93f9] text-[#f8f8f2]'
                      : 'bg-[#44475a] text-[#f8f8f2]'
                  }`}
                >
                  {formatMessage(message.content)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-[#44475a]">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-[#44475a] text-[#f8f8f2] rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#bd93f9] placeholder-[#6272a4]"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              className="bg-[#bd93f9] text-[#f8f8f2] px-6 py-3 rounded-md hover:bg-[#ff79c6] transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
