import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';

interface ChatBoxProps {
  onClose: () => void;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  color: string;
  initials: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'System',
    text: 'Welcome to the collaboration room! 🎨',
    timestamp: new Date(),
    isOwn: false,
    color: '#6B7280',
    initials: 'SY',
  },
];

export function ChatBox({ onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'You',
      text: inputValue,
      timestamp: new Date(),
      isOwn: true,
      color: '#3B82F6',
      initials: 'YO',
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate response after a delay
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'Alex',
        text: 'Great idea! Let me try that.',
        timestamp: new Date(),
        isOwn: false,
        color: '#10B981',
        initials: 'AL',
      };
      setMessages((prev) => [...prev, responseMessage]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 400, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-30 overflow-hidden"
      style={{ height: isMinimized ? '60px' : '500px' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white text-sm">Team Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
          >
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!message.isOwn && (
                    <Avatar
                      className="w-7 h-7 flex-shrink-0"
                      style={{ backgroundColor: message.color }}
                    >
                      <AvatarFallback className="text-white text-[10px]">
                        {message.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {!message.isOwn && (
                      <span className="text-[10px] text-gray-500 mb-1 px-1">
                        {message.sender}
                      </span>
                    )}
                    <div
                      className={`
                        px-3 py-2 rounded-2xl text-sm
                        ${
                          message.isOwn
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                        }
                      `}
                    >
                      {message.text}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 px-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-xl text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="rounded-xl px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
