import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Sparkles, Loader2, ArrowRight, RefreshCw, ThumbsUp, ThumbsDown, Copy, Share2, Check, User, Zap
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

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const messageVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 350, damping: 25 },
  },
};

const productCardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.08, type: 'spring', stiffness: 300, damping: 22 },
  }),
};

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am your JayJef AI Assistant. Ask me anything about stock availability, pricing, reorder alerts, or product SKUs!',
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
  }, [messages, loading]);

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-[calc(100vh-3.5rem)] rounded-2xl bg-[#09090b] text-[#f4f4f5] overflow-hidden p-4 sm:p-6 border border-[#27272a] shadow-2xl relative"
    >
      {/* Dynamic Background Glow Effect */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[#27272a]">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.05 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-900/30 border border-red-500/30"
          >
            <Sparkles size={20} className="text-white" />
          </motion.div>
          <div>
            <h1 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              JayJef AI Assistant
              <motion.span
                initial={{ scale: 0.9 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/40"
              >
                <Zap size={10} className="fill-red-400" /> Live DB
              </motion.span>
            </h1>
            <p className="text-xs text-[#a1a1aa]">Real-time inventory lookup, pricing, &amp; automated stock query</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
            className="border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white gap-1.5 text-xs rounded-xl"
          >
            <RefreshCw size={13} /> Reset Chat
          </Button>
        </motion.div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto py-3 text-xs border-b border-[#27272a] no-scrollbar">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] shrink-0">
          Suggested:
        </span>
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s}
            whileHover={{ scale: 1.04, y: -1, backgroundColor: '#27272a' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSend(s)}
            disabled={loading}
            className="shrink-0 rounded-full border border-[#27272a] bg-[#18181b] px-3.5 py-1.5 text-xs text-[#d4d4d8] transition-colors hover:border-red-500/60 hover:text-white"
          >
            {s}
          </motion.button>
        ))}
      </div>

      {/* ChatGPT Dark Chat Feed */}
      <div className="relative z-10 flex-1 overflow-y-auto py-6 space-y-6 px-1 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10 }}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Avatar Header */}
              <div className={`flex items-center gap-2 mb-1.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-md ${
                    m.sender === 'user'
                      ? 'bg-white text-black'
                      : 'bg-gradient-to-br from-red-600 to-red-900 text-white border border-red-500/40'
                  }`}
                >
                  {m.sender === 'user' ? <User size={14} /> : <Bot size={15} />}
                </div>
                <span className="text-[11px] font-medium text-[#71717a]">
                  {m.sender === 'user' ? 'You' : 'JayJef Assistant'}
                </span>
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-gray-100 to-white text-[#09090b] font-medium rounded-tr-sm'
                    : 'bg-[#1c1c20] text-[#f4f4f5] border border-[#2d2d32] rounded-tl-sm'
                }`}
              >
                {m.text}
              </div>

              {/* Product Cards in Assistant Message */}
              {m.products && m.products.length > 0 && (
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl">
                  {m.products.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      custom={idx}
                      variants={productCardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ y: -4, scale: 1.02, borderColor: '#ef4444' }}
                      className="flex flex-col justify-between rounded-xl border border-[#2d2d32] bg-[#141417] p-4 shadow-lg transition-colors cursor-pointer"
                      onClick={() => navigate(`/products/${p.id}`)}
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
                            ₱{Number(p.selling_price || 0).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${p.id}`);
                          }}
                          className="gap-1 text-xs bg-[#27272a] text-white hover:bg-red-600 border border-[#3f3f46] rounded-lg"
                        >
                          View <ArrowRight size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Action Toolbar below Bot Bubble */}
              {m.sender === 'bot' && (
                <div className="flex items-center gap-1.5 mt-2 ml-1 text-[#71717a]">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleSend(messages[messages.indexOf(m) - 1]?.text || 'Retry')}
                    className="rounded-md p-1.5 hover:bg-[#27272a] hover:text-white transition-colors"
                    title="Retry / Regenerate"
                  >
                    <RefreshCw size={13} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleFeedback(m.id, 'like')}
                    className={`rounded-md p-1.5 hover:bg-[#27272a] transition-colors ${
                      feedback[m.id] === 'like' ? 'text-green-400 bg-green-950/40 border border-green-800/40' : 'hover:text-white'
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp size={13} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleFeedback(m.id, 'dislike')}
                    className={`rounded-md p-1.5 hover:bg-[#27272a] transition-colors ${
                      feedback[m.id] === 'dislike' ? 'text-red-400 bg-red-950/40 border border-red-800/40' : 'hover:text-white'
                    }`}
                    title="Poor response"
                  >
                    <ThumbsDown size={13} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleCopy(m.id, m.text)}
                    className="rounded-md p-1.5 hover:bg-[#27272a] hover:text-white transition-colors"
                    title="Copy text"
                  >
                    {copiedId === m.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleShare(m.text)}
                    className="rounded-md p-1.5 hover:bg-[#27272a] hover:text-white transition-colors"
                    title="Share"
                  >
                    <Share2 size={13} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 text-xs text-[#a1a1aa] bg-[#18181b] px-4 py-3 rounded-xl w-max border border-[#27272a] shadow-lg"
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: dot * 0.15 }}
                  className="h-2 w-2 rounded-full bg-red-500"
                />
              ))}
            </div>
            <span>Analyzing inventory database...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dark Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative z-10 flex items-center gap-3 pt-4 border-t border-[#27272a]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask JayJef Assistant (e.g. 'Show stock for Denso Compressor' or 'Parts under ₱500')..."
          disabled={loading}
          className="flex-1 rounded-xl border border-[#27272a] bg-[#141417] px-4 py-3 text-sm text-white placeholder-[#71717a] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
        />
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 shadow-md shadow-red-950"
          >
            <Send size={16} />
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}

