import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Sparkles, Loader2, ArrowRight, RefreshCw, ThumbsUp, ThumbsDown, Copy, Share2, Check, User,
  Paperclip, ArrowUp, Package, AlertTriangle, Search, Building2, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { sendChatMessage } from '../api/chat.js';
import { uploadReceipt } from '../api/ocr.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';

const QUICK_CHIPS = [
  { label: '+ Low Stock', prompt: 'Show all items that have reached or breached their low stock reorder threshold' },
  { label: '+ AC Compressors', prompt: 'List all available AC Compressors, their current stock quantity and prices' },
  { label: '+ Refrigerants', prompt: 'What refrigerant tanks (R134a, etc.) are available in stock and at what price?' },
  { label: '+ Suppliers', prompt: 'Show all active OEM suppliers and their contact persons' },
];

const HERO_CARDS = [
  {
    icon: AlertTriangle,
    iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
    title: 'Low Stock Alerts',
    description: 'Find items below reorder threshold needing purchase orders',
    prompt: 'Show all low stock items and parts that need immediate reordering',
  },
  {
    icon: Package,
    iconColor: 'text-red-600 bg-red-50 border-red-200',
    title: 'AC Compressors & Parts',
    description: 'Check stock, specifications and prices for Denso and Sanden',
    prompt: 'Check stock availability and selling price for Denso AC Compressors',
  },
  {
    icon: Search,
    iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
    title: 'Parts Under ₱1,000',
    description: 'Discover fast-moving affordable automotive maintenance supplies',
    prompt: 'Which auto parts and supplies cost under ₱1,000 in the catalog?',
  },
  {
    icon: Building2,
    iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    title: 'Supplier Catalog',
    description: 'Look up OEM suppliers, contact numbers and product lines',
    prompt: 'List all suppliers and their primary supplied part categories',
  },
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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
          text: 'Sorry, I encountered an error connecting to the inventory database. Please try again.',
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    const toastId = toast.loading('Scanning & analyzing receipt...');
    try {
      const receipt = await uploadReceipt(file);
      toast.success('Receipt scanned! Adding summary to assistant...', { id: toastId });
      handleSend(`I just uploaded receipt #${receipt.id || ''}. Please analyze the scanned items and stock availability.`);
    } catch (err) {
      toast.error(err.message || 'Error processing receipt', { id: toastId });
    } finally {
      setUploadingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  const isHeroState = messages.length === 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col min-h-0 w-full relative"
    >
      {/* Hidden File Input for Paperclip */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Ambient background red radial blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-red-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* ========================================================================= */}
      {/* 1. HERO STATE (When no messages have been sent yet)                       */}
      {/* ========================================================================= */}
      {isHeroState ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 max-w-3xl mx-auto w-full z-10">
          {/* Main Hero Headline */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-center space-y-2.5 mb-7"
          >

            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              What can I help you find today?
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
              Search live auto parts inventory, check stock levels, compare supplier pricing, and manage reorders.
            </p>
          </motion.div>

          {/* Floating v0-Style Prompt Card (JayJef Theme) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="w-full rounded-2xl bg-white border border-gray-200 p-4 shadow-xl shadow-gray-200/60 transition-all focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10"
          >
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask JayJef AI a question... (e.g. 'Do we have Denso AC Compressor in stock?' or 'Show parts under ₱1,000')"
              className="w-full resize-none bg-transparent text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none leading-relaxed"
            />

            {/* Bottom Inner Toolbar */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {/* Paperclip / File Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingReceipt}
                  title="Attach receipt photo for instant OCR & analysis"
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {uploadingReceipt ? <Loader2 size={16} className="animate-spin text-red-500" /> : <Paperclip size={16} />}
                </button>

                {/* Quick context pills */}
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleSend(chip.prompt)}
                    className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-gray-200/70 transition-colors shadow-2xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Minimalist Send Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${input.trim()
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30 hover:bg-red-700 cursor-pointer'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={16} strokeWidth={2.5} />}
              </motion.button>
            </div>
          </motion.div>

          {/* 4 Suggested Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-6"
          >
            {HERO_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSend(card.prompt)}
                  className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50/20 shadow-xs hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${card.iconColor}`}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. CHAT CONVERSATION STATE                                                */
        /* ========================================================================= */
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {/* Header Bar */}
          <div className="relative z-10 flex items-center justify-between pb-3 shrink-0 border-b border-gray-200/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs font-bold">
                <Bot size={18} />
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                  JayJef AI Assistant

                </h1>
                <p className="text-xs text-gray-500">
                  Real-time stock queries, catalog pricing, and reorder alerts
                </p>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="border-gray-200 bg-white text-gray-700 hover:bg-gray-100 gap-1.5 text-xs rounded-xl shadow-2xs font-semibold"
              >
                <RotateCcw size={13} /> New Chat
              </Button>
            </motion.div>
          </div>



          {/* Seamless Chat Feed */}
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto py-4 space-y-5 px-1 my-1">
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
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-xs ${m.sender === 'user'
                        ? 'bg-gray-900 text-white'
                        : 'bg-red-600 text-white'
                        }`}
                    >
                      {m.sender === 'user' ? <User size={13} /> : <Bot size={13} />}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {m.sender === 'user' ? 'You' : 'JayJef Assistant'}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${m.sender === 'user'
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
                        className={`rounded-md p-1.5 hover:bg-gray-100 transition-colors ${feedback[m.id] === 'like' ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' : 'hover:text-gray-800'
                          }`}
                        title="Good response"
                      >
                        <ThumbsUp size={13} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleFeedback(m.id, 'dislike')}
                        className={`rounded-md p-1.5 hover:bg-gray-100 transition-colors ${feedback[m.id] === 'dislike' ? 'text-red-600 bg-red-50 border border-red-200' : 'hover:text-gray-800'
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
                className="flex items-center gap-3 text-xs text-gray-600 bg-white px-4 py-3 rounded-2xl w-max border border-gray-200 shadow-sm"
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

          {/* Bottom Pinned Modern Floating Card Input */}
          <div className="relative z-10 pt-2 shrink-0 max-w-4xl mx-auto w-full">
            <div className="rounded-2xl bg-white border border-gray-200 p-3 shadow-lg shadow-gray-200/60 transition-all focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask follow-up question or search parts..."
                className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingReceipt}
                    title="Attach receipt photo for instant OCR & analysis"
                    className="flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {uploadingReceipt ? <Loader2 size={15} className="animate-spin text-red-500" /> : <Paperclip size={15} />}
                  </button>

                  {QUICK_CHIPS.slice(0, 3).map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleSend(chip.prompt)}
                      className="shrink-0 px-2 py-0.5 rounded-md text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-700 border border-gray-200/70 transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${input.trim()
                    ? 'bg-red-600 text-white shadow-sm hover:bg-red-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={15} strokeWidth={2.5} />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
