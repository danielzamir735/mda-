import { useRef, useState, useEffect } from 'react';
import { X, Camera, Image, Search, Scan, AlertCircle, RotateCcw, Clock, ChevronDown, Cpu, Database, FileEdit } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';

const SYSTEM_PROMPT =
  'אתה סוכן AI רפואי מקצועי. תפקידך לזהות תרופות מתמונה או טקסט.\n' +
  'חובה עליך להחזיר את התשובה *אך ורק* במבנה המדויק הבא, ללא הקדמות וללא סיכומים מיותרים. השתמש בנקודות (bullets) היכן שמופיע בדוגמה.\n\n' +
  'תבנית חובה (דוגמה על אופטלגין, החלף את המידע בהתאם לתרופה שזוהתה):\n\n' +
  'שם מסחרי: אופטלגין (Optalgin)\n' +
  'שם גנרי: מטאמיזול (Metamizole / Dipyrone)\n\n' +
  'למה התרופה מיועדת:\n' +
  '* שיכוך כאבים (כאב ראש, שיניים, כאבי שרירים וכו\')\n' +
  '* הורדת חום\n' +
  '* לעיתים גם לכאבים חזקים יותר כשמשככי כאבים רגילים לא מספיקים\n\n' +
  'מינון מקובל (כללי):\n' +
  '* מבוגרים: בדרך כלל 500–1000 מ״ג בכל פעם\n' +
  '* ניתן לקחת עד 3–4 פעמים ביום לפי הצורך\n' +
  '⚠️ לא לעבור מינון יומי מקסימלי ולהתייעץ עם רופא/רוקח\n\n' +
  'התוויות נגד:\n' +
  '* רגישות לחומר הפעיל או לתרופות דומות\n' +
  '* היסטוריה של בעיות דם (אגרנולוציטוזיס)\n' +
  '* בעיות חמורות במח העצם\n' +
  '* יש להיזהר במחלות כבד או כליה\n' +
  '* לא מומלץ לשימוש ממושך ללא מעקב רפואי\n\n' +
  '❗ חשוב לדעת:\n' +
  '[משפט אחד או שניים על אזהרה קריטית או תופעת לוואי חריגה שחובה לשים לב אליה].\n\n' +
  'אם אתה רוצה, אפשר להשוות אותה לתרופות מקבילות או לבדוק התאמה למצב מסוים 👍';

const LOADING_STEPS = [
  { text: 'מעבד תמונה...', Icon: Image },
  { text: 'מחלץ נתונים...', Icon: Cpu },
  { text: 'בודק במאגרי מידע...', Icon: Database },
  { text: 'מכין סיכום...', Icon: FileEdit },
];

const HISTORY_KEY = 'med-scanner-history';

type State = 'idle' | 'loading' | 'result' | 'error';

