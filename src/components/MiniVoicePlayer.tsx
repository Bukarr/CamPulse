import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface MiniVoicePlayerProps {
  audioUrl: string;
  interpretation?: string;
}

export const MiniVoicePlayer: React.FC<MiniVoicePlayerProps> = ({ audioUrl, interpretation }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Pattern of heights representing an audio waveform
  const waveformHeights = [25, 45, 80, 50, 95, 65, 30, 85, 40, 75, 100, 60, 35, 70, 90, 50, 30, 60, 85, 40];

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className={`bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-2xs transition-all my-1.5 ${
        isPlaying ? 'ring-2 ring-emerald-400/50 bg-emerald-100/70' : 'hover:bg-emerald-100/40'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs ${
            isPlaying 
              ? 'bg-emerald-600 text-white shadow-emerald-200' 
              : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
          }`}
          title={isPlaying ? "Pause voice note" : "Play voice note"}
        >
          {isPlaying ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-900 font-semibold mb-1">
            <span className="flex items-center gap-1">
              <Mic size={10} className={`text-emerald-600 ${isPlaying ? 'animate-bounce' : ''}`} />
              <span>Voice Note</span>
            </span>
            <span className="text-[9px] text-emerald-700">
              {formatTime(currentTime)} / {duration ? formatTime(duration) : '--:--'}
            </span>
          </div>

          {/* Mini Waveform Display */}
          <div 
            onClick={handleSeek}
            className="h-4 flex items-center gap-0.5 cursor-pointer py-0.5 px-1 bg-white/80 rounded-md border border-emerald-200/60 relative overflow-hidden group"
            title="Click waveform to seek"
          >
            {/* Progress fill */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-emerald-200/60 transition-all duration-75 pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            />

            {waveformHeights.map((heightPct, idx) => {
              const barProgress = (idx / waveformHeights.length) * 100;
              const isPlayed = barProgress <= progressPercent;

              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-150 relative z-10 ${
                    isPlayed 
                      ? 'bg-emerald-600' 
                      : 'bg-emerald-300/70 group-hover:bg-emerald-400'
                  }`}
                  style={{
                    height: `${heightPct}%`
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {interpretation && (
        <p className="text-[10px] text-emerald-900/90 italic font-sans border-t border-emerald-200/60 pt-1 line-clamp-1 px-0.5">
          💬 "{interpretation}"
        </p>
      )}
    </div>
  );
};

export default MiniVoicePlayer;
