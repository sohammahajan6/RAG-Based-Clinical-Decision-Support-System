import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
  token: string;
  patient?: any; // Make patient optional
  isDarkMode: boolean;
  isResearchMode?: boolean;
}

// ...existing interfaces...

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  token,
  patient,
  isDarkMode,
  isResearchMode = false
}) => {
  console.log('isDarkMode:', isDarkMode); // Add this line to debug
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your medical AI assistant. How can I help you with patient ${patient?.name} today?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const queryData = {
        question: input
      };

      const response = await fetch(`http://localhost:8000/query?question=${encodeURIComponent(queryData.question)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get response from the chatbot');
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I could not process your request.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error in chat:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error processing your request. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (text: string, isUserMessage: boolean) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className={`text-2xl font-bold my-4 ${isUserMessage
                ? 'text-white'
                : isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className={`text-xl font-bold my-3 ${isUserMessage
                ? 'text-white'
                : isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className={`text-lg font-bold my-2 ${isUserMessage
                ? 'text-white'
                : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              className={`my-2 ${isUserMessage
                ? 'text-white'
                : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className={`list-disc ml-6 my-2 ${isUserMessage
                ? 'text-white'
                : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className={`list-decimal ml-6 my-2 ${isUserMessage
                ? 'text-white'
                : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              className={`my-1 ${isUserMessage
                ? 'text-white'
                : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong
              className={`font-bold ${isUserMessage
                ? 'text-white'
                : isDarkMode ? 'text-blue-400' : 'text-blue-700'
                }`}
              {...props}
            />
          ),
          em: ({ node, ...props }) => (
            <em
              className={`italic ${isUserMessage
                ? 'text-white'
                : isDarkMode ? 'text-gray-400' : 'text-gray-700'
                }`}
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className={`border-l-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'
                } pl-4 my-2 italic`}
              {...props}
            />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code
                className={`rounded px-1 ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'
                  }`}
                {...props}
              />
            ) : (
              <code
                className={`block p-2 rounded my-2 ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'
                  }`}
                {...props}
              />
            ),
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto transition-colors duration-300 ${isDarkMode
      ? 'bg-gray-900 text-gray-100'
      : 'bg-white text-gray-900'
      } shadow-xl rounded-xl overflow-hidden`}>
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">
            {isResearchMode ? 'Research Assistant' : `Chat with ${patient?.name}`}
          </h2>
          <p className="text-sm text-white/80">
            Personalized medical guidance and support
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div className={`flex-1 overflow-y-auto p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        } space-y-4`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${message.sender === 'user' ? 'justify-end flex-row-reverse' : 'justify-start'
              }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${message.sender === 'user' ? 'bg-blue-600' : 'bg-indigo-600'
              }`}>
              {message.sender === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-3xl rounded-2xl p-4 transition-colors duration-300 ${message.sender === 'user'
              ? 'bg-blue-600 text-white rounded-br-none'
              : isDarkMode
                ? 'bg-gray-800 text-gray-100 border-gray-700'
                : 'bg-white text-gray-900 border-gray-200'
              } border rounded-bl-none shadow-sm`}>
              <div className="prose">
                {renderMessageContent(message.text, message.sender === 'user')}
              </div>
              <p className={`text-xs mt-2 ${message.sender === 'user'
                ? 'text-blue-200'
                : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-end space-x-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border rounded-2xl p-3`}>
              <div className="flex space-x-2">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
                      } animate-bounce`}
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`transition-colors duration-300 ${isDarkMode
        ? 'bg-gray-800 border-gray-700 text-gray-100'
        : 'bg-white border-gray-200 text-gray-900'
        } border-t p-4`}>
        <div className="flex items-center space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your medical query..."
            className={`flex-1 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all duration-300 ${isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className={`bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-2 rounded-lg h-full transition-all duration-300 ${!input.trim() || isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:from-blue-700 hover:to-indigo-800 active:scale-95'
              }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}