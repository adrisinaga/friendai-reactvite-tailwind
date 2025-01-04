import "./App.css";
import { requestToGroqAI } from "./utils/groq";
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Menu, MessageSquare, Plus } from "lucide-react";

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: "New Chat", messages: [] }
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    return lines.map((line, i) => {
      // Check for code block markers
      if (line.startsWith('```')) {
        isInCodeBlock = !isInCodeBlock;
        if (!isInCodeBlock && codeBlock.length > 0) {
          // End of code block, render it
          const code = codeBlock.join('\n');
          codeBlock = [];
          return (
            <pre key={i} className="bg-gray-950 p-4 rounded-md my-2 overflow-x-auto">
              <code className="text-sm font-mono text-gray-100">{code}</code>
            </pre>
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
                  <code key={j} className="bg-gray-950 px-1 rounded font-mono text-sm">
                    {part}
                  </code>
                );
              }
              return part;
            })}
          </span>
        );
      }

      // Regular text
      return (
        <span key={i} className="block text-start">
          {line}
        </span>
      );
    }).filter(Boolean);
  };

  return (
    <div className="flex h-screen min-h-screen w-screen overflow-hidden fixed inset-0 bg-gray-900">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-md text-white"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 w-64 bg-gray-800 text-white transition-transform duration-200 ease-in-out z-40`}
      >
        <div className="flex flex-col h-full p-4">
          <button
            onClick={startNewChat}
            className="flex items-center justify-center gap-2 bg-gray-700 text-white rounded-md p-3 mb-4 hover:bg-gray-600 transition-colors"
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
                  activeChatId === chat.id ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <MessageSquare size={16} />
                <span className="truncate">{chat.title}</span>
              </div>
            ))}
          </ScrollArea>
          <div className="pt-4 mt-4 border-t border-gray-700">
            <p className="text-lg text-gray-400 text-center">
              &copy; {new Date().getFullYear()} Carryu Indonesia.<br />
              All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ScrollArea className="flex-1 p-4 overflow-y-auto h-full">
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
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-white'
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
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-gray-700 text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-yellow-600"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              className="bg-yellow-600 text-white px-6 py-3 rounded-md hover:bg-yellow-700 transition-colors"
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
