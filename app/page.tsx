'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { processTranscript } from './actions/gemini';
import { DocType, WritingStyle, ProcessingConfig, HistoryItem } from '@/types';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/lib/supabase/client';
import IntegrationGrid from '@/components/IntegrationGrid';
import FeatureCards from '@/components/FeatureCards';
import HistorySidebar from '@/components/HistorySidebar';
import PricingModal from '@/components/PricingModal';
import {
  getLocalHistory,
  saveLocalHistory,
  deleteLocalHistory,
  getCloudHistory,
  saveCloudHistory,
  deleteCloudHistory,
} from '@/lib/history';
import {
  LockClosedIcon,
  StarIcon,
  QueueListIcon,
  ShareIcon,
  GlobeAltIcon,
  MicrophoneIcon,
  StopIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ChevronDownIcon,
  SparklesIcon,
  UserCircleIcon
} from '@heroicons/react/24/solid';

// --- Components ---

const MechanicalMeter = ({ audioLevels }: { audioLevels: number[] }) => {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {audioLevels.map((level, i) => (
        <div
          key={i}
          className="w-1.5 bg-oxide-red transition-all duration-75 ease-out rounded-t-sm"
          style={{ height: `${Math.max(15, level)}%`, opacity: level > 10 ? 1 : 0.4 }}
        />
      ))}
    </div>
  );
};

const UpsellModal = ({ isOpen, onClose, onUpgrade, mode = 'UPGRADE' }: { isOpen: boolean; onClose: () => void; onUpgrade: () => void; mode?: 'UPGRADE' | 'HISTORY' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-base/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-ink-surface border border-ink-border  max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        {/* Header */}
        <div className="bg-ink-base p-6 text-center border-b border-ink-border">
          <div className="mx-auto w-10 h-10 border border-ink-border rounded-full flex items-center justify-center mb-4 text-paper-muted">
            {mode === 'HISTORY' ? <ArchiveBoxIcon className="w-5 h-5" /> : <LockClosedIcon className="w-5 h-5" />}
          </div>
          <h2 className="text-xl font-medium text-paper-text tracking-tight mb-1">
            {mode === 'HISTORY' ? 'History is a Pro Feature' : 'Upgrade to Pro'}
          </h2>
          <p className="text-paper-muted text-xs uppercase tracking-widest">
            {mode === 'HISTORY' ? 'Save & Organise Your Thinking' : 'Unlocking Advanced Tools'}
          </p>
        </div>

        {/* Features */}
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-ink-base border border-ink-border flex items-center justify-center text-oxide-red shrink-0">
              <ClockIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-paper-text text-sm">30-Minute Recording</h4>
              <p className="text-xs text-paper-muted leading-relaxed mt-1">Increase your limit from 2:00 to 30:00 per session.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-ink-base border border-ink-border flex items-center justify-center text-oxide-red shrink-0">
              <QueueListIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-paper-text text-sm">Cloud History</h4>
              <p className="text-xs text-paper-muted leading-relaxed mt-1">Automatically save all your transcripts and drafts.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-ink-base border border-ink-border flex items-center justify-center text-oxide-red shrink-0">
              <ShareIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-paper-text text-sm">Direct Integrations</h4>
              <p className="text-xs text-paper-muted leading-relaxed mt-1">Send drafts directly to Notion, LinkedIn & WordPress.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-ink-base border-t border-ink-border flex flex-col gap-3">
          <button
            onClick={onUpgrade}
            className="w-full bg-oxide-red hover:bg-orange-700 text-white font-medium py-3  transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-oxide-red/20"
          >
            <StarIcon className="w-4 h-4" />
            Upgrade - $9/mo
          </button>
          <button
            onClick={onClose}
            className="w-full text-paper-muted text-xs hover:text-paper-text transition-colors uppercase tracking-widest"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const stripMarkdown = (md: string): string => {
    return md
      .replace(/#{1,6}\s?/g, '')           // headers
      .replace(/\*\*(.+?)\*\*/g, '$1')     // bold
      .replace(/\*(.+?)\*/g, '$1')         // italic
      .replace(/_(.+?)_/g, '$1')           // italic alt
      .replace(/`(.+?)`/g, '$1')           // inline code
      .replace(/^\s*[-*+]\s/gm, '• ')      // bullets
      .replace(/^\s*\d+\.\s/gm, '')        // numbered lists
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // links
      .trim();
  };

  const handleCopy = async (mode: 'TEXT' | 'MARKDOWN') => {
    const content = mode === 'TEXT' ? stripMarkdown(text) : text;
    await navigator.clipboard.writeText(content);
    setIsOpen(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => handleCopy('TEXT')}
        className="flex items-center gap-2 bg-oxide-red hover:bg-orange-700 text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2  transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
        <div
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="border-l border-white/20 pl-2 ml-1 hover:bg-white/10 h-full flex items-center"
        >
          <ChevronDownIcon className="w-3 h-3" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 w-32 bg-ink-surface border border-ink-border shadow-xl  z-50 flex flex-col">
          <button onClick={() => handleCopy('TEXT')} className="text-left px-3 py-2 text-[10px] uppercase font-bold text-paper-muted hover:text-paper-text hover:bg-ink-base transition-colors">
            Plain Text
          </button>
          <button onClick={() => handleCopy('MARKDOWN')} className="text-left px-3 py-2 text-[10px] uppercase font-bold text-paper-muted hover:text-paper-text hover:bg-ink-base transition-colors">
            Markdown
          </button>
        </div>
      )}
    </div>
  );
};

