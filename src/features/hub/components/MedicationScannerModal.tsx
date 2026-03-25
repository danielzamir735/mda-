import { useRef, useState } from 'react';
import { X, Camera, Scan, AlertCircle, RotateCcw } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

const HEBREW_PROMPT =
  'אתה עוזר פרמדיק בישראל. הסתכל על התמונה של התרופה או המרשם. החזר לי את המידע הבא בעברית פשוטה וברורה: שם מסחרי, שם גנרי, למה התרופה מיועדת, מינונים נפוצים, ותופעות לוואי או התוויות נגד קריטיות שחובש חייב לדעת. אל תמציא מידע. אם אינך מזהה, ציין זאת.';

type State = 'idle' | 'loading' | 'result' | 'error';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — Gemini wants raw base64
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Minimal markdown → readable text: bold (**text**), bullets, newlines */
function renderResult(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;

    // Convert **bold** spans inline
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    // Bullet lines
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      return (
        <div key={i} className="flex gap-2 text-sm text-emt-muted leading-relaxed">
          <span className="text-teal-400 mt-0.5 shrink-0">•</span>
          <span>{parts}</span>
        </div>
      );
    }

    // Section headings (lines ending with : or starting with #)
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
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setState('idle');
    setResultText('');
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    setPreview(URL.createObjectURL(file));
    setState('loading');
    setResultText('');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
      if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set');

      const base64 = await fileToBase64(file);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent([
        { inlineData: { mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp', data: base64 } },
        { text: HEBREW_PROMPT },
      ]);

      const text = result.response.text();
      setResultText(text);
      setState('result');
    } catch {
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

        {/* Camera trigger — always visible */}
        <div className="flex flex-col items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => inputRef.current?.click()}
            disabled={state === 'loading'}
            className="w-full flex flex-col items-center justify-center gap-3
                       rounded-3xl border-2 border-dashed border-teal-400/50 bg-teal-400/5
                       py-10 active:scale-95 transition-transform
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-20 h-20 rounded-full bg-teal-400/15 flex items-center justify-center">
              <Camera size={40} className="text-teal-400" />
            </div>
            <span className="text-teal-400 font-black text-xl tracking-tight">צלם תרופה</span>
            <span className="text-emt-muted text-sm">לחץ לצילום עם המצלמה או העלאת תמונה</span>
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
            <p className="text-emt-muted text-base font-semibold">מפענח את התמונה...</p>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="rounded-2xl border border-emt-red/30 bg-emt-red/10 p-4 flex flex-col items-center gap-3 text-center">
            <AlertCircle size={32} className="text-emt-red" />
            <p className="text-emt-red font-bold text-base">שגיאה בזיהוי, נסה לצלם שוב</p>
            <p className="text-emt-muted text-sm">ודא שהתמונה ברורה ומוארת היטב</p>
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
                סרוק שוב
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
