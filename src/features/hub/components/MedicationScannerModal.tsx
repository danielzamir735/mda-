import { useRef, useState } from 'react';
import { X, Camera, Image, Search, Scan, AlertCircle, RotateCcw } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

const SYSTEM_PROMPT =
  'אתה סוכן AI רפואי מומחה. תפקידך לזהות תרופות מתמונה או מטקסט ולספק מידע מדויק על בסיס נתונים רשמיים כמו Infomed בלבד.\n' +
  'חוקי ברזל חמורים:\n' +
  '1. ודאות: אם רמת הוודאות בזיהוי היא מתחת ל-90%, אל תנחש! כתוב: "הזיהוי אינו ודאי מספיק, אנא ספק תמונה ברורה יותר או הקלד את השם".\n' +
  '2. שמות: בדוק תמיד שם עברי ולועזי. התגבר על שגיאות כתיב נפוצות, אך אם יש ספק בין שתי תרופות דומות (כמו ליטורבה/ליפיטור), שאל את המשתמש למה התכוון.\n' +
  '3. איסור המצאות: אסור להשלים מידע מהיגיון. אם פרט חסר, כתוב בדיוק: "המידע אינו זמין לי".\n' +
  '4. מינון: ציין תמיד "מינון מקובל". אסור לתת הנחיה רפואית אישית. הוסף אזהרה שמינון נקבע רק ע"י רופא.\n' +
  '5. זיהוי תמונה: התעלם מטקסטים קטנים, התמקד בשם המסחרי הגדול. אם מטושטש, בקש תמונה חדשה.\n' +
  '6. אזהרות: הוסף תמיד אזהרה לא לשלב תרופות ללא ייעוץ, ולפנות לרופא במקרה חריג.\n\n' +
  'מבנה התשובה חייב להיות קבוע (השתמש ב-Markdown):\n' +
  '**שם מסחרי:**\n' +
  '**שם גנרי:**\n' +
  '**למה מיועדת:**\n' +
  '**מינון מקובל:**\n' +
  '**התוויות נגד ואזהרות:**';

type State = 'idle' | 'loading' | 'result' | 'error';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to convert file to base64 — dataUrl was malformed'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('FileReader error: ' + reader.error?.message));
    reader.readAsDataURL(file);
  });
}

