import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, X, Sparkles, Loader2, ArrowRight, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { sendChatMessage } from '../api/chat.js';
import { Badge } from './ui/badge.jsx';

const SUGGESTIONS = [
  'Low Stock Items',
  'Parts under ₱1,000',
  'Is Denso Compressor in stock?',
  'Refrigerant prices',
];

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am your JayJef AI Inventory Assistant. How can I help you today?',
      products: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(text);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.reply,
        products: res.products || [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Sorry, I had trouble connecting to the inventory system. Please try again.',
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 rounded-full bg-red-600 px-5 py-3.5 text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
        >
          <Sparkles size={20} className="animate-pulse" />
          <span className="font-heading text-sm font-bold tracking-wide">AI Assistant</span>
          <span className="flex h-2 w-2 rounded-full bg-green-400" />
        </button>
      )}

      {isOpen && (
        <div className="flex h-[540px] w-[380px] flex-col rounded-xl border border-gray-200 bg-white shadow-2xl transition-all sm:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-black-900 px-4 py-3 text-white rounded-t-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading text-sm font-bold">JayJef AI Assistant</h3>
                  <span className="inline-block rounded bg-red-600/30 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">
                    Live DB
                  </span>
                </div>
                <p className="text-[11px] text-black-300">Stock, Price &amp; Availability Helper</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-black-300 hover:bg-black-700 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                disabled={loading}
                className="shrink-0 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-black-700 transition-colors hover:border-red-600 hover:bg-red-50 hover:text-red-600"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-red-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-black-900 rounded-bl-none border border-gray-200'
                  }`}
                >
                  {m.text}
                </div>

                {/* Product Cards in Bot Response */}
                {m.products && m.products.length > 0 && (
                  <div className="mt-2.5 w-full space-y-2">
                    {m.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-red-600 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-red-600">{p.sku}</span>
                            <Badge variant={p.is_low_stock ? 'warning' : 'success'}>
                              {p.is_low_stock ? 'Low Stock' : 'In Stock'}
                            </Badge>
                          </div>
                          <p className="mt-1 truncate font-medium text-black-900">{p.name}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-black-500">
                            <span>Qty: <strong className="text-black-900">{p.stock_quantity}</strong> {p.unit}</span>
                            <span>₱{p.selling_price.toFixed(2)}</span>
                            {p.location && <span>Loc: {p.location}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/products/${p.id}`);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-300 text-black-700 hover:border-red-600 hover:bg-red-600 hover:text-white"
                          title="View Product Details"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-black-500 bg-gray-50 px-3 py-2 rounded-lg w-max border border-gray-200">
                <Loader2 size={14} className="animate-spin text-red-600" />
                Checking inventory database...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-gray-200 bg-white p-3 rounded-b-xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about parts, stock, prices..."
              disabled={loading}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
