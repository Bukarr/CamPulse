import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Send, X, Bot, Calendar, TrendingUp, AlertTriangle, ShieldAlert, Wrench, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface GemmaAIWidgetProps {
  currentUser: User;
}

export default function GemmaAIWidget({ currentUser }: GemmaAIWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'digest'>(currentUser.role === 'admin' ? 'digest' : 'faq');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Welcome! I am **Gemma 4 AI**, your ABU maintenance operations companion. Ask me any question about logging reports, our priority scoring, or offline queueing!`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Weekly summary states for admins
  const [weeklySummary, setWeeklySummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('campulse-token');
      const res = await fetch('/api/gemma/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': token } : {})
        },
        body: JSON.stringify({ 
          message: textToSend,
          userRole: currentUser?.role,
          userId: currentUser?.id
        })
      });
      const data = await res.json();
      
      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || "Sorry, I am having trouble connecting to my brain right now.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const offlineMsg: Message = {
        id: `msg-ai-err-${Date.now()}`,
        sender: 'ai',
        text: "I am having difficulty reaching the server, but I am still available in offline helper mode! Ask me about 'offline sync' or 'priority system'.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, offlineMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyReport = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/gemma/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setWeeklySummary(data.summary || 'Unable to load summary.');
    } catch (err) {
      console.error(err);
      setWeeklySummary('Failed to fetch the weekly maintenance summary. Please check your connection.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const quickFaqs = [
    { label: "💡 Gemma AI Priorities?", query: "How are priority scores P1-P5 assigned?" },
    { label: "📶 Working Offline?", query: "How does offline sync work?" },
    { label: "📍 How to Report?", query: "How do I report a maintenance issue?" },
    { label: "🔒 Report Anonymously?", query: "Can I report issues anonymously?" }
  ];

  // Simple parser to strip all markdown (asterisks, hashtags) and render clean plain-text
  const formatText = (text: string) => {
    if (!text) return null;
    const cleanedText = text.replace(/[*#]/g, '');
    return cleanedText.split('\n').map((line, idx) => {
      return line.trim() === '' ? (
        <div key={idx} className="h-2" />
      ) : (
        <p key={idx} className="text-[11px] leading-relaxed text-slate-700 mt-1 font-sans">
          {line}
        </p>
      );
    });
  };

  // Parsing the structured markdown executive summary into custom React cards
  const parseWeeklySummaryToCards = (rawMarkdown: string) => {
    if (!rawMarkdown) return null;

    const sections = rawMarkdown.split('### ');
    return sections.map((sec, idx) => {
      if (!sec.trim()) return null;
      
      const lines = sec.split('\n');
      const titleLine = lines[0].trim();
      const contentLines = lines.slice(1).join('\n');

      let icon = <Bot size={14} className="text-emerald-600" />;
      let headerBg = "bg-emerald-50 text-emerald-800 border-emerald-100";

      if (titleLine.includes('Executive Overview') || titleLine.includes('Overview')) {
        icon = <TrendingUp size={14} className="text-sky-600" />;
        headerBg = "bg-sky-50 text-sky-800 border-sky-100";
      } else if (titleLine.includes('Critical') || titleLine.includes('Pain Points')) {
        icon = <ShieldAlert size={14} className="text-rose-600" />;
        headerBg = "bg-rose-50 text-rose-800 border-rose-100";
      } else if (titleLine.includes('Technician') || titleLine.includes('Dispatch')) {
        icon = <Wrench size={14} className="text-amber-600" />;
        headerBg = "bg-amber-50 text-amber-800 border-amber-100";
      } else if (titleLine.includes('Action Items') || titleLine.includes('Suggested')) {
        icon = <CheckCircle size={14} className="text-emerald-600" />;
        headerBg = "bg-emerald-50 text-emerald-800 border-emerald-100";
      }

      return (
        <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-2xs mb-3">
          <div className={`px-3 py-2 flex items-center gap-1.5 font-sans font-bold text-xs border-b border-slate-100/50 ${headerBg}`}>
            {icon}
            <span>{titleLine.replace(/[^\w\s-&]/g, '').trim()}</span>
          </div>
          <div className="p-3 space-y-1">
            {formatText(contentLines)}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Sparkles Trigger Button */}
      <button
        id="gemma-floating-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[84px] right-4 z-40 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-emerald-500/30"
        title="Gemma 4 Campus AI"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles size={20} className="animate-pulse text-emerald-100" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
        </div>
      </button>

      {/* Main Gemma Assistant Panel */}
      {isOpen && (
        <div
          id="gemma-ai-panel"
          className="fixed bottom-[146px] right-4 w-80 md:w-96 h-[440px] md:h-[500px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom duration-200"
        >
          {/* Header */}
          <div className="bg-emerald-850 p-3.5 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-700/50 border border-emerald-500 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-emerald-300 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-sans tracking-tight">Gemma 4 Campus AI</h3>
                <p className="text-[9px] text-emerald-200/80 mt-0.5">ABU Zaria Smart Maintenance System</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Role Tab Navigation for Administrators */}
          {currentUser.role === 'admin' && (
            <div className="bg-slate-50 border-b border-slate-200 p-1 flex gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('digest')}
                className={`flex-1 py-1 text-center font-sans font-bold text-[10px] rounded-lg transition-all cursor-pointer ${
                  activeTab === 'digest' ? 'bg-white border border-slate-200 text-emerald-800 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                📊 Admin Weekly summary
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`flex-1 py-1 text-center font-sans font-bold text-[10px] rounded-lg transition-all cursor-pointer ${
                  activeTab === 'faq' ? 'bg-white border border-slate-200 text-emerald-800 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                💬 Ask Gemma FAQ
              </button>
            </div>
          )}

          {/* Tab 1: FAQ Student Chat */}
          {activeTab === 'faq' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-bold ${
                      msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-emerald-800 border border-slate-300/40'
                    }`}>
                      {msg.sender === 'user' ? currentUser.name[0].toUpperCase() : '🤖'}
                    </div>

                    {/* Speech Bubble */}
                    <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed border ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 border-emerald-500 text-white rounded-tr-none'
                        : 'bg-white border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                    }`}>
                      <div className="space-y-1">
                        {formatText(msg.text)}
                      </div>
                      <span className={`block text-[8px] mt-1 text-right ${msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-2 max-w-[80%]">
                    <div className="w-6 h-6 rounded-lg bg-slate-200 text-emerald-800 border border-slate-300/40 flex items-center justify-center text-[11px] font-bold">
                      🤖
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick FAQ Suggestion Pills */}
              <div className="px-3 py-1.5 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none">
                {quickFaqs.map((faq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(faq.query)}
                    className="shrink-0 text-[10px] font-bold font-sans bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 hover:border-emerald-200 px-2 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    {faq.label}
                  </button>
                ))}
              </div>

              {/* Message Entry Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="p-2 bg-white border-t border-slate-200 flex gap-1.5 shrink-0"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Gemma about maintenance..."
                  disabled={isLoading}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 text-slate-700 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-2 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Admin Weekly Summary Digest */}
          {activeTab === 'digest' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 p-4 overflow-y-auto">
              <div className="text-center space-y-2 mb-4 shrink-0">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Admin Operations Digest</h4>
                  <p className="text-[10px] text-slate-400">Compile weekly statistics, pain points, and AI-driven technician recommendations</p>
                </div>
              </div>

              {weeklySummary ? (
                <div className="flex-1 min-h-0 overflow-y-auto mb-3 pr-1">
                  {parseWeeklySummaryToCards(weeklySummary)}
                  
                  <button
                    onClick={generateWeeklyReport}
                    disabled={isGeneratingSummary}
                    className="w-full mt-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1 bg-white border border-emerald-200 p-2 rounded-xl transition-all hover:bg-emerald-50 cursor-pointer"
                  >
                    <Sparkles size={12} /> {isGeneratingSummary ? 'Regenerating summary...' : 'Regenerate summary'}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200/50 rounded-2xl p-6 text-center shadow-2xs space-y-4">
                  <div className="text-slate-400">
                    <TrendingUp size={24} className="mx-auto text-emerald-600/60 mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-slate-700">No summary loaded yet</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">Generate dynamic weekly statistics compiled and analyzed by Gemma 4 AI based on crowdsourced tickets</p>
                  </div>
                  
                  <button
                    onClick={generateWeeklyReport}
                    disabled={isGeneratingSummary}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Sparkles size={14} /> {isGeneratingSummary ? 'Analyzing data...' : 'Generate Weekly Summary'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
