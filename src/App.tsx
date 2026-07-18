import { useState, useEffect } from 'react';
import { Loader2, Rocket, FileText, Youtube, UploadCloud, Volume2, Square, Share2, Copy, Check, Sun, Moon, Monitor, Code2, Link2, Send, Clock, Play, Pause, Star, BookOpen, HelpCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';

const activityData = [
  { day: 'M', quizzes: 2 },
  { day: 'T', quizzes: 3 },
  { day: 'W', quizzes: 1 },
  { day: 'T', quizzes: 4 },
  { day: 'F', quizzes: 5 },
  { day: 'S', quizzes: 2 },
  { day: 'S', quizzes: 4 },
];

type ResultData = {
  breakdown: {title: string, content: string}[];
  quiz?: {difficulty: string, question: string, options: string[], correctAnswer: string, explanation: string}[];
  flashcards?: {term: string, definition: string}[];
  conceptMap?: {prerequisite: string, current: string, next: string};
  correctedCode?: string;
} | null;

function QuizQuestion({ q, idx }: { q: any, idx: number }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [confidence, setConfidence] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const isOptionCorrect = (optText: string, optionIndex: number) => {
    const ans = q.correctAnswer?.trim();
    if (!ans) return false;
    if (optText.trim() === ans) return true;
    if (optText.trim().startsWith(ans)) return true;
    if (ans.length === 1 && /^[A-D]$/i.test(ans)) {
      const letterIndex = ans.toUpperCase().charCodeAt(0) - 65;
      if (letterIndex === optionIndex) return true;
    }
    if (optText.toLowerCase().includes(ans.toLowerCase()) || ans.toLowerCase().includes(optText.toLowerCase())) return true;
    return false;
  };

  const getCorrectIndex = () => {
    if (!q.options) return -1;
    for (let i = 0; i < q.options.length; i++) {
      if (isOptionCorrect(q.options[i], i)) return i;
    }
    const ans = q.correctAnswer?.trim().toUpperCase();
    if (ans && ans.length === 1 && ans >= 'A' && ans <= 'D') {
      return ans.charCodeAt(0) - 65;
    }
    return -1;
  };

  const correctIndex = getCorrectIndex();

  const handleSelectOption = (i: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(i);
    setShowAnswer(true);
  };

  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
      <div className="absolute top-4 right-4">
        <span className={`px-2 py-1 border text-[10px] font-bold rounded shadow-sm ${
          q.difficulty?.toLowerCase() === 'hard' ? 'bg-rose-50 border-rose-200 text-rose-600' :
          q.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-600' :
          'bg-emerald-50 border-emerald-200 text-emerald-600'
        }`}>
          {q.difficulty?.toUpperCase() || 'EASY'}
        </span>
      </div>
      <p className="font-bold text-slate-800 dark:text-slate-100 mb-4 text-base sm:text-lg pr-16 leading-snug">Q{idx + 1}. {q.question}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {q.options?.map((opt: string, i: number) => {
          let optionStyles = "w-full text-left p-4 rounded-xl border transition-all text-sm font-medium ";
          
          if (selectedIdx === null) {
            optionStyles += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 active:scale-[0.99]";
          } else {
            if (i === correctIndex) {
              optionStyles += "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-sm shadow-emerald-100 dark:shadow-none";
            } else if (i === selectedIdx) {
              optionStyles += "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 shadow-sm shadow-rose-100 dark:shadow-none";
            } else {
              optionStyles += "border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelectOption(i)}
              disabled={selectedIdx !== null}
              className={`${optionStyles} flex items-center justify-between gap-2`}
            >
              <span>{opt}</span>
              {selectedIdx !== null && i === correctIndex && (
                <span className="shrink-0 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black leading-none">✓</span>
              )}
              {selectedIdx !== null && i === selectedIdx && i !== correctIndex && (
                <span className="shrink-0 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black leading-none">✕</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => setShowAnswer(!showAnswer)} 
          className="self-start sm:self-auto text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-200 transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100"
        >
          {showAnswer ? "Hide Explanation" : "Show Explanation"}
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confidence:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setConfidence(star)}
                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-5 h-5 ${
                    star <= confidence 
                      ? 'fill-amber-400 text-amber-400' 
                      : 'fill-transparent text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      {showAnswer && (
        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-sm rounded-xl border border-indigo-100 dark:border-indigo-800/50 font-medium animate-in fade-in slide-in-from-top-2">
          <strong>Answer: {q.correctAnswer}</strong> — {q.explanation}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [vibe, setVibe] = useState('Strict Professor (For Exams)');
  const [result, setResult] = useState<ResultData>(() => {
    const saved = localStorage.getItem('studyGuideResult');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved result", e);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'error' | 'link'>('notes');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [viaSocketToast, setViaSocketToast] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });
  const [codeCopied, setCodeCopied] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  
  // Advanced Speech Synthesis States
  const [speechRate, setSpeechRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Customization & Interactive Flashcard States
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [includeFlashcards, setIncludeFlashcards] = useState(true);
  const [includeConceptMap, setIncludeConceptMap] = useState(true);
  const [numQuestions, setNumQuestions] = useState(5);
  const [numFlashcards, setNumFlashcards] = useState(5);
  const [lastGeneratedText, setLastGeneratedText] = useState('');
  const [showInteractiveFlashcards, setShowInteractiveFlashcards] = useState(false);
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);

  useEffect(() => {
    let interval: any;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Load available speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const allVoices = window.speechSynthesis.getVoices();
        setVoices(allVoices);
        // Default to a suitable English voice or first voice
        const defaultVoice = allVoices.find(v => v.lang.toLowerCase().startsWith('en')) || allVoices[0];
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
        }
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      setLoading(true);
      fetch(`/api/share/${shareId}`)
        .then(res => res.json())
        .then(data => {
          if (data.result) setResult(data.result);
          else setError('Shared guide not found.');
        })
        .catch(() => setError('Error loading shared guide.'))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (result) {
      localStorage.setItem('studyGuideResult', JSON.stringify(result));
    } else {
      localStorage.removeItem('studyGuideResult');
    }
  }, [result]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported for local text extraction.');
      return;
    }

    setUploadingFile(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse local PDF file.');

      setInputText(data.text);
      if (data.text) {
        handleGenerate(data.text);
      }
    } catch (err: any) {
      setError(`PDF Upload Error: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleTTS = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (!result || !result.breakdown) return;
      
      let textToRead = result.breakdown.map(item => `${item.title}. ${item.content}`).join('. ');
      if (result.correctedCode) {
          textToRead += '. Here is the corrected code: ' + result.correctedCode;
      }
      
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      // Configure voice
      if (selectedVoice && voices.length > 0) {
        const found = voices.find(v => v.name === selectedVoice);
        if (found) {
          utterance.voice = found;
        }
      }
      
      // Configure rate
      utterance.rate = speechRate;
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleCopyCode = async () => {
    if (result?.correctedCode) {
      await navigator.clipboard.writeText(result.correctedCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 3000);
    }
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    let md = `# Smart Study Guide\n\n`;
    
    if (result.breakdown) {
      md += `## Breakdown\n`;
      result.breakdown.forEach(b => {
        md += `### ${b.title}\n${b.content}\n\n`;
      });
    }

    if (result.correctedCode) {
      md += `## Corrected Code\n\`\`\`\n${result.correctedCode}\n\`\`\`\n\n`;
    }

    if (result.flashcards && result.flashcards.length > 0) {
      md += `## Flashcards\n`;
      result.flashcards.forEach(f => {
        md += `- **${f.term}**: ${f.definition}\n`;
      });
      md += '\n';
    }

    if (result.conceptMap) {
      md += `## Concept Map\n`;
      md += `- **Prerequisite**: ${result.conceptMap.prerequisite}\n`;
      md += `- **Current**: ${result.conceptMap.current}\n`;
      md += `- **Next**: ${result.conceptMap.next}\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-guide.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!result) return;
    setIsSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        const url = `${window.location.origin}${window.location.pathname}?share=${data.id}`;
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (e) {
      console.error('Failed to share:', e);
    } finally {
      setIsSharing(false);
    }
  };

  const handleGenerate = async (overrideText?: string) => {
    let finalInputText = '';

    if (overrideText) {
      finalInputText = overrideText;
    } else if (activeTab === 'notes' || activeTab === 'error') {
      if (!inputText.trim()) {
        setError('Please paste some text first.');
        return;
      }
      finalInputText = inputText;
    } else if (activeTab === 'link') {
      if (!linkUrl.trim()) {
        setError('Please enter a YouTube or PDF Link.');
        return;
      }
      try {
        setError('');
        setLoading(true);
        const ytRes = await fetch('/api/fetch-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: linkUrl })
        });
        const ytData = await ytRes.json();
        if (!ytRes.ok) throw new Error(ytData.error || 'Failed to process link');
        finalInputText = ytData.text;
      } catch (err: any) {
        setError(`Link Error: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    if (!finalInputText) {
      setError('Could not extract any text.');
      setLoading(false);
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);
    setShowInteractiveFlashcards(false);
    setCurrentFlashcardIdx(0);
    setIsFlashcardFlipped(false);

    try {
      const isYoutubeVideo = activeTab === 'link' && (
        linkUrl.toLowerCase().includes('youtube.com') || 
        linkUrl.toLowerCase().includes('youtu.be') || 
        /^[a-zA-Z0-9_-]{11}$/.test(linkUrl.trim())
      );

      const response = await fetch('/api/generate-study-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: finalInputText, 
          vibe, 
          isErrorMode: activeTab === 'error',
          isYoutube: isYoutubeVideo,
          includeQuiz,
          includeFlashcards,
          includeConceptMap,
          numQuestions,
          numFlashcards
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate study guide');
      }

      setResult(data.result);
      setLastGeneratedText(finalInputText);
    } catch (err: any) {
      setError(`API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (updatedNumQuestions?: number, updatedNumFlashcards?: number) => {
    const textToUse = lastGeneratedText || inputText;
    if (!textToUse) return;

    setError('');
    setLoading(true);

    try {
      const isYoutubeVideo = activeTab === 'link' && (
        linkUrl.toLowerCase().includes('youtube.com') || 
        linkUrl.toLowerCase().includes('youtu.be') || 
        /^[a-zA-Z0-9_-]{11}$/.test(linkUrl.trim())
      );

      const targetQuestions = updatedNumQuestions !== undefined ? updatedNumQuestions : numQuestions;
      const targetFlashcards = updatedNumFlashcards !== undefined ? updatedNumFlashcards : numFlashcards;

      const response = await fetch('/api/generate-study-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToUse, 
          vibe, 
          isErrorMode: activeTab === 'error',
          isYoutube: isYoutubeVideo,
          includeQuiz,
          includeFlashcards,
          includeConceptMap,
          numQuestions: targetQuestions,
          numFlashcards: targetFlashcards
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate study guide');
      }

      setResult(data.result);
      if (updatedNumQuestions !== undefined) setNumQuestions(updatedNumQuestions);
      if (updatedNumFlashcards !== undefined) setNumFlashcards(updatedNumFlashcards);
    } catch (err: any) {
      setError(`API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 p-4 sm:p-8 flex flex-col gap-6 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6 h-full grow">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start shrink-0 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-indigo-950 dark:text-indigo-100 flex items-center gap-3">
              <span className="bg-indigo-600 text-white p-2 rounded-xl text-2xl leading-none shadow-sm">🧠</span>
              Smart Study Scaffolder
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              Turn brutal engineering lectures into instant survival quizzes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 shadow-sm h-[66px] min-w-[120px]">
              <div className="flex flex-col pl-2 w-14">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Focus</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 font-mono">
                  {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-2 rounded-xl transition-all text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm h-[66px]">
              <button
                onClick={() => setTheme('light')}
                className={`p-2.5 rounded-xl transition-all ${theme === 'light' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-2.5 rounded-xl transition-all ${theme === 'system' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                title="System Theme"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm min-w-[200px]">
             <div className="flex flex-col pl-2">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Quizzes</span>
               <span className="text-2xl font-black text-indigo-600 leading-none">21</span>
             </div>
             <div className="h-10 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}} 
                      contentStyle={{ backgroundColor: '#fff', color: '#333', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} 
                      formatter={(value: any) => [value, "quizzes"]}
                      labelStyle={{display: 'none'}}
                    />
                    <Bar dataKey="quizzes" fill="#6366f1" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center justify-between sm:justify-center sm:gap-16 relative shrink-0">
           {/* Connecting Line (Desktop) */}
           <div className="hidden sm:block absolute top-1/2 left-8 right-8 h-0.5 bg-slate-100 dark:bg-slate-700 -translate-y-1/2 z-0 overflow-hidden rounded-full">
             <div className={`h-full bg-indigo-50 dark:bg-indigo-900/300 transition-all duration-700 ease-in-out ${loading ? 'w-1/2' : result ? 'w-full' : 'w-0'}`}></div>
           </div>

           <div className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-3 z-10 bg-white dark:bg-slate-800 px-4`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${!loading && !result ? 'bg-indigo-600 text-white ring-4 ring-indigo-50' : 'bg-indigo-100 text-indigo-700'}`}>1</div>
             <span className={`text-xs font-bold uppercase tracking-wider ${!loading && !result ? 'text-indigo-700' : 'text-slate-500 dark:text-slate-400'}`}>Input</span>
           </div>

           <div className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-3 z-10 bg-white dark:bg-slate-800 px-4`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${loading ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 animate-pulse' : result ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>2</div>
             <span className={`text-xs font-bold uppercase tracking-wider ${loading ? 'text-indigo-700' : result ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400'}`}>Generating</span>
           </div>

           <div className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-3 z-10 bg-white dark:bg-slate-800 px-4`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${result && !loading ? 'bg-emerald-500 text-white ring-4 ring-emerald-50' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>3</div>
             <span className={`text-xs font-bold uppercase tracking-wider ${result && !loading ? 'text-emerald-600' : 'text-slate-400'}`}>Completed</span>
           </div>
        </div>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[minmax(600px,auto)] gap-6 grow">
          
          {/* Input Area (Col 1-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm flex flex-col grow relative overflow-hidden">
              
              {/* Vibe Selector */}
              <div className="mb-4 relative z-10">
                <label htmlFor="vibe-select" className="block text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200 mb-2">
                  Select Your Study Vibe 🎧
                </label>
                <select
                  id="vibe-select"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all shadow-sm"
                >
                  <option value="Strict Professor (For Exams)">Strict Professor (For Exams)</option>
                  <option value="Explain Like I'm 5 (For Basics)">Explain Like I'm 5 (For Basics)</option>
                  <option value="Hype Mode (For Fun)">Hype Mode (For Fun)</option>
                </select>
              </div>

              {/* Customization Options */}
              <div className="mb-6 relative z-10 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Scaffold Options ⚙️</p>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none mb-1">
                      <input 
                        type="checkbox" 
                        checked={includeQuiz} 
                        onChange={(e) => setIncludeQuiz(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-300 dark:border-slate-700 cursor-pointer accent-indigo-600" 
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Generate Practice Quiz 🧠</span>
                    </label>
                    {includeQuiz && (
                      <div className="pl-6 flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400">Questions:</span>
                        <select
                          value={numQuestions}
                          onChange={(e) => setNumQuestions(Number(e.target.value))}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold px-2 py-0.5 text-slate-600 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {[3, 5, 8, 10, 15].map((num) => (
                            <option key={num} value={num}>{num} questions</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none mb-1">
                      <input 
                        type="checkbox" 
                        checked={includeFlashcards} 
                        onChange={(e) => setIncludeFlashcards(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-300 dark:border-slate-700 cursor-pointer accent-indigo-600" 
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Generate Study Flashcards 📇</span>
                    </label>
                    {includeFlashcards && (
                      <div className="pl-6 flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400">Flashcards:</span>
                        <select
                          value={numFlashcards}
                          onChange={(e) => setNumFlashcards(Number(e.target.value))}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold px-2 py-0.5 text-slate-600 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {[3, 5, 8, 10, 15].map((num) => (
                            <option key={num} value={num}>{num} cards</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={includeConceptMap} 
                        onChange={(e) => setIncludeConceptMap(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-300 dark:border-slate-700 cursor-pointer accent-indigo-600" 
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Generate Concept Map 🗺️</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Multi-modal Tabs */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl mb-4 relative z-10">
                <button 
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold rounded-lg transition-all duration-200 ${activeTab === 'notes' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <FileText className="w-3.5 h-3.5" /> Lecture Notes
                </button>
                <button 
                  onClick={() => setActiveTab('error')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold rounded-lg transition-all duration-200 ${activeTab === 'error' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Code2 className="w-3.5 h-3.5" /> Error Translator
                </button>
                <button 
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold rounded-lg transition-all duration-200 ${activeTab === 'link' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Link2 className="w-3.5 h-3.5" /> YouTube / PDF Link
                </button>
              </div>

              <div className="grow flex flex-col relative z-10">
                {activeTab === 'notes' && (
                  <div className="grow flex flex-col gap-3 relative min-h-[260px]">
                    {uploadingFile && (
                      <div className="absolute inset-0 bg-white/85 dark:bg-slate-800/85 rounded-2xl flex flex-col items-center justify-center gap-2.5 z-20 backdrop-blur-[2px]">
                        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                        <span className="text-xs font-bold text-indigo-600 animate-pulse">Extracting text from PDF...</span>
                      </div>
                    )}
                    <textarea
                      id="lecture-notes"
                      className="grow bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-mono resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400 w-full min-h-[160px]"
                      placeholder="E.g., In Applied Mechanics, the moment of a force is..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    
                    {/* Local PDF upload footer bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
                      <div className="flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 leading-none">Upload Local PDF</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Extract & load file contents</p>
                        </div>
                      </div>
                      <label className="cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-300 shadow-xs transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Select file</span>
                        <input 
                          type="file" 
                          accept=".pdf" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                )}
                {activeTab === 'error' && (
                  <textarea
                    id="error-input"
                    className="grow bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-mono resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400 min-h-[260px] w-full"
                    placeholder="Paste cryptic Python/Coding errors here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                )}
                {activeTab === 'link' && (
                  <div className="grow bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-center min-h-[260px]">
                    <div className="bg-indigo-100 dark:bg-indigo-950/40 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Extract Study Material from URL</p>
                      <p className="text-xs text-slate-400">Supports YouTube (with captions), public PDFs, or web articles</p>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Paste YouTube, PDF or Webpage Link..." 
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200 shadow-sm placeholder:text-slate-400"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => handleGenerate()}
                disabled={loading}
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed relative z-10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI is scaffolding...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Generate Study Guide</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-800 px-6 py-4 rounded-[2rem] border border-red-200 font-medium text-sm flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0"></span>
                {error}
              </div>
            )}
          </div>

          {/* Results Box (Col 5-12) */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full">
            {result ? (
              <div className="flex flex-col gap-6 h-full overflow-y-auto pb-8 pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in slide-in-from-bottom-8 duration-500">
                
                {/* SECTION A: Breakdown */}
                <div className="bg-indigo-950 text-white rounded-[2rem] p-8 md:p-10 relative overflow-hidden shrink-0 shadow-sm">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <h3 className="uppercase text-[10px] font-bold tracking-widest text-indigo-300">📝 {showInteractiveFlashcards ? "Interactive Flashcards" : "The Breakdown"}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleTTS}
                          className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold shadow-sm ${
                            isPlaying 
                              ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600' 
                              : 'bg-indigo-800/50 text-indigo-200 border-indigo-700/50 hover:bg-indigo-700/50'
                          }`}
                          title={isPlaying ? "Stop listening" : "Listen to summary"}
                        >
                          {isPlaying ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-current" /> Stop Audio
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" /> Listen
                            </>
                          )}
                        </button>

                        {result.flashcards && result.flashcards.length > 0 && (
                          <button
                            onClick={() => {
                              setShowInteractiveFlashcards(!showInteractiveFlashcards);
                              setIsFlashcardFlipped(false);
                            }}
                            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold shadow-sm ${
                              showInteractiveFlashcards 
                                ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' 
                                : 'bg-indigo-800/50 text-indigo-200 border-indigo-700/50 hover:bg-indigo-700/50'
                            }`}
                            title={showInteractiveFlashcards ? "Back to Study Notes" : "Learn with Flashcards"}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{showInteractiveFlashcards ? "Exit Flashcards" : "Flashcards"}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Speech Settings Customizer */}
                    {!showInteractiveFlashcards && (
                      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-900/30 p-4 rounded-2xl border border-indigo-800/50 text-xs text-indigo-200 relative z-10">
                        <div className="space-y-1.5 text-left">
                          <label className="block font-bold tracking-tight uppercase text-[9px] text-indigo-300">Choose Voice 🗣️</label>
                          <select
                            value={selectedVoice}
                            onChange={(e) => {
                              setSelectedVoice(e.target.value);
                              if (isPlaying) {
                                window.speechSynthesis.cancel();
                                setIsPlaying(false);
                                setTimeout(handleTTS, 100);
                              }
                            }}
                            className="w-full bg-indigo-950/80 border border-indigo-800/60 rounded-xl px-3 py-2 outline-none text-indigo-200 focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                          >
                            {voices.length === 0 ? (
                              <option>System Voices Loaded</option>
                            ) : (
                              voices.map((voice) => (
                                <option key={voice.name} value={voice.name}>
                                  {voice.name} ({voice.lang})
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label className="font-bold tracking-tight uppercase text-[9px] text-indigo-300">Speed Rate ⚡</label>
                            <span className="font-mono text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300 font-bold">{speechRate}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speechRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setSpeechRate(val);
                              if (isPlaying) {
                                window.speechSynthesis.cancel();
                                setIsPlaying(false);
                                setTimeout(handleTTS, 100);
                              }
                            }}
                            className="w-full accent-emerald-400 h-1.5 bg-indigo-950 rounded-lg cursor-pointer mt-2"
                          />
                        </div>
                      </div>
                    )}

                    {showInteractiveFlashcards && result.flashcards && result.flashcards.length > 0 ? (
                      <div className="flex flex-col items-center justify-center py-4 relative z-10 max-w-lg mx-auto w-full">
                        <div className="text-center mb-4">
                          <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">Interactive Study Deck</span>
                          <p className="text-xs text-indigo-200/80 mt-1">Tap/click the card below to flip between the term and definition</p>
                        </div>

                        {/* Flipped Card */}
                        <div 
                          onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                          className={`w-full min-h-[220px] rounded-3xl p-8 border cursor-pointer select-none transition-all duration-300 transform hover:shadow-xl hover:scale-[1.01] flex flex-col items-center justify-center relative ${
                            isFlashcardFlipped 
                              ? 'bg-gradient-to-br from-violet-950 to-indigo-950 border-violet-500/50 text-violet-100 shadow-indigo-500/5' 
                              : 'bg-gradient-to-br from-indigo-950 to-indigo-900 border-indigo-700/50 text-indigo-100 shadow-indigo-500/10'
                          }`}
                        >
                          <div className="absolute top-4 left-4 text-[9px] font-mono tracking-widest uppercase text-indigo-400/80 bg-indigo-950/85 px-2.5 py-1 rounded-full border border-indigo-800/40">
                            {isFlashcardFlipped ? "DEFINITION" : "TERM"}
                          </div>
                          
                          <div className="absolute top-4 right-4 flex items-center gap-1 text-[9.5px] font-bold text-emerald-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800/40">
                            <RefreshCw className="w-3 h-3" /> Flip
                          </div>

                          <div className="px-4 text-center">
                            {isFlashcardFlipped ? (
                              <p className="text-sm sm:text-base font-medium leading-relaxed text-indigo-100 animate-in fade-in duration-200">
                                {result.flashcards[currentFlashcardIdx].definition}
                              </p>
                            ) : (
                              <p className="text-lg sm:text-xl font-black tracking-tight text-white animate-in fade-in duration-200">
                                {result.flashcards[currentFlashcardIdx].term}
                              </p>
                            )}
                          </div>

                          <div className="absolute bottom-4 text-[9px] font-medium text-indigo-300/50">
                            {isFlashcardFlipped ? "Click anywhere to see original term" : "Click anywhere to reveal explanation"}
                          </div>
                        </div>

                        {/* Navigation controls */}
                        <div className="flex items-center justify-between w-full mt-6 px-2 gap-4">
                          <button
                            onClick={() => {
                              setCurrentFlashcardIdx(prev => Math.max(0, prev - 1));
                              setIsFlashcardFlipped(false);
                            }}
                            disabled={currentFlashcardIdx === 0}
                            className="bg-indigo-900/60 hover:bg-indigo-800/60 disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-800/40 text-indigo-100 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs transition-all active:scale-95"
                          >
                            <ChevronLeft className="w-4 h-4" /> Prev
                          </button>

                          <span className="font-mono text-xs font-bold text-indigo-300">
                            Card {currentFlashcardIdx + 1} of {result.flashcards.length}
                          </span>

                          <button
                            onClick={() => {
                              setCurrentFlashcardIdx(prev => Math.min(result.flashcards!.length - 1, prev + 1));
                              setIsFlashcardFlipped(false);
                            }}
                            disabled={currentFlashcardIdx === result.flashcards.length - 1}
                            className="bg-indigo-900/60 hover:bg-indigo-800/60 disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-800/40 text-indigo-100 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs transition-all active:scale-95"
                          >
                            Next <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {result.breakdown?.map((item, idx) => (
                          <div key={idx} className="space-y-3">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">{item.title}</p>
                            <p className="text-sm leading-relaxed text-indigo-50/90">{item.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Decorative Abstract Patterns */}
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-800 rounded-full opacity-30 blur-3xl"></div>
                  <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-600 rounded-full opacity-20 blur-2xl"></div>
                </div>

                {/* SECTION C: Flashcards */}
                {result.flashcards && result.flashcards.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col shrink-0">
                    <div className="flex items-center justify-between gap-2 mb-6 md:mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <h3 className="uppercase text-[10px] font-bold tracking-widest text-slate-400">📇 Study Flashcards</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {result.flashcards.map((card, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center flex flex-col justify-center gap-3 hover:border-indigo-200 hover:shadow-md transition-all group cursor-default">
                          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 transition-colors">{card.term}</span>
                          <div className="h-px w-8 bg-slate-100 dark:bg-slate-700 mx-auto my-1"></div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{card.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION E: Corrected Code (For Error Mode) */}
                {result.correctedCode && (
                  <div className="bg-slate-900 text-slate-200 border border-slate-700 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col shrink-0 overflow-hidden relative group">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <h3 className="uppercase text-[10px] font-bold tracking-widest text-slate-400">💻 Corrected Code</h3>
                      </div>
                      <button onClick={handleCopyCode} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 flex items-center gap-2">
                         {codeCopied ? <Check className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4"/>}
                         <span className="text-xs font-bold">{codeCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="font-mono text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed text-emerald-400">{result.correctedCode}</pre>
                  </div>
                )}

                {/* SECTION D: Concept Map */}
                {result.conceptMap && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm shrink-0 flex flex-col md:flex-row items-center justify-between text-center gap-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-transparent to-emerald-50/50 pointer-events-none"></div>
                    <div className="flex-1 relative z-10 w-full md:w-auto p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Prerequisite</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{result.conceptMap.prerequisite}</div>
                    </div>
                    <div className="text-slate-300 font-bold rotate-90 md:rotate-0">→</div>
                    <div className="flex-1 relative z-10 w-full md:w-auto p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                      <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Current Concept</div>
                      <div className="text-base font-bold text-indigo-700">{result.conceptMap.current}</div>
                    </div>
                    <div className="text-slate-300 font-bold rotate-90 md:rotate-0">→</div>
                    <div className="flex-1 relative z-10 w-full md:w-auto p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">What's Next</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{result.conceptMap.next}</div>
                    </div>
                  </div>
                )}

                {/* SECTION B: Survival Quiz */}
                {result.quiz && result.quiz.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col shrink-0">
                    <div className="flex items-center justify-between gap-2 mb-6 md:mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                        <h3 className="uppercase text-[10px] font-bold tracking-widest text-slate-400">🧠 Survival Quiz</h3>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {result.quiz.map((q, idx) => (
                        <QuizQuestion key={idx} q={q} idx={idx} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-2">
                  <button 
                    onClick={handleShare}
                    disabled={isSharing}
                    className="w-full md:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 font-bold py-3 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                  >
                    {isSharing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    <span>{copied ? 'Copied Link!' : isSharing ? 'Sharing...' : 'Share'}</span>
                  </button>
                  <button 
                    onClick={handleExportMarkdown}
                    className="w-full md:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Export MD</span>
                  </button>
                </div>

                {/* Telegram Bot Integration */}
                <div className="mt-8 flex flex-col items-center gap-4 relative z-10 pb-6 border-t border-slate-100 dark:border-slate-800/80 pt-6">
                  <button 
                    onClick={() => window.open('https://t.me/STUDYSCAFF_AI_BOT', '_blank')}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-sky-200/40 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15.82-1.05 5.86-1.5 8.27-.19.97-.73 1.29-1.39.91-1.02-.59-1.84-1.07-2.82-1.72-1.13-.74-.4-1.15.25-1.83.17-.18 3.12-2.86 3.18-3.11.01-.03.01-.15-.06-.21-.07-.06-.17-.04-.25-.02-.11.02-1.87 1.18-5.28 3.48-.5.34-.95.51-1.35.5-.44-.01-1.29-.25-1.92-.45-.77-.25-1.39-.39-1.34-.83.03-.23.35-.46.97-.71 3.79-1.65 6.32-2.74 7.59-3.27 3.61-1.5 4.36-1.76 4.85-1.77.11 0 .35.03.5.15.13.1.17.24.18.35-.01.12-.03.38-.05.63z" /></svg>
                    <span>💬 Chat on Telegram with StudyScaff Bot</span>
                  </button>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
                    Review and quiz yourself directly inside Telegram with our companion bot!
                  </p>

                  {/* Recreated Telegram QR Code Card from user attachment */}
                  <div className="mt-6 relative w-full max-w-[270px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center">
                    {/* Floating Avatar Badge with the custom color from the attachment */}
                    <div className="absolute -top-7 w-14 h-14 bg-[#E56A53] rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-md">
                      <span className="text-white text-2xl font-black">S</span>
                    </div>
                    
                    {/* QR Code Container */}
                    <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-center relative group">
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://t.me/STUDYSCAFF_AI_BOT" 
                        alt="StudyScaff Bot QR Code" 
                        className="w-40 h-40 rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      {/* Telegram Icon Overlay in the center */}
                      <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#54A9EB] fill-current">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15.82-1.05 5.86-1.5 8.27-.19.97-.73 1.29-1.39.91-1.02-.59-1.84-1.07-2.82-1.72-1.13-.74-.4-1.15.25-1.83.17-.18 3.12-2.86 3.18-3.11.01-.03.01-.15-.06-.21-.07-.06-.17-.04-.25-.02-.11.02-1.87 1.18-5.28 3.48-.5.34-.95.51-1.35.5-.44-.01-1.29-.25-1.92-.45-.77-.25-1.39-.39-1.34-.83.03-.23.35-.46.97-.71 3.79-1.65 6.32-2.74 7.59-3.27 3.61-1.5 4.36-1.76 4.85-1.77.11 0 .35.03.5.15.13.1.17.24.18.35-.01.12-.03.38-.05.63z" />
                        </svg>
                      </div>
                    </div>

                    {/* Bot Name and Guidance */}
                    <div className="mt-4 text-center">
                      <p className="text-sm font-black text-[#54A9EB] tracking-wide uppercase">
                        @STUDYSCAFF_AI_BOT
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                        Scan with your phone camera or Telegram scanner to connect
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-indigo-950 text-white rounded-[2rem] p-8 relative overflow-hidden h-full min-h-[400px] flex items-center justify-center text-center shadow-sm">
                <div className="relative z-10 max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-indigo-800/60 border border-indigo-700/50 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-900/50">
                    <span className="text-3xl">✨</span>
                  </div>
                  <h3 className="text-xl font-bold text-indigo-100 mb-3">Ready to scaffold</h3>
                  <p className="text-sm text-indigo-300/80 leading-relaxed font-medium">
                    Input your study material on the left and select your vibe to generate a complete learning dashboard.
                  </p>
                </div>
                {/* Decorative Abstract Patterns */}
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-800 rounded-full opacity-30 blur-3xl"></div>
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-700 rounded-full opacity-20 blur-3xl"></div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

