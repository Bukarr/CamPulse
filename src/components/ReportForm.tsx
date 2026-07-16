import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Sparkles, Send, WifiOff, CheckCircle, Search, ChevronDown, Check, X, MessageSquare, Mic, Trash2, Shield, Calendar, RefreshCcw } from 'lucide-react';
import { ReportCategory, OfflineReportQueueItem } from '../types';
import { findZoneForCoordinates, abuZones } from '../data/abuZones';
import { addOfflineReport, getOfflineReports } from '../utils/offlineQueue';

interface ReportFormProps {
  userId: string;
  reportingCoords: { lat: number; lng: number } | null;
  onSuccess: () => void;
  onCancel: () => void;
  onReportingCoordsChange?: (lat: number, lng: number) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
  photoUrl?: string;
  voiceUrl?: string;
  isTicket?: boolean;
  ticketData?: any;
}

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  broken_lights: { label: 'Broken Lights', icon: '💡' },
  plumbing: { label: 'Plumbing / Water Leaks', icon: '🚰' },
  wifi_outage: { label: 'WiFi / Network Outage', icon: '📶' },
  security: { label: 'Security Concern', icon: '🚨' },
  structural: { label: 'Structural / Wall Damage', icon: '🧱' },
  others: { label: 'Other Infrastructure', icon: '🔧' }
};

