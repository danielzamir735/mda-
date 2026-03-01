import { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setPhone('');
    setMessage('');
    onClose();
  };

  const handleSend = () => {
    const lines: string[] = [];
    if (name.trim())    lines.push(`שם: ${name.trim()}`);
    if (phone.trim())   lines.push(`טלפון: ${phone.trim()}`);
    if (lines.length)   lines.push('');
    lines.push(message.trim());

    const subject = encodeURIComponent('משוב מעוזר חובש');
    const body    = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:ydbyd4723@gmail.com?subject=${subject}&body=${body}`;
    handleClose();
  };

  const inputCls =
    'w-full rounded-xl border border-gray-200 dark:border-emt-border bg-gray-50 dark:bg-emt-dark ' +
    'text-gray-900 dark:text-emt-light px-4 py-2.5 text-sm outline-none ' +
    'focus:border-emt-red/60 transition-colors placeholder:text-gray-400 dark:placeholder:text-emt-muted';

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-t-2xl p-5 w-full max-w-lg flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-emt-red" />
            <h2 className="text-gray-900 dark:text-emt-light font-bold text-lg">שלח משוב</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-emt-dark border border-gray-200 dark:border-emt-border
                       flex items-center justify-center active:scale-90 transition-transform
                       text-gray-500 dark:text-emt-muted"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
        </div>

        {/* Optional fields */}
        <input
          type="text"
          placeholder="שם (אופציונלי)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
        <input
          type="tel"
          placeholder="טלפון (אופציונלי)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputCls}
        />

        {/* Message — required */}
        <textarea
          placeholder="הערה / הצעה לשיפור..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className={`${inputCls} resize-none`}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-emt-border
                       text-gray-500 dark:text-emt-muted text-sm font-semibold active:scale-95 transition-transform"
          >
            ביטול
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="flex-1 py-2.5 rounded-xl bg-emt-red text-white text-sm font-bold
                       active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            שלח משוב
          </button>
        </div>
      </div>
    </div>
  );
}
