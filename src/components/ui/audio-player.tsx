"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src: string | undefined;
  duration?: number;
  waveform?: number[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src, duration, waveform }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setTotalDuration(audio.duration);
      setIsLoaded(true);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !totalDuration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      audio.currentTime = percentage * totalDuration;
    },
    [totalDuration]
  );

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 max-w-[280px]">
      <audio ref={audioRef} src={src ?? undefined} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#02B2FF] flex items-center justify-center shrink-0 hover:bg-[#02B2FF]/80 transition-colors"
      >
        {isPlaying ? (
          <Pause size={14} className="text-white" fill="white" />
        ) : (
          <Play size={14} className="text-white ml-0.5" fill="white" />
        )}
      </button>

      {/* Waveform / Progress */}
      <div className="flex-1 min-w-0">
        {waveform && waveform.length > 0 ? (
          <div
            className="flex items-end gap-[2px] h-6 cursor-pointer"
            onClick={handleSeek}
          >
            {waveform.map((amp, i) => {
              const barProgress = (i / waveform.length) * 100;
              const isActive = barProgress <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full min-w-[2px] transition-colors duration-150 ${
                    isActive ? "bg-[#02B2FF]" : "bg-muted-foreground/30"
                  }`}
                  style={{ height: `${Math.max(amp * 100, 15)}%` }}
                />
              );
            })}
          </div>
        ) : (
          <div
            className="h-1.5 bg-muted-foreground/20 rounded-full cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-[#02B2FF] rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}