interface HistoryItem {
  id: string;
  query: string;
  result: string;
  timestamp: number;
}

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function extractMedName(result: string): string {
  const match = result.match(/(?:\*\*)?שם מסחרי:(?:\*\*)?\s*(.+)/);
  return match?.[1]?.trim().replace(/\*\*/g, '') || 'תרופה זוהתה';
}

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

  const [preview, setPreview] = useState<string | null>(null);
  const [textQuery, setTextQuery] = useState('');

  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>(loadHistory);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Cycle loading steps every 3.5 s
  useEffect(() => {
    if (state !== 'loading') return;
    setLoadingPhraseIndex(0);
    const interval = setInterval(() => {
      setLoadingPhraseIndex(i => (i + 1) % LOADING_STEPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [state]);

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory));
  }, [searchHistory]);

  if (!isOpen) return null;

  const handleReset = () => {
    setState('idle');
    setResultText('');

    setPreview(null);
    setTextQuery('');
    setLoadingPhraseIndex(0);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  function getModel() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not defined in .env');
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  function saveToHistory(query: string, result: string) {
    const item: HistoryItem = {
      id: Date.now().toString(),
      query,
      result,
      timestamp: Date.now(),
    };
    setSearchHistory(prev => [item, ...prev.slice(0, 19)]);
  }

  const handleTextSearch = async () => {
    const query = textQuery.trim();
    if (!query) return;

    setState('loading');
    setResultText('');
    setPreview(null);
    trackEvent('med_scan_text', { query_length: query.length });

    try {
      const model = getModel();
      const result = await model.generateContent(
        SYSTEM_PROMPT + '\n\nהתרופה המבוקשת: ' + query
      );
      const text = result.response.text();
      setResultText(text);
      setState('result');
      saveToHistory(query, text);
    } catch (err) {
      console.error('[MedicationScannerModal] Text search API error:', err);
      setState('error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setState('loading');
    setResultText('');
    trackEvent('med_scan_photo');


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
      const text = result.response.text();
      setResultText(text);
      setState('result');
      saveToHistory(extractMedName(text), text);
    } catch (err) {
      console.error('[MedicationScannerModal] Image scan API error:', err);
      setState('error');
    }
  };

  const handleHistoryItemClick = (item: HistoryItem) => {
    setResultText(item.result);
    setPreview(null);
    setState('result');
    setHistoryExpanded(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-emt-dark overflow-hidden">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <div className="flex items-center gap-2">
          <Scan size={22} className="text-teal-400" />
          <h2 className="text-emt-light font-bold text-xl">מידע על תרופות</h2>
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

        {/* Loading — cycling steps with icon */}
        {state === 'loading' && (() => {
          const { text, Icon: StepIcon } = LOADING_STEPS[loadingPhraseIndex];
          return (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 border-4 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
              <div
                key={loadingPhraseIndex}
                className="flex flex-col items-center gap-2"
                style={{ animation: 'fadeIn 0.4s ease' }}
              >
                <div className="w-12 h-12 rounded-full bg-teal-400/10 flex items-center justify-center">
                  <StepIcon size={24} className="text-teal-400" />
                </div>
                <p className="text-teal-300 text-base font-semibold">{text}</p>
              </div>
              <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </div>
          );
        })()}

        {/* Error */}
        {state === 'error' && (
          <div className="rounded-2xl border border-emt-yellow/30 bg-emt-yellow/10 p-4 flex flex-col items-center gap-3 text-center">
            <AlertCircle size={32} className="text-emt-yellow" />
            <p className="text-emt-yellow font-bold text-base">שגיאה בטעינת המידע</p>
            <p className="text-emt-muted text-sm">לא ניתן היה לאחזר את המידע. אנא בדוק חיבור לאינטרנט ונסה שוב.</p>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-emt-yellow/20 text-emt-yellow font-bold text-sm active:scale-95 transition-transform"
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

        {/* ── Search History ───────────────────────────────────────────── */}
        {searchHistory.length > 0 && (
          <div className="rounded-2xl border border-emt-border bg-emt-gray/50 overflow-hidden">
            {/* History header — collapsible */}
            <button
              onClick={() => setHistoryExpanded(e => !e)}
              className="w-full flex items-center justify-between px-4 py-3 active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-purple-400" />
                <span className="text-purple-300 font-bold text-sm">היסטוריית חיפושים</span>
                <span className="text-emt-muted text-xs bg-emt-border rounded-full px-2 py-0.5">
                  {searchHistory.length}
                </span>
              </div>
              <ChevronDown
                size={16}
                className="text-emt-muted transition-transform duration-200"
                style={{ transform: historyExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {/* History list */}
            {historyExpanded && (
              <div className="border-t border-emt-border">
                {/* Search filter */}
                <div className="px-3 py-2 border-b border-emt-border/50">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="חפש בהיסטוריה..."
                    dir="rtl"
                    className="w-full rounded-xl bg-emt-dark border border-emt-border px-3 py-2
                               text-emt-light placeholder:text-emt-muted text-xs
                               focus:outline-none focus:border-teal-400/60"
                  />
                </div>
                <div className="divide-y divide-emt-border/50">
                  {searchHistory
                    .filter(item => {
                      if (!historySearch.trim()) return true;
                      const name = extractMedName(item.result).toLowerCase();
                      return name.includes(historySearch.trim().toLowerCase());
                    })
                    .map(item => {
                      const d = new Date(item.timestamp);
                      const formatted =
                        d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                        ' ' +
                        d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleHistoryItemClick(item)}
                          className="w-full flex items-center justify-between px-4 py-3 text-right
                                     hover:bg-white/5 active:bg-white/10 transition-colors"
                        >
                          <span className="text-emt-light text-sm font-semibold truncate flex-1 min-w-0">
                            {extractMedName(item.result)}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 mr-3">
                            <span className="text-emt-muted text-xs">{formatted}</span>
                            <Scan size={12} className="text-teal-400/60" />
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-emt-muted px-4 leading-relaxed">
          המידע מסופק על ידי AI ואינו מהווה המלצה רפואית. יש להיוועץ תמיד עם גורם מוסמך.
        </p>
      </div>
    </div>
  );
}
