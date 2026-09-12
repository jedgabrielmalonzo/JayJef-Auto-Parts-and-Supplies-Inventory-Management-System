import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

function FormattedMessage({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) return <div key={lineIdx} className="h-1" />;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={lineIdx} className={line.trim().startsWith('•') ? 'pl-3 font-normal' : ''}>
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={partIdx} className="font-bold text-gray-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

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
      className="flex-1 flex flex-col min-h-0 w-full relative"
    >
      {/* Soft Ambient Red Radial Gradient Accent */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 shrink-0 border-b border-gray-200/80">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">
            AI Assistant
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time inventory lookup, pricing, and automated stock queries
          </p>
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
            className="border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 gap-1.5 text-xs rounded-xl shadow-2xs"
          >
            <RefreshCw size={13} /> Reset Chat
          </Button>
        </motion.div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto py-2.5 shrink-0 text-xs border-b border-gray-200/60 no-scrollbar">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
          Suggested:
        </span>
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSend(s)}
            disabled={loading}
            className="shrink-0 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs text-gray-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 shadow-2xs"
          >
            {s}
          </motion.button>
        ))}
      </div>

      {/* Seamless Chat Feed */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto py-4 space-y-4 px-1 my-1">
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
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {m.sender === 'user' ? <User size={14} /> : <Bot size={15} />}
                </div>
                <span className="text-[11px] font-semibold text-gray-400">
                  {m.sender === 'user' ? 'You' : 'JayJef Assistant'}
                </span>
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-tr-xs shadow-md shadow-red-600/10'
                    : 'bg-white text-gray-900 border border-gray-200/90 rounded-tl-xs shadow-xs'
                }`}
              >
                <FormattedMessage text={m.text} />
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
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-red-500 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/products/${p.id}`)}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-red-600">{p.sku}</span>
                          <Badge variant={p.is_low_stock ? 'warning' : 'success'}>
                            {p.is_low_stock ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </div>
                        <p className="mt-2 font-heading font-bold text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{p.brand} &bull; {p.category}</p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="block text-xs text-gray-500">
                            Stock: <strong className="text-gray-900">{p.stock_quantity}</strong> {p.unit}
                          </span>
                          <span className="block font-heading font-bold text-gray-900 text-base">
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
                          className="gap-1 text-xs bg-gray-900 text-white hover:bg-red-600 rounded-lg shadow-xs"
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
                <div className="flex items-center gap-1.5 mt-2 ml-1 text-gray-400">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleSend(messages[messages.indexOf(m) - 1]?.text || 'Retry')}
                    className="rounded-md p-1.5 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    title="Retry / Regenerate"
                  >
                    <RefreshCw size={13} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleFeedback(m.id, 'like')}
                    className={`rounded-md p-1.5 hover:bg-gray-100 transition-colors ${
                      feedback[m.id] === 'like' ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' : 'hover:text-gray-800'
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp size={13} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleFeedback(m.id, 'dislike')}
                    className={`rounded-md p-1.5 hover:bg-gray-100 transition-colors ${
                      feedback[m.id] === 'dislike' ? 'text-red-600 bg-red-50 border border-red-200' : 'hover:text-gray-800'
                    }`}
                    title="Poor response"
                  >
                    <ThumbsDown size={13} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleCopy(m.id, m.text)}
                    className="rounded-md p-1.5 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    title="Copy text"
                  >
                    {copiedId === m.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleShare(m.text)}
                    className="rounded-md p-1.5 hover:bg-gray-100 hover:text-gray-800 transition-colors"
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
            className="flex items-center gap-3 text-xs text-gray-600 bg-white px-4 py-3 rounded-xl w-max border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: dot * 0.15 }}
                  className="h-2 w-2 rounded-full bg-red-600"
                />
              ))}
            </div>
            <span>Analyzing inventory database...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Light Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative z-10 flex items-center gap-3 pt-2 shrink-0 border-t border-gray-200/80"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask JayJef Assistant (e.g. 'Show stock for Denso Compressor' or 'Parts under ₱500')..."
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 transition-all shadow-2xs"
        />
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 shadow-md shadow-red-600/20"
          >
            <Send size={16} />
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}