/** Minimal markdown → readable text: bold (**text**), bullets, newlines */
function renderResult(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;

    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      return (
        <div key={i} className="flex gap-2 text-sm text-emt-muted leading-relaxed">
          <span className="text-teal-400 mt-0.5 shrink-0">•</span>
          <span>{parts}</span>
        </div>
      );
    }

    if (trimmed.startsWith('#') || (trimmed.endsWith(':') && trimmed.length < 60)) {
      const heading = trimmed.replace(/^#+\s*/, '');
      return (
        <p key={i} className="text-sm font-bold text-teal-400 mt-3 mb-0.5">{heading}</p>
      );
    }

    return (
      <p key={i} className="text-sm text-emt-muted leading-relaxed">{parts}</p>
    );
  });
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicationScannerModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const [state, setState] = useState<State>('idle');
  const [resultText, setResultText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [textQuery, setTextQuery] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setState('idle');
    setResultText('');
    setErrorMessage('');
    setPreview(null);
    setTextQuery('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  function getModel() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not defined in .env');
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  const handleTextSearch = async () => {
    const query = textQuery.trim();
    if (!query) return;

    setState('loading');
    setResultText('');
    setErrorMessage('');
    setPreview(null);

    try {
      const model = getModel();
      const result = await model.generateContent(
        SYSTEM_PROMPT + '\n\nהתרופה המבוקשת: ' + query
      );
      setResultText(result.response.text());
      setState('result');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setState('loading');
    setResultText('');
    setErrorMessage('');

    try {
      const model = getModel();

      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      const imagePart = {
        inlineData: {
          mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          data: base64,
        },
      };

      const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
      setResultText(result.response.text());
      setState('result');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-emt-dark overflow-hidden">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <div className="flex items-center gap-2">
          <Scan size={22} className="text-teal-400" />
          <h2 className="text-emt-light font-bold text-xl">זיהוי תרופות חכם (AI)</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-emt-muted hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Text search */}
        <div className="flex gap-2">
          <input
            type="text"
            value={textQuery}
            onChange={e => setTextQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTextSearch()}
            placeholder="הקלד שם תרופה..."
            disabled={state === 'loading'}
            dir="rtl"
            className="flex-1 rounded-2xl bg-emt-gray border border-emt-border px-4 py-3
                       text-emt-light placeholder:text-emt-muted text-sm
                       focus:outline-none focus:border-teal-400/60
                       disabled:opacity-50"
          />
          <button
            onClick={handleTextSearch}
            disabled={state === 'loading' || !textQuery.trim()}
            className="w-12 h-12 rounded-2xl bg-teal-400/15 border border-teal-400/40
                       flex items-center justify-center shrink-0
                       active:scale-90 transition-transform
                       disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="חפש"
          >
            <Search size={20} className="text-teal-400" />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-emt-border" />
          <span className="text-emt-muted text-xs">או</span>
          <div className="flex-1 h-px bg-emt-border" />
        </div>

        {/* Camera + Gallery buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={state === 'loading'}
            className="flex flex-col items-center justify-center gap-2
                       rounded-3xl border-2 border-dashed border-teal-400/50 bg-teal-400/5
                       py-7 active:scale-95 transition-transform
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 rounded-full bg-teal-400/15 flex items-center justify-center">
              <Camera size={28} className="text-teal-400" />
            </div>
            <span className="text-teal-400 font-black text-base tracking-tight">מצלמה</span>
            <span className="text-emt-muted text-xs text-center px-2">צלם את התרופה</span>
          </button>

          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={state === 'loading'}
            className="flex flex-col items-center justify-center gap-2
                       rounded-3xl border-2 border-dashed border-purple-400/50 bg-purple-400/5
                       py-7 active:scale-95 transition-transform
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 rounded-full bg-purple-400/15 flex items-center justify-center">
              <Image size={28} className="text-purple-400" />
            </div>
            <span className="text-purple-400 font-black text-base tracking-tight">גלריה</span>
            <span className="text-emt-muted text-xs text-center px-2">בחר מהתמונות</span>
          </button>
        </div>

        {/* Preview thumbnail */}
        {preview && (
          <div className="flex justify-center">
            <img
              src={preview}
              alt="תמונת התרופה"
              className="w-40 h-40 object-cover rounded-2xl border border-emt-border shadow-md"
            />
          </div>
        )}

        {/* Loading */}
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 border-4 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            <p className="text-emt-muted text-base font-semibold">מפענח...</p>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="rounded-2xl border border-emt-red/30 bg-emt-red/10 p-4 flex flex-col items-center gap-3 text-center">
            <AlertCircle size={32} className="text-emt-red" />
            <p className="text-emt-red font-bold text-base">שגיאה בזיהוי</p>
            {errorMessage && (
              <p className="text-emt-muted text-xs font-mono break-all bg-black/30 rounded-xl px-3 py-2 w-full text-right" dir="ltr">
                {errorMessage}
              </p>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-emt-red/20 text-emt-red font-bold text-sm active:scale-95 transition-transform"
            >
              <RotateCcw size={16} />
              נסה שוב
            </button>
          </div>
        )}

        {/* Result */}
        {state === 'result' && resultText && (
          <div className="rounded-2xl border border-teal-400/30 bg-teal-400/5 p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Scan size={16} className="text-teal-400" />
                <span className="text-teal-400 font-black text-sm uppercase tracking-wider">תוצאות הזיהוי</span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emt-gray border border-emt-border text-emt-muted text-xs font-bold active:scale-95 transition-transform"
              >
                <RotateCcw size={12} />
                חפש שוב
              </button>
            </div>
            <div className="space-y-0.5">
              {renderResult(resultText)}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-emt-muted px-4 leading-relaxed">
          המידע מסופק על ידי AI ואינו מהווה המלצה רפואית. לתמיד התייעץ עם גורם מוסמך.
        </p>
      </div>
    </div>
  );
}
