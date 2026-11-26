import { useState } from 'react';
import { X, MessageSquare, Info, Send, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

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
  const t = useTranslation();
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
    if (!name.trim()) e.name = t('obFbNameErr');
    if (!phone.trim()) e.phone = t('obFbPhoneErr');
    if (!message.trim()) e.message = t('obFbMessageErr');
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
    // i18n-ok: the message goes to the developers' inbox, which is in Hebrew
    lines.push(`שם: ${name.trim()}`);
    // i18n-ok: as above
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
    'w-full rounded-xl border bg-page ' +
    'text-fg px-4 py-2.5 text-sm outline-none transition-colors ' +
    'placeholder:text-fg-subtle ' +
    (hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-line focus:border-emt-red/60');

  const RequiredLabel = ({ children }: { children: string }) => (
    <label className="text-sm font-semibold text-fg/85 flex items-center gap-1">
      {children}
      <span className="text-red-700 dark:text-red-500">*</span>
    </label>
  );

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-red-700 dark:text-red-500 text-xs mt-1 pe-1">{msg}</p> : null;

  return (
    // theme-ok: the dim backdrop behind a pop-up stays dark in both modes
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-line rounded-t-2xl p-5 w-full max-w-lg flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-emt-red" />
            <h2 className="text-fg font-bold text-lg">{t('obFbTitle')}</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={status === 'sending'}
            className="w-9 h-9 rounded-full bg-surface-2 border border-line
                       flex items-center justify-center active:scale-90 transition-transform
                       text-fg-muted disabled:opacity-40"
            aria-label={t('close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Beta notice */}
        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-4 py-3">
          <Info size={16} className="text-blue-700 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
            {t('obFbBeta')}
          </p>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle size={44} className="text-emt-green" />
            <p className="text-fg font-semibold text-base">{t('obFbSent')}</p>
            <p className="text-fg-muted text-sm">{t('obFbThanks')}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <RequiredLabel>{t('obFbName')}</RequiredLabel>
              <input
                type="text"
                placeholder={t('obFbNamePh')}
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                disabled={status === 'sending'}
                className={inputCls(!!errors.name)}
              />
              <FieldError msg={errors.name} />
            </div>

            <div className="flex flex-col gap-0.5">
              <RequiredLabel>{t('obFbPhone')}</RequiredLabel>
              <input
                type="tel"
                dir="ltr"
                placeholder="050-0000000"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: undefined })); }}
                disabled={status === 'sending'}
                className={`${inputCls(!!errors.phone)} text-start rtl:text-right`}
              />
              <FieldError msg={errors.phone} />
            </div>

            <div className="flex flex-col gap-0.5">
              <RequiredLabel>{t('obFbMessage')}</RequiredLabel>
              <textarea
                placeholder={t('obFbMessagePh')}
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
              <p className="text-red-700 dark:text-red-500 text-sm text-center">{t('obFbFailed')}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={status === 'sending'}
                className="flex-1 py-2.5 rounded-xl border border-line
                           text-fg-muted text-sm font-semibold active:scale-95
                           transition-transform disabled:opacity-40"
              >
                {t('cancel')}
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
                {status === 'sending' ? t('obFbSending') : t('obFbTitle')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
