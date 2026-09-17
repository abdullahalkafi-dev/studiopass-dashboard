"use client";

import AudioPlayer from "@/components/ui/audio-player";
import { resolveUrl } from "@/lib/utils";

interface ChatMessageMediaProps {
  msg: {
    content?: string | null;
    imageUrl?: string | null;
    stickerUrl?: string | null;
    audioUrl?: string | null;
    audioDuration?: number | null;
    waveform?: number[] | null;
    mediaType?: string | null;
  };
  onImageClick?: (url: string) => void;
  /** Show text content above media when present */
  showContent?: boolean;
}

/**
 * Single render path for listener/station media in dashboard chat bubbles:
 * text → image → sticker → voice note. Sticker paths under /stickers stay on-origin.
 */
export function ChatMessageMedia({ msg, onImageClick, showContent = true }: ChatMessageMediaProps) {
  const imageUrl = msg.imageUrl ? resolveUrl(msg.imageUrl) || msg.imageUrl : null;
  const stickerSrc = msg.stickerUrl ? resolveUrl(msg.stickerUrl) || msg.stickerUrl : null;
  const audioSrc = msg.audioUrl ? resolveUrl(msg.audioUrl) : undefined;

  return (
    <>
      {showContent && msg.content ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      ) : null}

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Attachment"
          onClick={() => onImageClick?.(msg.imageUrl!)}
          className="mt-2 max-h-64 w-auto max-w-full rounded-lg object-contain cursor-pointer border border-border hover:opacity-90 transition-opacity"
        />
      )}

      {stickerSrc && (
        <div className="mt-2">
          <img
            src={stickerSrc}
            alt="Sticker"
            className="h-24 w-24 sm:h-28 sm:w-28 object-contain"
          />
        </div>
      )}

      {audioSrc && (
        <div className="mt-2">
          <AudioPlayer
            src={audioSrc}
            duration={msg.audioDuration ?? undefined}
            waveform={msg.waveform ?? undefined}
          />
        </div>
      )}
    </>
  );
}