// All available format types
const ALL_FORMATS: { key: DocType; label: string }[] = [
  { key: 'SUMMARY', label: 'Summary' },
  { key: 'EMAIL_DRAFT', label: 'Email' },
  { key: 'MEETING_NOTES', label: 'Meeting Notes' },
  { key: 'LINKEDIN_POST', label: 'LinkedIn Post' },
  { key: 'TWEET_THREAD', label: 'Tweet Thread' },
  { key: 'BLOG_POST', label: 'Blog Post' },
  { key: 'NEWSLETTER', label: 'Newsletter' },
  { key: 'PRESS_RELEASE', label: 'Press Release' },
  { key: 'PRODUCT_DESCRIPTION', label: 'Product Description' },
  { key: 'VIDEO_SCRIPT', label: 'Video Script' },
  { key: 'PODCAST_OUTLINE', label: 'Podcast Outline' },
  { key: 'SALES_PITCH', label: 'Sales Pitch' },
  { key: 'BUG_REPORT', label: 'Bug Report' },
  { key: 'DESIGN_FEEDBACK', label: 'Design Feedback' },
  { key: 'BRAINSTORM', label: 'Brainstorm' },
];

// Recording prompts for each format
const RECORDING_PROMPTS: Record<DocType, { title: string; prompt: string }> = {
  'SUMMARY': { title: 'Summary', prompt: 'Explain it like you would to a colleague.' },
  'EMAIL_DRAFT': { title: 'Email', prompt: 'Say who it\'s for and what you want.' },
  'MEETING_NOTES': { title: 'Notes', prompt: 'Don\'t worry about structure. Just talk.' },
  'LINKEDIN_POST': { title: 'Social', prompt: 'Share the idea, not the polish.' },
  'TWEET_THREAD': { title: 'Thread', prompt: 'What\'s the story you want to tell?' },
  'BLOG_POST': { title: 'Blog', prompt: 'Talk through your main points naturally.' },
  'NEWSLETTER': { title: 'Newsletter', prompt: 'What do your readers need to know?' },
  'PRESS_RELEASE': { title: 'Press', prompt: 'What\'s the news and why does it matter?' },
  'PRODUCT_DESCRIPTION': { title: 'Product', prompt: 'Describe what it does and who it\'s for.' },
  'VIDEO_SCRIPT': { title: 'Script', prompt: 'Walk through it like you\'re presenting.' },
  'PODCAST_OUTLINE': { title: 'Podcast', prompt: 'What topics do you want to cover?' },
  'SALES_PITCH': { title: 'Pitch', prompt: 'What problem does this solve?' },
  'BUG_REPORT': { title: 'Bug', prompt: 'Describe what happened and what you expected.' },
  'DESIGN_FEEDBACK': { title: 'Feedback', prompt: 'Say what works and what doesn\'t.' },
  'BRAINSTORM': { title: 'Ideas', prompt: 'Let your thoughts flow freely.' },
};

