import React, { useState, useRef, useEffect } from 'react';
import { Send, Music, Loader2, BookOpen } from 'lucide-react';
import { generateMusicAdvice } from '../services/geminiService';
import { NoteName, ScaleType, ChatMessage } from '../types';

interface AITutorProps {
  currentRoot: NoteName;
  currentScale: ScaleType;
}

const AITutor: React.FC<AITutorProps> = ({ currentRoot, currentScale }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting when scale changes
    setMessages([{
      role: 'model',
      text: `你好！我是你的 AI 乐理助教。我看到你正在练习 ${currentRoot} ${currentScale}。有什么我可以帮你的吗？比如“这个音阶有哪些常用和弦？”或“给我一个爬格子的练习”。`
    }]);
  }, [currentRoot, currentScale]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userText = input;
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsGenerating(true);

    try {
      const response = await generateMusicAdvice(currentRoot, currentScale, userText);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "出错了，请稍后再试。" }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    // Optional: Auto send immediately? Let's just fill input for now or invoke send.
    // Let's fill input to let user confirm.
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-amber-500 hover:bg-amber-600 text-white p-3 sm:p-4 rounded-full shadow-xl flex items-center gap-2 transition-all z-50 animate-bounce-slow"
      >
        <BookOpen size={22} />
        <span className="font-bold hidden md:inline">乐理助教</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 left-0 sm:left-auto sm:bottom-4 sm:right-4 w-full sm:max-w-md bg-neutral-800 border border-neutral-700 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col z-50 overflow-hidden" style={{ maxHeight: '80vh', height: '500px' }}>
      {/* Header */}
      <div className="bg-neutral-900 p-4 border-b border-neutral-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 rounded-lg">
                <Music className="text-amber-500" size={20} />
            </div>
            <h3 className="font-bold text-white">AI 吉他助教</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white px-2">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-800/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-amber-600 text-white rounded-br-none' 
                : 'bg-neutral-700 text-neutral-200 rounded-bl-none border border-neutral-600'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-neutral-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
              <Loader2 className="animate-spin text-amber-500" size={16} />
              <span className="text-xs text-neutral-400">正在思考...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-neutral-700 bg-neutral-900/50">
        <button onClick={() => handleQuickPrompt("这个音阶怎么练习？")} className="whitespace-nowrap px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-full text-xs text-neutral-300 transition-colors">
          🎸 练习建议
        </button>
        <button onClick={() => handleQuickPrompt("这里面包含哪些和弦？")} className="whitespace-nowrap px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-full text-xs text-neutral-300 transition-colors">
          🎼 和弦构成
        </button>
        <button onClick={() => handleQuickPrompt("什么是五度圈？")} className="whitespace-nowrap px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-full text-xs text-neutral-300 transition-colors">
          🤔 乐理问答
        </button>
      </div>

      {/* Input */}
      <div className="p-4 bg-neutral-900 border-t border-neutral-700 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入你的问题..."
          className="flex-1 bg-neutral-800 text-white border border-neutral-600 rounded-full px-4 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-neutral-500"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isGenerating}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AITutor;