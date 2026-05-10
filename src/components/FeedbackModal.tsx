import { useState } from 'react';
import { X, MessageSquare, Info, Send, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'sending' | 'success' | 'error';

interface Errors {
  name?: string;
  phone?: string;
  message?: string;
}

export default function FeedbackModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});

  if (!isOpen) return null;

  const handleClose = () => {
    if (status === 'sending') return;
    setName('');
    setPhone('');
    setMessage('');
    setStatus('idle');
    setErrors({});
    onClose();
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'נא למלא שם מלא';
    if (!phone.trim()) e.phone = 'נא למלא מספר טלפון';
    if (!message.trim()) e.message = 'נא למלא הודעה';
    return e;
  };

  const handleSend = async () => {
    if (status === 'sending') return;

    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const lines: string[] = [];
    lines.push(`שם: ${name.trim()}`);
    lines.push(`טלפון: ${phone.trim()}`);
    lines.push('');
    lines.push(message.trim());

    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: lines.join('\n') }),
      });
      if (!res.ok) throw new Error('send failed');
      setStatus('success');
      setTimeout(handleClose, 1800);
    } catch {
      setStatus('error');
    }
  };

  const inputCls = (hasError: boolean) =>
    'w-full rounded-xl border bg-gray-50 dark:bg-emt-dark ' +
    'text-gray-900 dark:text-emt-light px-4 py-2.5 text-sm outline-none transition-colors ' +
    'placeholder:text-gray-400 dark:placeholder:text-emt-muted ' +
    (hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-gray-200 dark:border-emt-border focus:border-emt-red/60');

  const RequiredLabel = ({ children }: { children: string }) => (
    <label className="text-sm font-semibold text-gray-700 dark:text-emt-light flex items-center gap-1">
      {children}
      <span className="text-red-500">*</span>
    </label>
  );

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-red-500 text-xs mt-1 pr-1">{msg}</p> : null;

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
            disabled={status === 'sending'}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-emt-dark border border-gray-200 dark:border-emt-border
                       flex items-center justify-center active:scale-90 transition-transform
                       text-gray-500 dark:text-emt-muted disabled:opacity-40"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
        </div>

        {/* Beta notice */}
        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-4 py-3">
          <Info size={16} className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
            האפליקציה עדיין בשלבי פיתוח ושיפור. נשמח מאוד לשמוע מכם כל הערה, הצעת ייעול, או דיווח על תקלה כדי שנוכל להמשיך להשתפר!
          </p>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle size={44} className="text-emt-green" />
            <p className="text-gray-900 dark:text-emt-light font-semibold text-base">המשוב נשלח בהצלחה!</p>
            <p className="text-gray-500 dark:text-emt-muted text-sm">תודה רבה על הפידבק 🙏</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <RequiredLabel>שם מלא</RequiredLabel>
              <input
                type="text"
                placeholder="ישראל ישראלי"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                disabled={status === 'sending'}
                className={inputCls(!!errors.name)}
              />
              <FieldError msg={errors.name} />
            </div>

            <div className="flex flex-col gap-0.5">
              <RequiredLabel>טלפון</RequiredLabel>
              <input
                type="tel"
                dir="rtl"
                placeholder="050-0000000"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: undefined })); }}
                disabled={status === 'sending'}
                className={`${inputCls(!!errors.phone)} text-right`}
              />
              <FieldError msg={errors.phone} />
            </div>

            <div className="flex flex-col gap-0.5">
              <RequiredLabel>הודעה</RequiredLabel>
              <textarea
                placeholder="הערה / הצעה לשיפור..."
                value={message}
                onChange={(e) => { setMessage(e.target.value); setErrors(prev => ({ ...prev, message: undefined })); }}
                rows={4}
                disabled={status === 'sending'}
                className={`${inputCls(!!errors.message)} resize-none`}
              />
              <FieldError msg={errors.message} />
            </div>

            {/* Error */}
            {status === 'error' && (
              <p className="text-red-500 text-sm text-center">שליחה נכשלה. נסה שוב.</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={status === 'sending'}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-emt-border
                           text-gray-500 dark:text-emt-muted text-sm font-semibold active:scale-95
                           transition-transform disabled:opacity-40"
              >
                ביטול
              </button>
              <button
                onClick={handleSend}
                disabled={status === 'sending'}
                className="flex-1 py-2.5 rounded-xl bg-emt-red text-white text-sm font-bold
                           active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {status === 'sending' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {status === 'sending' ? 'שולח...' : 'שלח משוב'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