const FormatModal = ({ isOpen, onClose, onSelect, currentFormat }: { isOpen: boolean; onClose: () => void; onSelect: (format: DocType) => void; currentFormat: DocType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-base/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-ink-surface border border-ink-border  max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-ink-base p-4 border-b border-ink-border flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-paper-text">All Formats</h2>
          <button onClick={onClose} className="text-paper-muted hover:text-paper-text text-xs">✕</button>
        </div>
        <div className="p-4 grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
          {ALL_FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => { onSelect(f.key); onClose(); }}
              className={`p-3 text-[10px] font-bold uppercase tracking-wide border  transition-all text-center
                ${currentFormat === f.key
                  ? 'bg-oxide-red text-white border-oxide-red'
                  : 'bg-transparent text-paper-muted border-ink-border hover:border-paper-muted hover:text-paper-text'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);

  // App State
  // 'CONFIG' | 'RECORDING' | 'GENERATING' | 'RESULT'
  const [appState, setAppState] = useState<'CONFIG' | 'RECORDING' | 'GENERATING' | 'RESULT'>('CONFIG');

  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  // UI & Tier State
  const [isPro, setIsPro] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showUpsell, setShowUpsell] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [upsellMode, setUpsellMode] = useState<'UPGRADE' | 'HISTORY'>('UPGRADE');
  const [showHistory, setShowHistory] = useState(false);
  const [showRecordingSettings, setShowRecordingSettings] = useState(false);
  const [pastFreeLimit, setPastFreeLimit] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Configuration
  const [config, setConfig] = useState<ProcessingConfig>({
    docType: 'SUMMARY',
    length: 'BALANCED',
    style: 'CONVERSATIONAL'
  });

  const recognitionRef = useRef<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio levels for equalizer
  const [audioLevels, setAudioLevels] = useState<number[]>([10, 10, 10, 10, 10]);

  // Constants
  const FREE_LIMIT = 120; // 2 minutes
  const PRO_LIMIT = 1800; // 30 minutes
  const currentLimit = isPro ? PRO_LIMIT : FREE_LIMIT;

  // Auth Check & Load History
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
        if (data) {
          setIsPro(data.is_pro);
          // Load cloud history for Pro users
          if (data.is_pro) {
            const cloudHistory = await getCloudHistory(user.id);
            setHistory(cloudHistory);
          }
        }
      }
      // Load local history for free users (or as fallback)
      if (!user) {
        setHistory(getLocalHistory());
      }
    };
    checkUser();
  }, [supabase]);

  // Load local history on mount for non-logged-in users
  useEffect(() => {
    if (!user && !isPro) {
      setHistory(getLocalHistory());
    }
  }, [user, isPro]);

  // Check for upgrade query param (redirect from login)
  useEffect(() => {
    if (searchParams.get('upgrade') === 'true') {
      setShowPricing(true);
      // Clean up the URL
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  // Timer Logic - NO auto-stop, just track elapsed time
  useEffect(() => {
    let interval: any;
    if (appState === 'RECORDING') {
      interval = setInterval(() => {
        setRecordingSeconds(prev => {
          const newVal = prev + 1;
          // Mark when user exceeds free limit (for upgrade nudge later)
          if (!isPro && newVal >= FREE_LIMIT && !pastFreeLimit) {
            setPastFreeLimit(true);
          }
          return newVal;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
      setPastFreeLimit(false);
    }
    return () => clearInterval(interval);
  }, [appState, isPro, pastFreeLimit]);

  // Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setSpeechSupported(isSupported);

      if (isSupported) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalChunk = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalChunk += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalChunk) setFinalTranscript(prev => prev + ' ' + finalChunk);
          setTranscript(interimTranscript);
        };
      }
    }
  }, []);

  const startRecording = async () => {
    setFinalTranscript('');
    setTranscript('');
    setResult('');
    setError(null);

    // Start speech recognition
    recognitionRef.current?.start();
    setAppState('RECORDING');

    // Start audio visualization
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 32;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const updateLevels = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Take 5 frequency bands and normalize to 0-100
        const levels = Array.from(dataArray.slice(0, 5)).map(v => (v / 255) * 100);
        setAudioLevels(levels);

        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();
    } catch (err) {
      console.warn('Audio visualization not available:', err);
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();

    // Clean up audio visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevels([10, 10, 10, 10, 10]);

    setAppState('GENERATING');
    handleProcess();
  };

  const handleProcess = async () => {
    const text = (finalTranscript + ' ' + transcript).trim();
    if (!text) {
      // Did not capture audio
      setAppState('CONFIG');
      return;
    }

    try {
      // Simulate delay for animation if API is too fast
      const [content] = await Promise.all([
        processTranscript(text, config),
        new Promise(resolve => setTimeout(resolve, 1500)) // Min 1.5s animation
      ]);

      setResult(content);
      setAppState('RESULT');

      // Save to history
      try {
        if (isPro && user) {
          const saved = await saveCloudHistory(user.id, text, content, config);
          if (saved) setHistory(prev => [saved, ...prev].slice(0, 100));
        } else {
          const saved = saveLocalHistory(text, content, config);
          setHistory(prev => [saved, ...prev].slice(0, 5));
        }
      } catch (historyError) {
        console.warn('Failed to save to history:', historyError);
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 500);

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An error occurred");
      setAppState('RESULT'); // Show error state
    }
  };

  const handleUpgrade = () => {
    setShowUpsell(false);
    setShowPricing(true);
  };

  const handleViewOutput = () => {
    setShowHistory(true);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setFinalTranscript(item.transcript);
    setConfig(item.config);
    setAppState('RESULT');
    setShowHistory(false);
  };

  const handleDeleteHistoryItem = async (id: string) => {
    if (isPro && user) {
      const success = await deleteCloudHistory(id);
      if (success) setHistory(prev => prev.filter(item => item.id !== id));
    } else {
      deleteLocalHistory(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-serif bg-ink-base text-paper-text selection:bg-oxide-red/20 selection:text-oxide-red overflow-x-hidden grain-texture">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-base/90 backdrop-blur-md border-b border-ink-border h-16">
        <div className="w-full max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-serif tracking-tight cursor-default">Voxacom<span className="text-oxide-red">.</span></h1>
            <span className="hidden md:inline text-[10px] font-sans uppercase tracking-[0.2em] text-paper-muted opacity-60">System v2.0</span>
          </div>

          <nav className="flex items-center gap-6 text-[10px] font-sans font-bold uppercase tracking-[0.15em]">
            <button onClick={handleViewOutput} className="hidden md:flex items-center gap-1.5 hover:text-oxide-red transition-colors text-paper-muted">
              <ArchiveBoxIcon className="w-3 h-3" /> History
            </button>

            {!isPro && (
              <button onClick={() => setShowPricing(true)} className="text-oxide-red hover:text-white transition-colors flex items-center gap-1">
                <StarIcon className="w-3 h-3" /> Upgrade
              </button>
            )}

            {/* Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                className="w-8 h-8 rounded-full border border-paper-muted/50 flex items-center justify-center hover:border-paper-text hover:bg-ink-surface transition-colors"
              >
                <UserCircleIcon className="w-5 h-5 text-paper-muted" />
              </button>

              {showAvatarMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAvatarMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-ink-surface border border-ink-border  shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-ink-border">
                          <p className="text-xs text-paper-muted truncate">{user.email}</p>
                          {isPro && (
                            <span className="text-[9px] uppercase tracking-widest font-bold text-oxide-red">Pro</span>
                          )}
                        </div>
                        <button
                          onClick={() => { setShowAvatarMenu(false); router.push('/account'); }}
                          className="w-full px-4 py-3 text-left text-xs uppercase tracking-widest font-bold text-paper-muted hover:bg-ink-base hover:text-paper-text transition-colors flex items-center gap-2"
                        >
                          <span className="w-4 h-4 text-center">👤</span> Account
                        </button>
                        <button
                          onClick={() => { setShowAvatarMenu(false); supabase.auth.signOut().then(() => { setUser(null); setIsPro(false); }); }}
                          className="w-full px-4 py-3 text-left text-xs uppercase tracking-widest font-bold text-paper-muted hover:bg-ink-base hover:text-oxide-red transition-colors flex items-center gap-2 border-t border-ink-border"
                        >
                          <span className="w-4 h-4 text-center">🚪</span> Log Out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setShowAvatarMenu(false); router.push('/login'); }}
                          className="w-full px-4 py-3 text-left text-xs uppercase tracking-widest font-bold text-paper-muted hover:bg-ink-base hover:text-oxide-red transition-colors flex items-center gap-2"
                        >
                          <span className="w-4 h-4 text-center">🔑</span> Log In
                        </button>
                        <button
                          onClick={() => { setShowAvatarMenu(false); /* TODO: Settings page */ }}
                          className="w-full px-4 py-3 text-left text-xs uppercase tracking-widest font-bold text-paper-muted hover:bg-ink-base hover:text-paper-text transition-colors flex items-center gap-2 border-t border-ink-border"
                        >
                          <span className="w-4 h-4 text-center">⚙️</span> Settings
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto pt-24 pb-20 px-6 flex flex-col items-center gap-6">

        {/* Hero Copy (Simplified) - Hidden in RESULT state */}
        {appState !== 'RESULT' && (
          <div className="text-center space-y-3 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <p className="text-3xl md:text-4xl text-paper-text font-light italic">
              Stop typing. Just talk.
            </p>
            <p className="text-sm md:text-base text-paper-muted font-sans">
              Turn spoken thoughts into structured, sendable content
            </p>
          </div>
        )}

        {/* --- THE INSTRUMENT BOX (Unified Interface) --- */}
        <div className="w-full bg-ink-surface border border-ink-border  relative overflow-hidden transition-all duration-500 min-h-[400px] flex flex-col">

          {/* STATE: GENERATING ANIMATION */}
          {appState === 'GENERATING' && (
            <div className="absolute inset-0 bg-ink-base z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="relative">
                <div className="absolute -inset-4 bg-oxide-red/20 blur-xl rounded-full animate-pulse" />
                <SparklesIcon className="w-12 h-12 text-oxide-red animate-spin-slow" />
              </div>
              <p className="mt-6 text-xs font-mono uppercase tracking-[0.3em] text-paper-muted animate-pulse">
                Processing your feedback...
              </p>
            </div>
          )}


          {/* BODY OF BOX */}
          <div className="flex-1 relative flex flex-col">

            {/* 1. CONFIG STATE (Ready) */}
            {appState === 'CONFIG' && (
              <div className="flex-1 flex flex-col md:flex-row animate-in fade-in duration-500">
                {/* LEFT: Configuration Grid */}
                <div className="flex-1 flex flex-col border-r border-ink-border/50">
                  <div className="px-6 py-3 border-b border-ink-border/50">
                    <h2 className="text-[10px] font-sans font-bold uppercase tracking-widest text-paper-muted">
                      <span className="text-oxide-red">1.</span> Set context
                    </h2>
                  </div>
                  <div className="flex-1 p-6 grid grid-cols-2 gap-4 content-start">
                    {/* Doc Type Selector */}
                    <div className="col-span-2 space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-paper-muted">Format</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(() => {
                          // Default formats and their internal keys
                          const defaultFormats: { key: DocType; label: string }[] = [
                            { key: 'SUMMARY', label: 'SUMMARY' },
                            { key: 'EMAIL_DRAFT', label: 'EMAIL' },
                            { key: 'MEETING_NOTES', label: 'NOTES' },
                            { key: 'LINKEDIN_POST', label: 'SOCIAL' },
                          ];

                          // Check if current selection is outside defaults
                          const isCustomFormat = !defaultFormats.some(f => f.key === config.docType);

                          // Build display formats: if custom selected, put it first and remove last default
                          let displayFormats: { key: DocType; label: string }[] = [...defaultFormats];
                          if (isCustomFormat) {
                            const customLabel = ALL_FORMATS.find(f => f.key === config.docType)?.label || config.docType;
                            displayFormats = [
                              { key: config.docType, label: customLabel.toUpperCase() },
                              ...defaultFormats.slice(0, 3)
                            ];
                          }

                          return displayFormats.map((format) => {
                            const isActive = config.docType === format.key;
                            return (
                              <button
                                key={format.key}
                                onClick={() => setConfig({ ...config, docType: format.key })}
                                className={`h-10 text-[9px] font-bold uppercase tracking-wide border  transition-all
                                ${isActive
                                    ? 'bg-oxide-red text-white border-oxide-red'
                                    : 'bg-transparent text-paper-muted border-ink-border hover:border-paper-muted hover:text-paper-text'}
                              `}
                              >
                                {format.label}
                              </button>
                            );
                          });
                        })()}
                      </div>
                      <button
                        onClick={() => setShowFormats(true)}
                        className="w-full text-center text-[9px] uppercase tracking-widest text-paper-muted hover:text-oxide-red transition-colors pt-2"
                      >
                        + More Formats
                      </button>
                    </div>

                    {/* Style Selector */}
                    <div className="col-span-2 space-y-2 mt-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-paper-muted">Tone</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['CASUAL', 'PROFESSIONAL', 'DIRECT', 'CREATIVE'].map((s) => {
                          const styleMap: any = { 'CASUAL': 'CONVERSATIONAL', 'PROFESSIONAL': 'PROFESSIONAL', 'DIRECT': 'DIRECT', 'CREATIVE': 'CREATIVE' };
                          const isActive = config.style === styleMap[s];
                          return (
                            <button
                              key={s}
                              onClick={() => setConfig({ ...config, style: styleMap[s] })}
                              className={`h-10 text-[9px] font-bold uppercase tracking-wide border  transition-all
                                                    ${isActive
                                  ? 'bg-ink-surface border-oxide-red text-oxide-red'
                                  : 'bg-transparent text-paper-muted border-ink-border hover:border-paper-muted hover:text-paper-text'}
                                                `}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Detail Level Slider */}
                    <div className="col-span-2 space-y-3 mt-4 pt-4 border-t border-ink-border/50">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-paper-muted">Detail Level</label>
                        <span className="text-[9px] text-oxide-red font-bold uppercase">
                          {config.length === 'VERY_CONCISE' && 'Very Concise'}
                          {config.length === 'CONCISE' && 'Concise'}
                          {config.length === 'BALANCED' && 'Balanced'}
                          {config.length === 'DETAILED' && 'Detailed'}
                          {config.length === 'VERY_DETAILED' && 'Very Detailed'}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="4"
                          value={['VERY_CONCISE', 'CONCISE', 'BALANCED', 'DETAILED', 'VERY_DETAILED'].indexOf(config.length)}
                          onChange={(e) => {
                            const levels: Array<'VERY_CONCISE' | 'CONCISE' | 'BALANCED' | 'DETAILED' | 'VERY_DETAILED'> = ['VERY_CONCISE', 'CONCISE', 'BALANCED', 'DETAILED', 'VERY_DETAILED'];
                            setConfig({ ...config, length: levels[parseInt(e.target.value)] });
                          }}
                          className="w-full h-1 bg-ink-border rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-4
                          [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-oxide-red
                          [&::-webkit-slider-thumb]:border-2
                          [&::-webkit-slider-thumb]:border-ink-base
                          [&::-webkit-slider-thumb]:shadow-lg
                          [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:transition-transform
                          [&::-webkit-slider-thumb]:hover:scale-110
                          [&::-moz-range-thumb]:w-4
                          [&::-moz-range-thumb]:h-4
                          [&::-moz-range-thumb]:rounded-full
                          [&::-moz-range-thumb]:bg-oxide-red
                          [&::-moz-range-thumb]:border-2
                          [&::-moz-range-thumb]:border-ink-base
                          [&::-moz-range-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-[8px] text-paper-muted">Concise</span>
                          <span className="text-[8px] text-paper-muted">Detailed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Record Trigger */}
                <div className="flex-1 flex flex-col">
                  <div className="px-6 py-3 border-b border-ink-border/50">
                    <h2 className="text-[10px] font-sans font-bold uppercase tracking-widest text-paper-muted">
                      <span className="text-oxide-red">2.</span> Speak freely
                    </h2>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {speechSupported === false ? (
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-ink-base border border-ink-border flex items-center justify-center mb-6">
                          <MicrophoneIcon className="w-8 h-8 text-paper-muted opacity-50" />
                        </div>
                        <p className="text-sm text-paper-muted mb-2">Speech recognition not supported</p>
                        <p className="text-xs text-paper-muted/60 max-w-xs">
                          Please use Chrome, Edge, or Safari for voice recording
                        </p>
                      </div>
                    ) : (
                      <div className="relative group cursor-pointer" onClick={speechSupported ? startRecording : undefined}>
                        <div className="absolute -inset-8 bg-oxide-red/5 rounded-full blur-xl group-hover:bg-oxide-red/10 transition-all duration-500" />
                        <button
                          disabled={speechSupported === null}
                          className="relative w-24 h-24 rounded-full bg-ink-base border border-ink-border shadow-2xl flex items-center justify-center group-hover:scale-105 group-hover:border-paper-muted transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
                        >
                          <MicrophoneIcon className="w-8 h-8 text-paper-muted group-hover:text-paper-text transition-colors" />
                        </button>
                      </div>
                    )}
                    {speechSupported !== false && (
                      <div className="mt-8 text-center">
                        {speechSupported === null ? (
                          <p className="text-sm font-serif italic text-paper-muted">Checking browser support...</p>
                        ) : (
                          <>
                            <p className="text-base font-serif text-paper-text">Start talking. Take your time.</p>
                            <p className="text-sm text-paper-muted mt-1">We'll handle the structure.</p>
                            <p className="text-xs text-paper-muted/70 mt-2 uppercase tracking-widest">No signup. Free.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. RECORDING STATE */}
            {appState === 'RECORDING' && (
              <div className="flex-1 flex flex-col relative animate-in zoom-in-95 duration-300">
                {/* Format Header with Settings Toggle */}
                <div className="px-8 py-4 border-b border-ink-border/50 flex justify-between items-start">
                  <div>
                    <h2 className="text-[10px] font-sans font-bold uppercase tracking-widest text-oxide-red mb-1">
                      {RECORDING_PROMPTS[config.docType]?.title || 'Recording'}
                    </h2>
                    <p className="text-sm font-serif italic text-paper-muted">
                      {RECORDING_PROMPTS[config.docType]?.prompt || 'Just speak naturally.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRecordingSettings(!showRecordingSettings)}
                    className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold transition-colors px-3 py-1.5 border rounded ${showRecordingSettings
                      ? 'bg-oxide-red text-white border-oxide-red'
                      : 'text-paper-muted border-ink-border hover:border-paper-muted hover:text-paper-text'
                      }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Context
                  </button>
                </div>

                {/* Collapsible Settings Panel */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out border-b border-ink-border/50 ${showRecordingSettings ? 'max-h-[280px] opacity-100' : 'max-h-0 opacity-0 border-b-0'
                  }`}>
                  <div className="p-6 bg-ink-base/50 space-y-4">
                    {/* Format Row */}
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-paper-muted">Format</label>
                      <div className="flex flex-wrap gap-2">
                        {[{ key: 'SUMMARY', label: 'Summary' }, { key: 'EMAIL_DRAFT', label: 'Email' }, { key: 'MEETING_NOTES', label: 'Notes' }, { key: 'LINKEDIN_POST', label: 'Social' }].map((format) => (
                          <button
                            key={format.key}
                            onClick={() => setConfig({ ...config, docType: format.key as DocType })}
                            className={`h-8 px-3 text-[9px] font-bold uppercase tracking-wide border rounded transition-all ${config.docType === format.key
                              ? 'bg-oxide-red text-white border-oxide-red'
                              : 'bg-transparent text-paper-muted border-ink-border hover:border-paper-muted hover:text-paper-text'
                              }`}
                          >
                            {format.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setShowFormats(true)}
                          className="h-8 px-3 text-[9px] font-bold uppercase tracking-wide text-paper-muted hover:text-oxide-red transition-colors"
                        >
                          + More
                        </button>
                      </div>
                    </div>

                    {/* Tone Row */}
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-paper-muted">Tone</label>
                      <div className="flex flex-wrap gap-2">
                        {[{ key: 'CONVERSATIONAL', label: 'Casual' }, { key: 'PROFESSIONAL', label: 'Pro' }, { key: 'DIRECT', label: 'Direct' }, { key: 'CREATIVE', label: 'Creative' }].map((tone) => (
                          <button
                            key={tone.key}
                            onClick={() => setConfig({ ...config, style: tone.key as WritingStyle })}
                            className={`h-8 px-3 text-[9px] font-bold uppercase tracking-wide border rounded transition-all ${config.style === tone.key
                              ? 'bg-ink-surface border-oxide-red text-oxide-red'
                              : 'bg-transparent text-paper-muted border-ink-border hover:border-paper-muted hover:text-paper-text'
                              }`}
                          >
                            {tone.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Detail Level Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-paper-muted">Detail Level</label>
                        <span className="text-[9px] text-oxide-red font-bold uppercase">
                          {config.length === 'VERY_CONCISE' && 'Very Concise'}
                          {config.length === 'CONCISE' && 'Concise'}
                          {config.length === 'BALANCED' && 'Balanced'}
                          {config.length === 'DETAILED' && 'Detailed'}
                          {config.length === 'VERY_DETAILED' && 'Very Detailed'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        value={['VERY_CONCISE', 'CONCISE', 'BALANCED', 'DETAILED', 'VERY_DETAILED'].indexOf(config.length)}
                        onChange={(e) => {
                          const levels: Array<'VERY_CONCISE' | 'CONCISE' | 'BALANCED' | 'DETAILED' | 'VERY_DETAILED'> = ['VERY_CONCISE', 'CONCISE', 'BALANCED', 'DETAILED', 'VERY_DETAILED'];
                          setConfig({ ...config, length: levels[parseInt(e.target.value)] });
                        }}
                        className="w-full h-1 bg-ink-border rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-4
                          [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-oxide-red
                          [&::-webkit-slider-thumb]:border-2
                          [&::-webkit-slider-thumb]:border-ink-base
                          [&::-webkit-slider-thumb]:shadow-lg
                          [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-moz-range-thumb]:w-4
                          [&::-moz-range-thumb]:h-4
                          [&::-moz-range-thumb]:rounded-full
                          [&::-moz-range-thumb]:bg-oxide-red
                          [&::-moz-range-thumb]:border-2
                          [&::-moz-range-thumb]:border-ink-base
                          [&::-moz-range-thumb]:cursor-pointer"
                      />
                      <div className="flex justify-between">
                        <span className="text-[8px] text-paper-muted">Concise</span>
                        <span className="text-[8px] text-paper-muted">Detailed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrolling Text Field */}
                <div className={`flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-ink-border scrollbar-track-transparent transition-all duration-300 ${showRecordingSettings ? 'max-h-[200px]' : 'max-h-[350px]'
                  }`}>
                  <p className="font-serif text-lg leading-relaxed text-paper-text/90 whitespace-pre-wrap">
                    {finalTranscript} <span className="text-paper-muted">{transcript}</span>
                    <span className="inline-block w-1.5 h-4 ml-1 bg-oxide-red animate-pulse align-middle" />
                  </p>
                </div>

                {/* Bottom Control Bar - Calm, No Anxiety */}
                <div className="border-t border-ink-border bg-ink-base/80 backdrop-blur px-8 py-4">
                  {/* Progress Bar Section - Fills left-to-right, represents included content */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <MechanicalMeter audioLevels={audioLevels} />
                        <span className="text-sm font-serif italic text-paper-text">Listening...</span>
                      </div>
                      {/* Subtle helper text when past free limit */}
                      {!isPro && pastFreeLimit && (
                        <span className="text-[10px] text-paper-muted italic animate-in fade-in duration-500">
                          Free summary limit reached — keep talking.
                        </span>
                      )}
                    </div>
                    {/* Progress Bar - fills over FREE_LIMIT, stays full after */}
                    <div className="relative h-2 bg-ink-border/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-oxide-red to-orange-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min((recordingSeconds / FREE_LIMIT) * 100, 100)}%` }}
                      />
                      {/* Tick mark at free limit */}
                      {!isPro && (
                        <div className="absolute right-0 top-0 h-full w-0.5 bg-paper-muted/30" />
                      )}
                    </div>
                    <p className="text-[10px] text-paper-muted/60 mt-1.5 font-sans">
                      Say what you need — we'll structure it for you.
                    </p>
                  </div>

                  {/* Finish Button Row */}
                  <div className="flex items-center justify-end">
                    <button
                      onClick={stopRecording}
                      className="h-10 px-6 bg-oxide-red hover:bg-orange-700 text-white flex items-center gap-2 transition-all shadow-lg shadow-oxide-red/20 rounded"
                    >
                      <span className="text-[10px] uppercase tracking-widest font-bold">Finish</span>
                      <div className="w-4 h-4 bg-white/20 flex items-center justify-center rounded-sm">
                        <div className="w-2 h-2 bg-white rounded-[1px]" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. RESULT STATE */}
            {appState === 'RESULT' && (
              <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Top Bar with Back Button */}
                <div className="shrink-0 border-b border-ink-border px-6 py-3 flex items-center">
                  <button onClick={() => { setAppState('CONFIG'); setResult(''); setFinalTranscript(''); }} className="text-[10px] uppercase font-bold text-paper-muted hover:text-paper-text transition-colors flex items-center gap-2">
                    ← New Note
                  </button>
                </div>

                {/* Result Text - SCROLLABLE */}
                <div ref={resultRef} className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-ink-border scrollbar-track-transparent">
                  {error ? (
                    <div className="p-4 bg-red-950/20 border border-red-900/50 ">
                      <p className="text-sm text-red-200">{error}</p>
                      <button onClick={() => setAppState('CONFIG')} className="mt-4 text-xs text-red-500 underline">Reset</button>
                    </div>
                  ) : (
                    <>
                      <article className="prose prose-invert prose-p:text-paper-text/90 prose-headings:font-normal prose-headings:text-paper-text prose-strong:text-oxide-red prose-li:text-paper-text/80 prose-xs md:prose-sm max-w-none font-serif leading-relaxed">
                        <ReactMarkdown>{result}</ReactMarkdown>
                      </article>

                      {/* Upgrade Nudge - Only show if user went past free limit */}
                      {!isPro && pastFreeLimit && (
                        <div className="mt-8 p-6 bg-ink-base/50 border border-ink-border rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <h4 className="text-base font-serif text-paper-text mb-2">Want the full breakdown?</h4>
                          <p className="text-sm text-paper-muted mb-4">
                            Upgrade to include everything you said, with deeper structure, examples, and tone refinement.
                          </p>
                          <button
                            onClick={() => { setUpsellMode('UPGRADE'); setShowUpsell(true); }}
                            className="px-5 py-2.5 bg-oxide-red hover:bg-orange-700 text-white text-[10px] uppercase tracking-widest font-bold rounded transition-colors shadow-lg shadow-oxide-red/20"
                          >
                            Unlock full summary
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Actions Footer - Share integrations + Copy */}
                <div className="shrink-0 border-t border-ink-border p-4 bg-ink-base/90 backdrop-blur-md flex justify-between items-center gap-4">
                  <IntegrationGrid
                    contentType={config.docType}
                    maxVisible={5}
                    onUpgrade={() => { setUpsellMode('UPGRADE'); setShowUpsell(true); }}
                    text={result}
                  />
                  <CopyButton text={result} />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Feature Cards - Only show in CONFIG state */}
        {appState === 'CONFIG' && <FeatureCards />}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-ink-border mt-auto bg-ink-base">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-widest text-paper-muted">
          <div className="flex gap-6">
            <a href="#" className="hover:text-paper-text transition-colors">Privacy</a>
            <a href="#" className="hover:text-paper-text transition-colors">Terms</a>
            <a href="#" className="hover:text-paper-text transition-colors">About</a>
          </div>
          <p className="opacity-50">© 2026 ONE SIX TWO Ltd.</p>
        </div>
      </footer>

      <UpsellModal
        isOpen={showUpsell}
        onClose={() => setShowUpsell(false)}
        onUpgrade={handleUpgrade}
        mode={upsellMode}
      />
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onLoginRequired={() => {
          setShowPricing(false);
          router.push('/login?redirect=/?upgrade=true');
        }}
      />
      <FormatModal
        isOpen={showFormats}
        onClose={() => setShowFormats(false)}
        onSelect={(format) => setConfig({ ...config, docType: format })}
        currentFormat={config.docType}
      />
      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        isPro={isPro}
        onSelectItem={handleSelectHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onUpgrade={() => { setShowHistory(false); setUpsellMode('UPGRADE'); setShowUpsell(true); }}
      />
    </div>
  );
}

function HomeLoading() {
  return (
    <div className="min-h-screen bg-ink-base flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-oxide-red border-t-transparent rounded-full" />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