export default function ReportForm({ userId, reportingCoords, onSuccess, onCancel, onReportingCoordsChange }: ReportFormProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! 🤖 I am your **CamPulse AI Intake Assistant** for Ahmadu Bello University.\n\nI can help you file maintenance tickets directly to campus administrators using natural language. \n\n**How to report:**\n1. Type your complaint below (e.g. *"The water pipes are leaking at Amina Hostel"*).\n2. Specify the location.\n3. Add a photo or record a voice note in Hausa, English, or Pidgin.\n4. Click **🚀 Submit Report** to let me automatically classify, cluster, and register the issue!`,
      timestamp: new Date()
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locSearch, setLocSearch] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Photo state
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceBase64, setVoiceBase64] = useState<string | undefined>(undefined);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState<any>(null);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineReportQueueItem[]>([]);

  // Load and sync offline queue state
  useEffect(() => {
    const loadQueue = async () => {
      const queue = await getOfflineReports();
      setOfflineQueue(queue);
    };
    loadQueue();
    window.addEventListener('storage', loadQueue);
    window.addEventListener('campulse-offline-queue-updated', loadQueue);
    const interval = setInterval(loadQueue, 3000);
    return () => {
      window.removeEventListener('storage', loadQueue);
      window.removeEventListener('campulse-offline-queue-updated', loadQueue);
      clearInterval(interval);
    };
  }, []);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Monitor network connection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Voice recording implementation
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setVoiceBase64(base64);
          
          // Append user record attachment to chat feed for feedback
          setChatMessages(prev => [
            ...prev,
            {
              id: `system-voice-${Date.now()}`,
              sender: 'system',
              text: `🎙️ Voice report note attached (${recordingDuration}s)`,
              timestamp: new Date()
            }
          ]);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      setError(null);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setError('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Handle Photo uploading
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Photo is too large. Please upload an image smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoBase64(base64);

      // Append system message
      setChatMessages(prev => [
        ...prev,
        {
          id: `system-photo-${Date.now()}`,
          sender: 'system',
          text: `📷 Proof photo attached: "${file.name}"`,
          timestamp: new Date(),
          photoUrl: base64
        }
      ]);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const detectedZone = reportingCoords 
    ? findZoneForCoordinates(reportingCoords.lat, reportingCoords.lng) 
    : null;

  // Append pinned coordinates update on mount or change
  useEffect(() => {
    if (detectedZone) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `sys-zone-${Date.now()}`,
          sender: 'system',
          text: `📍 Pinned Location: **${detectedZone.name}**\n*Coordinates auto-detected.*`,
          timestamp: new Date()
        }
      ]);
    }
  }, [detectedZone?.id]);

  const getZoneCenter = (zone: any): { lat: number; lng: number } => {
    const lngs = zone.coordinates.map((c: any) => c[0]);
    const lats = zone.coordinates.map((c: any) => c[1]);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    return { lat: centerLat, lng: centerLng };
  };

  const filteredLocations = abuZones.filter((zone) =>
    zone.name.toLowerCase().includes(locSearch.toLowerCase()) ||
    zone.description.toLowerCase().includes(locSearch.toLowerCase())
  );

  // Submit report trigger
  const handleFormSubmission = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!reportingCoords) {
      setError('Please choose a campus location or drop a pin on the map first.');
      return;
    }

    if (!inputText.trim() && !voiceBase64) {
      setError('Please provide some details. Type a complaint message or record a voice note.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Append user's action message
    const userMessageText = inputText.trim() || "🎙️ Voice Report Submitted";
    setChatMessages(prev => [
      ...prev,
      {
        id: `user-submit-${Date.now()}`,
        sender: 'user',
        text: userMessageText,
        timestamp: new Date()
      }
    ]);

    const activeZone = findZoneForCoordinates(reportingCoords.lat, reportingCoords.lng);
    const zoneId = activeZone ? activeZone.id : 'zone-other';
    const zoneName = activeZone ? activeZone.name : 'ABU Campus';

    const payload = {
      reporter_id: userId,
      description: userMessageText,
      lat: reportingCoords.lat,
      lng: reportingCoords.lng,
      zone_id: zoneId,
      zone_name: zoneName,
      is_anonymous: isAnonymous,
      photo_url: photoBase64,
      voice_url: voiceBase64
    };

    if (isOffline) {
      // Offline queue flow
      try {
        const tempReportItem: OfflineReportQueueItem = {
          tempId: `temp-${Date.now()}`,
          category: 'others',
          description: userMessageText,
          photo_url: photoBase64,
          lat: reportingCoords.lat,
          lng: reportingCoords.lng,
          is_anonymous: isAnonymous,
          created_at: new Date().toISOString()
        };

        await addOfflineReport(tempReportItem);

        setChatMessages(prev => [
          ...prev,
          {
            id: `ai-offline-${Date.now()}`,
            sender: 'ai',
            text: `🛜 **Offline Mode Detected!**\n\nI have successfully queued your report inside your device's offline memory buffer. It will automatically synchronize and submit to the administration the moment you get back online.`,
            timestamp: new Date(),
            isTicket: true,
            ticketData: {
              id: `OFFLINE-QUEUE`,
              category: 'others',
              zone_name: zoneName,
              description: userMessageText,
              status: 'queued',
              priority_score: 2,
              created_at: new Date().toISOString()
            }
          }
        ]);

        setInputText('');
        setPhotoBase64(undefined);
        setVoiceBase64(undefined);
      } catch (err) {
        setError('Failed to cache report locally.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Standard online submission
    try {
      // Append AI typing helper
      setChatMessages(prev => [
        ...prev,
        {
          id: `ai-typing-${Date.now()}`,
          sender: 'ai',
          text: `⚙️ **Gemma 4 AI is triaging your complaint...**\nTranscribing language inputs, parsing severity index, and clustering duplicate hotspots...`,
          timestamp: new Date()
        }
      ]);

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server error submitting report');
      }

      const responseData = await res.json();

      // Clean typing helper & insert success block
      setChatMessages(prev => {
        const filtered = prev.filter(m => !m.id.startsWith('ai-typing'));
        return [
          ...filtered,
          {
            id: `ai-success-${Date.now()}`,
            sender: 'ai',
            text: responseData.merged
              ? `🔄 **Duplicate Hotspot Detected!**\nI've matched your report with an existing unresolved ticket at this location. I have merged your submission to consolidate weight, upvoted the parent ticket on your behalf, and notified the maintenance team.`
              : `🎉 **Report Filed Successfully!**\nOur Gemma 4 AI engine has triaged this complaint, auto-classified its category, calculated the priority score, and successfully registered it on the campus admin dashboard.`,
            timestamp: new Date(),
            isTicket: true,
            ticketData: responseData.report || responseData
          }
        ];
      });

      setInputText('');
      setPhotoBase64(undefined);
      setVoiceBase64(undefined);
    } catch (err: any) {
      // Clean typing loader and show error
      setChatMessages(prev => prev.filter(m => !m.id.startsWith('ai-typing')));
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple parser to strip all markdown (asterisks, hashtags) and render clean plain-text
  const formatMsgText = (text: string) => {
    if (!text) return null;
    const cleanedText = text.replace(/[*#]/g, '');
    return cleanedText.split('\n').map((line, idx) => {
      return line.trim() === '' ? (
        <div key={idx} className="h-2" />
      ) : (
        <p key={idx} className="text-xs leading-relaxed text-slate-600 mt-1 font-sans">
          {line}
        </p>
      );
    });
  };

  return (
    <div id="ai-report-intake-stage" className="bg-slate-50 rounded-2xl border border-slate-200 shadow-xl max-w-lg mx-auto flex flex-col h-[650px] overflow-hidden">
      
      {/* Top Banner Header */}
      <header className="p-3 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 font-sans tracking-tight">AI intake Terminal</h3>
            <p className="text-[9px] text-slate-400 font-medium">Ahmadu Bello University Automated Maintenance Dispatch</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {isOffline ? (
            <span className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200/60 px-2 py-0.5 rounded-full text-[8px] font-bold font-mono">
              <WifiOff size={10} /> OFFLINE
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[8px] font-bold font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> AI ONLINE
            </span>
          )}
        </div>
      </header>

      {/* Errors alert */}
      {error && (
        <div className="p-2.5 bg-rose-50 border-b border-rose-100 text-rose-600 text-[11px] font-medium flex items-center justify-between shrink-0">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 font-bold p-1">✕</button>
        </div>
      )}

      {/* Scrollable Chat Feed area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {chatMessages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="bg-slate-200/60 border border-slate-300/30 rounded-xl px-3 py-1 text-[10px] text-slate-500 font-medium flex items-center gap-1.5 font-sans">
                  <span>{msg.text}</span>
                  {msg.photoUrl && (
                    <img src={msg.photoUrl} className="w-4 h-4 rounded object-cover border border-slate-300" />
                  )}
                </div>
              </div>
            );
          }

          const isAi = msg.sender === 'ai';

          return (
            <div key={msg.id} className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'} max-w-full`}>
              
              {isAi && (
                <div className="w-7 h-7 rounded-xl bg-slate-200 text-emerald-800 border border-slate-300/40 flex items-center justify-center text-xs font-bold shrink-0 self-start shadow-2xs">
                  🤖
                </div>
              )}

              <div className="flex flex-col space-y-1 max-w-[85%]">
                <div className={`p-3 rounded-2xl text-xs font-sans shadow-2xs leading-relaxed ${
                  isAi 
                    ? 'bg-white border border-slate-200 rounded-tl-none text-slate-700' 
                    : 'bg-emerald-600 text-white rounded-tr-none'
                }`}>
                  {formatMsgText(msg.text)}

                  {/* Render interactive Ticket badge card if present */}
                  {msg.isTicket && msg.ticketData && (
                    <div className="mt-3 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          🎫 {msg.ticketData.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase ${
                          msg.ticketData.status === 'resolved' 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          ● {msg.ticketData.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 block uppercase font-bold text-[8px]">Category</span>
                          <span className="font-bold text-slate-200">
                            {CATEGORIES[msg.ticketData.category]?.icon || '🔧'} {CATEGORIES[msg.ticketData.category]?.label || msg.ticketData.category}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase font-bold text-[8px]">Campus Zone</span>
                          <span className="font-bold text-slate-200 truncate block">
                            📍 {msg.ticketData.zone_name || 'ABU Campus'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-800/40 p-2 rounded-lg text-[10px] border border-slate-800/30 leading-snug">
                        <span className="text-slate-500 block uppercase font-bold text-[8px] mb-0.5">Triaged description</span>
                        <span className="italic text-slate-300 line-clamp-2">"{msg.ticketData.description}"</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9px]">
                        <span className="text-slate-400 font-mono">
                          Severity: <strong className="text-rose-400 font-bold uppercase">{msg.ticketData.severity || 'medium'}</strong>
                        </span>
                        <button
                          onClick={onSuccess}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded-md transition-colors flex items-center gap-0.5"
                        >
                          Track on Feed →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <span className={`text-[8px] text-slate-400 font-mono ${!isAi && 'self-end'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isSubmitting && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-slate-200 text-emerald-800 border border-slate-300/40 flex items-center justify-center text-xs font-bold shrink-0 self-start">
              🤖
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Control Actions & Media Attachment Bar */}
      <div className="bg-white border-t border-slate-200 p-3.5 space-y-2.5 shrink-0">
        
        {/* Dynamic Horizontal Attachments Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          
          {/* 1. Location Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold font-sans transition-all cursor-pointer ${
                reportingCoords 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin size={12} className={reportingCoords ? 'text-emerald-600' : 'text-slate-400'} />
              {detectedZone ? detectedZone.name : 'Choose Location *'}
              <ChevronDown size={11} className="text-slate-400 ml-0.5" />
            </button>

            {dropdownOpen && (
              <div className="absolute bottom-full left-0 mb-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col z-50 w-60 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="p-2 border-b border-slate-100 flex items-center gap-1 bg-slate-50/50">
                  <Search size={12} className="text-slate-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    placeholder="Search ABU directory..."
                    value={locSearch}
                    onChange={(e) => setLocSearch(e.target.value)}
                    className="w-full bg-transparent border-none text-[10px] text-slate-700 focus:outline-none py-1"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto divide-y divide-slate-50 max-h-40 scrollbar-thin">
                  {filteredLocations.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-[10px]">
                      No matching locations.
                    </div>
                  ) : (
                    filteredLocations.map((zone) => {
                      const isSelected = detectedZone?.id === zone.id;
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => {
                            const center = getZoneCenter(zone);
                            onReportingCoordsChange?.(center.lat, center.lng);
                            setDropdownOpen(false);
                            setLocSearch('');
                          }}
                          className={`w-full text-left text-[10px] p-2 transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-700 font-bold'
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="block truncate font-bold text-slate-700">{zone.name}</span>
                          <span className="block truncate text-[8px] text-slate-400 mt-0.5">{zone.description}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Photo Attachment trigger */}
          <label className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold font-sans transition-all cursor-pointer ${
            photoBase64 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}>
            <Camera size={12} className={photoBase64 ? 'text-emerald-600' : 'text-slate-400'} />
            {photoBase64 ? 'Photo Attached ✓' : 'Add Photo Proof'}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>

          {/* 3. Voice Attachment trigger */}
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-rose-50 border-rose-200 text-rose-700 text-[10px] font-bold font-sans animate-pulse cursor-pointer"
            >
              <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
              Recording: {formatDuration(recordingDuration)} (Stop ⏹)
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold font-sans transition-all cursor-pointer ${
                voiceBase64 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Mic size={12} className={voiceBase64 ? 'text-emerald-600' : 'text-slate-400'} />
              {voiceBase64 ? 'Voice note attached ✓' : 'Record Hausa/Yoruba/Pidgin note'}
            </button>
          )}

          {/* Clean attachments if selected */}
          {(photoBase64 || voiceBase64) && (
            <button
              type="button"
              onClick={() => {
                setPhotoBase64(undefined);
                setVoiceBase64(undefined);
                setChatMessages(prev => [
                  ...prev,
                  {
                    id: `clear-attachments-${Date.now()}`,
                    sender: 'system',
                    text: '🗑️ All attached media discarded.',
                    timestamp: new Date()
                  }
                ]);
              }}
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 text-[9px] font-bold text-rose-600 cursor-pointer"
            >
              <Trash2 size={11} /> Clear media
            </button>
          )}
        </div>

        {/* Offline Queued Tickets Panel */}
        {offlineQueue.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200/50 p-2.5 rounded-xl space-y-1 text-slate-700 mb-2.5 font-sans shadow-xs">
            <div className="flex items-center justify-between text-[9px] font-bold text-amber-800 uppercase tracking-wide">
              <span className="flex items-center gap-1">🗄️ {offlineQueue.length} Pending Offline Ticket(s)</span>
              <span className="text-[7.5px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">Waiting for Network Sync</span>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1 divide-y divide-amber-100/40 pr-1 scrollbar-thin">
              {offlineQueue.map((item) => (
                <div key={item.tempId} className="flex justify-between items-center text-[9px] pt-1 first:pt-0">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800 block truncate">{item.description || 'Voice Note Report'}</span>
                    <span className="text-slate-500 text-[8px]">Category: {item.category.replace('_', ' ').toUpperCase()} • Lat/Lng: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}</span>
                  </div>
                  <span className="shrink-0 text-slate-400 font-mono text-[8px]">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Message Form area */}
        <form onSubmit={handleFormSubmission} className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSubmitting}
            placeholder="Type your complaint message here..."
            className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-500 text-slate-700 disabled:opacity-50 font-sans"
          />

          {/* Anonymous checkbox controller */}
          <div className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-2 rounded-xl border border-slate-200/50">
            <input
              type="checkbox"
              id="anonymous-checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="anonymous-checkbox" className="font-bold text-slate-500 cursor-pointer">Anon</label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!inputText.trim() && !voiceBase64)}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/15"
          >
            <Send size={13} />
            <span>Submit Report</span>
          </button>
        </form>

        {/* Action controls footer */}
        <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
          <span>* Pinned location coordinates required for submitting tickets.</span>
          <button 
            type="button" 
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-600 font-bold transition-all"
          >
            Cancel & Return to Map
          </button>
        </div>
      </div>

    </div>
  );
}
