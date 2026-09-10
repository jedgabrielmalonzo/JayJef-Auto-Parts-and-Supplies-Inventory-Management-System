import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Send, Sparkles, Loader2, ArrowRight, RefreshCw, ThumbsUp, ThumbsDown, Copy, Share2, Check, User
} from 'lucide-react';
import { toast } from 'sonner';
import { sendChatMessage } from '../api/chat.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';

const SUGGESTIONS = [
  'Show all low stock items',
  'Which parts cost under ₱1,000?',
  'Is Denso Compressor in stock?',
  'List all refrigerants and prices',
  'What parts need reordering?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello, how can I assist you with JayJef auto parts inventory today?',
      products: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          text: 'Sorry, I encountered an error connecting to the inventory database.',
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id, type) => {
    setFeedback((prev) => ({ ...prev, [id]: type }));
    toast.success(`Feedback recorded: ${type}`);
  };

  const handleShare = (text) => {
    if (navigator.share) {
      navigator.share({ title: 'JayJef Assistant Answer', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Answer link copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] rounded-2xl bg-[#09090b] text-[#f4f4f5] overflow-hidden p-6 border border-[#27272a]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18181b] border border-[#27272a] text-white">
            <Sparkles size={20} className="text-red-500" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              JayJef AI Assistant
              <span className="rounded bg-red-600/30 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/30">
                Live DB
              </span>
            </h1>
            <p className="text-xs text-[#a1a1aa]">Real-time stock, pricing, and reorder assistant</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setMessages([
              {
                id: Date.now(),
                sender: 'bot',
                text: 'Conversation reset. Ask me anything about stock, prices, or SKUs!',
                products: [],
              },
            ])
          }
          className="border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
        >
          <RefreshCw size={14} /> Reset
        </Button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 text-xs border-b border-[#27272a]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] shrink-0">Suggestions:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            disabled={loading}
            className="shrink-0 rounded-full border border-[#27272a] bg-[#18181b] px-3 py-1.5 text-xs text-[#d4d4d8] transition-colors hover:border-red-500 hover:bg-red-950/40 hover:text-red-400"
          >
            {s}
          </button>
        ))}
      </div>

      {/* ChatGPT Dark Chat Feed (Matching Image 1) */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 px-2 min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Avatar Header */}
            <div className={`flex items-center gap-2 mb-1.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-white text-black'
                    : 'bg-[#27272a] text-white border border-[#3f3f46]'
                }`}
              >
                {m.sender === 'user' ? <User size={14} /> : <Bot size={15} className="text-red-400" />}
              </div>
              <span className="text-[11px] font-medium text-[#71717a]">
                {m.sender === 'user' ? 'You' : 'JayJef Assistant'}
              </span>
            </div>

            {/* Bubble (Image 1 Style) */}
            <div
              className={`max-w-[82%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md ${
                m.sender === 'user'
                  ? 'bg-[#e4e4e7] text-[#09090b] font-medium rounded-tr-sm'
                  : 'bg-[#27272a] text-[#f4f4f5] border border-[#3f3f46] rounded-tl-sm'
              }`}
            >
              {m.text}
            </div>

            {/* Product Cards in Assistant Message */}
            {m.products && m.products.length > 0 && (
              <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl">
                {m.products.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-xl border border-[#3f3f46] bg-[#18181b] p-4 shadow-sm hover:border-red-500 transition-all hover:bg-[#27272a]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-red-400">{p.sku}</span>
                        <Badge variant={p.is_low_stock ? 'warning' : 'success'}>
                          {p.is_low_stock ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </div>
                      <p className="mt-2 font-heading font-bold text-white line-clamp-1">{p.name}</p>
                      <p className="text-xs text-[#a1a1aa] mt-0.5">{p.brand} &bull; {p.category}</p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-[#27272a] flex items-center justify-between">
                      <div>
                        <span className="block text-xs text-[#a1a1aa]">
                          Stock: <strong className="text-white">{p.stock_quantity}</strong> {p.unit}
                        </span>
                        <span className="block font-heading font-bold text-white text-base">
                          ₱{p.selling_price.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/products/${p.id}`)}
                        className="gap-1 text-xs bg-[#27272a] text-white hover:bg-red-600 border border-[#3f3f46]"
                      >
                        View <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Image 1 Action Toolbar below Bot Bubble */}
            {m.sender === 'bot' && (
              <div className="flex items-center gap-2 mt-2 ml-1 text-[#71717a]">
                <button
                  onClick={() => handleSend(messages[messages.indexOf(m) - 1]?.text || 'Retry')}
                  className="rounded p-1 hover:bg-[#27272a] hover:text-white transition-colors"
                  title="Retry / Regenerate"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => handleFeedback(m.id, 'like')}
                  className={`rounded p-1 hover:bg-[#27272a] transition-colors ${
                    feedback[m.id] === 'like' ? 'text-green-400' : 'hover:text-white'
                  }`}
                  title="Good response"
                >
                  <ThumbsUp size={14} />
                </button>
                <button
                  onClick={() => handleFeedback(m.id, 'dislike')}
                  className={`rounded p-1 hover:bg-[#27272a] transition-colors ${
                    feedback[m.id] === 'dislike' ? 'text-red-400' : 'hover:text-white'
                  }`}
                  title="Poor response"
                >
                  <ThumbsDown size={14} />
                </button>
                <button
                  onClick={() => handleCopy(m.id, m.text)}
                  className="rounded p-1 hover:bg-[#27272a] hover:text-white transition-colors"
                  title="Copy text"
                >
                  {copiedId === m.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => handleShare(m.text)}
                  className="rounded p-1 hover:bg-[#27272a] hover:text-white transition-colors"
                  title="Share"
                >
                  <Share2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-[#a1a1aa] bg-[#18181b] px-4 py-3 rounded-xl w-max border border-[#27272a]">
            <Loader2 size={16} className="animate-spin text-red-500" />
            Analyzing inventory database...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dark Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-3 pt-4 border-t border-[#27272a]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message to JayJef Assistant..."
          disabled={loading}
          className="flex-1 rounded-xl border border-[#27272a] bg-[#18181b] px-4 py-3 text-sm text-white placeholder-[#71717a] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
