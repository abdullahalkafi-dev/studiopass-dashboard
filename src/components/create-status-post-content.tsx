"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Image, Video, Upload, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery } from "@/features/station/stationApi";
import {
  useCreateStatusMutation,
  useUploadStatusMediaMutation,
  useUploadStatusVideoMutation,
} from "@/features/status/statusApi";
import { ImageCropModal } from "@/components/shared/image-crop-modal";

const DURATIONS = [
  { label: "24 Hours", hours: 24 },
  { label: "48 Hours", hours: 48 },
  { label: "72 Hours", hours: 72 },
  { label: "7 Days", hours: 168 },
];

/** Built-in StudioPass sticker pack (served from /stickers static assets). */
const BUILTIN_STICKERS = [
  { id: "heart", name: "Heart", url: "/stickers/heart.svg" },
  { id: "fire", name: "Fire", url: "/stickers/fire.svg" },
  { id: "mic", name: "Mic", url: "/stickers/mic.svg" },
  { id: "radio", name: "Radio", url: "/stickers/radio.svg" },
  { id: "clap", name: "Clap", url: "/stickers/clap.svg" },
  { id: "laugh", name: "Laugh", url: "/stickers/laugh.svg" },
  { id: "wow", name: "Wow", url: "/stickers/wow.svg" },
  { id: "thumbsup", name: "Thumbs Up", url: "/stickers/thumbsup.svg" },
  { id: "star", name: "Star", url: "/stickers/star.svg" },
  { id: "music", name: "Music", url: "/stickers/music.svg" },
  { id: "prayer", name: "Prayer", url: "/stickers/prayer.svg" },
  { id: "hello", name: "Hello", url: "/stickers/hello.svg" },
];

export default function CreateStatusPostContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);
  const userStationId = user?.stationId;
  const userPartnerId = user?.partnerId;

  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const isAuthorized = isSuperAdmin || isPartnerAdmin || isStationAdmin;
  const isStationScoped = isStationAdmin;

  const [contentType, setContentType] = useState<"Text" | "Image" | "Video" | "Sticker">("Text");
  const [content, setContent] = useState("");
  const [countryId, setCountryId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [stationId, setStationId] = useState("");
  const [duration, setDuration] = useState(DURATIONS[0]);

  // Sticker state
  const [stickerUrl, setStickerUrl] = useState<string | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Video trim (seconds) — when source is longer than Status max
  const [trimStartSec, setTrimStartSec] = useState(0);
  const [sourceDurationSec, setSourceDurationSec] = useState(0);
  const STATUS_MAX_VIDEO_SECONDS = 45;

  const EMOJI_LIST = [
    "😀","😂","🥰","😍","😎","🤔","😢","😡","👍","👏","🙏","💪",
    "🔥","❤️","💔","✨","🎉","🎵","🎤","📻","📺","⭐","💯","✅",
    "😭","🤗","😴","🤯","🥳","😇","🤝","🙌","❤","👏","🎶","📢",
  ];
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [compressedVideoFile, setCompressedVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Thumbnail state (for video)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Crop modal state (9:16 for status posts)
  const [cropConfig, setCropConfig] = useState<{
    isOpen: boolean;
    imageSrc: string | null;
    file: File | null;
    isForThumbnail?: boolean;
  }>({
    isOpen: false,
    imageSrc: null,
    file: null,
    isForThumbnail: false,
  });

  // Guard unauthorized roles (media_station, presenter)
  useEffect(() => {
    if (role && !isAuthorized) {
      toast.error("You don't have permission to create status posts");
      router.push("/campaigns/status-posts");
    }
  }, [role, isAuthorized, router]);

  // Auto-inject stationId for station_admin
  useEffect(() => {
    if (isStationScoped && userStationId) {
      setStationId(userStationId);
    }
  }, [isStationScoped, userStationId]);

  const { data: countriesData, isLoading: countriesLoading } = useGetCountriesQuery(undefined, { skip: !isSuperAdmin });
  const { data: partnersData, isLoading: partnersLoading } = useGetPartnersQuery({ limit: 100 }, { skip: !isSuperAdmin });
  const { data: stationsData, isLoading: stationsLoading } = useGetStationsQuery(
    {
      limit: 100,
      ...(isPartnerAdmin && userPartnerId ? { partner: userPartnerId } : {}),
      ...(isStationScoped && userStationId ? { station: userStationId } : {}),
    },
    { skip: isStationScoped }
  );

  const countries = countriesData?.data || [];
  const allPartners = partnersData?.data || [];
  const allStations = (stationsData?.data || []).filter((s: any) => s.category !== "channel");

  // Cascade: filter partners by country
  const partners = countryId
    ? allPartners.filter((p: any) => {
        const partnerCountry = typeof p.country === "object" ? (p.country?._id || p.country?.id) : p.country;
        return partnerCountry?.toString() === countryId;
      })
    : allPartners;

  // Cascade: filter stations by partner or country
  const stations = isPartnerAdmin
    ? allStations
    : partnerId
    ? allStations.filter((s: any) => {
        const stationPartner = typeof s.partner === "object" ? (s.partner?._id || s.partner?.id) : s.partner;
        return stationPartner?.toString() === partnerId;
      })
    : countryId
    ? allStations.filter((s: any) => {
        const stationCountry = typeof s.country === "object" ? (s.country?._id || s.country?.id) : s.country;
        return stationCountry?.toString() === countryId;
      })
    : allStations;

  const [createStatus, { isLoading: isCreating }] = useCreateStatusMutation();
  const [uploadMedia, { isLoading: isUploading }] = useUploadStatusMediaMutation();
  const [uploadVideo, { isLoading: isUploadingVideo }] = useUploadStatusVideoMutation();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be less than 20MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropConfig({
        isOpen: true,
        imageSrc: ev.target?.result as string,
        file,
        isForThumbnail: false,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCustomThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file for thumbnail");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropConfig({
        isOpen: true,
        imageSrc: ev.target?.result as string,
        file,
        isForThumbnail: true,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    if (cropConfig.isForThumbnail) {
      setThumbnailFile(croppedFile);
      setThumbnailPreview(previewUrl);
    } else {
      setImageFile(croppedFile);
      setImagePreview(previewUrl);
    }
    setCropConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeVideo = () => {
    setVideoFile(null);
    setCompressedVideoFile(null);
    setVideoPreview(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setCompressionProgress(0);
    setIsCompressing(false);
    setSourceDurationSec(0);
    setTrimStartSec(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  // Extract video frame at 1s for automatic thumbnail
  const generateVideoThumbnail = (file: File): Promise<{ file: File; previewUrl: string }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1.0, Math.max(0.1, video.duration / 2));
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 720;
          canvas.height = video.videoHeight || 1280;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(url);
                if (blob) {
                  const thumbFile = new File([blob], "video_thumb.webp", { type: "image/webp" });
                  resolve({ file: thumbFile, previewUrl: URL.createObjectURL(blob) });
                } else {
                  reject(new Error("Thumbnail blob generation failed"));
                }
              },
              "image/webp",
              0.85
            );
          }
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Video preview load failed"));
      };
    });
  };

  // In-browser compression + optional trim with ffmpeg.wasm
  const compressVideo = async (file: File, startSec = 0): Promise<File> => {
    try {
      setIsCompressing(true);
      setCompressionProgress(10);

      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress", ({ progress }) => {
        setCompressionProgress(Math.min(95, Math.max(10, Math.round(progress * 100))));
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setCompressionProgress(30);
      await ffmpeg.writeFile("input.mp4", await fetchFile(file));

      // Optimize for 9:16 mobile reel format (720p width, even height)
      // Enforce Status max duration (45s) and optional start offset
      const args = [
        ...(startSec > 0 ? ["-ss", String(startSec)] : []),
        "-i",
        "input.mp4",
        "-t",
        String(STATUS_MAX_VIDEO_SECONDS),
        "-vf",
        "scale=720:-2",
        "-c:v",
        "libx264",
        "-crf",
        "26",
        "-preset",
        "veryfast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "movflags",
        "+faststart",
        "output.mp4",
      ];
      await ffmpeg.exec(args);

      const data = (await ffmpeg.readFile("output.mp4")) as Uint8Array;
      const blob = new Blob([data as any], { type: "video/mp4" });
      const compressed = new File([blob], "status_compressed.mp4", { type: "video/mp4" });

      setCompressionProgress(100);
      return compressed;
    } catch (err) {
      console.warn("Client ffmpeg.wasm compression unavailable, using original file:", err);
      return file;
    } finally {
      setIsCompressing(false);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoMime = file.type.startsWith("video/") || file.name.toLowerCase().endsWith(".m4v");
    if (!isVideoMime) {
      toast.error("Please select a video file (MP4, MOV, M4V, WebM)");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      toast.error("Video file size must not exceed 150MB");
      return;
    }

    const videoObj = document.createElement("video");
    videoObj.preload = "metadata";
    const objUrl = URL.createObjectURL(file);
    videoObj.src = objUrl;

    videoObj.onloadedmetadata = async () => {
      URL.revokeObjectURL(objUrl);
      const sourceDuration = videoObj.duration;
      setTrimStartSec(0);

      if (!isFinite(sourceDuration) || sourceDuration <= 0) {
        toast.error("Could not read video duration. Please select another file.");
        return;
      }

      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setSourceDurationSec(sourceDuration);
      setTrimStartSec(0);

      // 1. Auto generate thumbnail frame at 1s (or trim start + 1s later)
      try {
        const thumb = await generateVideoThumbnail(file);
        setThumbnailFile(thumb.file);
        setThumbnailPreview(thumb.previewUrl);
      } catch (err) {
        console.warn("Failed to generate auto-thumbnail:", err);
      }

      if (sourceDuration > STATUS_MAX_VIDEO_SECONDS) {
        toast.info(
          `Video is ${Math.round(sourceDuration)}s. Choose a ${STATUS_MAX_VIDEO_SECONDS}s section with the trim slider — compression runs on the server.`,
        );
      } else {
        toast.success("Video ready — compression will run on the server after upload.");
      }
    };

    videoObj.onerror = () => {
      URL.revokeObjectURL(objUrl);
      toast.error("Could not read video metadata. Please select another file.");
    };

    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    const resolvedStationId = isStationScoped ? userStationId : stationId;
    if (!resolvedStationId) {
      toast.error("Please select a station");
      return;
    }

    try {
      let media: string | undefined;
      let mediaType: "image" | "video" | "sticker" | undefined;
      let thumbnail: string | undefined;
      let sticker: string | undefined;

      if (contentType === "Image" && imageFile) {
        const uploadResult = await uploadMedia(imageFile).unwrap();
        media = uploadResult.data?.media;
        mediaType = "image";
      } else if (contentType === "Video") {
        if (!videoFile) {
          toast.error("Please select a video file");
          return;
        }

        setIsCompressing(true);
        setCompressionProgress(30);
        try {
          // Upload original — server transcodes/compresses and applies trim
          const videoRes = await uploadVideo({
            file: videoFile,
            trimStartSec,
          }).unwrap();
          media = videoRes.data?.video;
          mediaType = "video";
          setCompressionProgress(90);

          if (thumbnailFile) {
            const thumbRes = await uploadMedia(thumbnailFile).unwrap();
            thumbnail = thumbRes.data?.media;
          }
          setCompressionProgress(100);
        } finally {
          setIsCompressing(false);
        }
      } else if (contentType === "Sticker") {
        if (!stickerUrl) {
          toast.error("Please select a sticker");
          return;
        }
        sticker = stickerUrl;
        mediaType = "sticker";
      }

      const expiresAt = new Date(Date.now() + duration.hours * 60 * 60 * 1000).toISOString();

      await createStatus({
        content: content.trim(),
        media,
        mediaType,
        thumbnail,
        stickerUrl: sticker,
        expiresAt,
        stationId: resolvedStationId,
      }).unwrap();

      toast.success("Status post created successfully");
      router.push("/campaigns/status-posts");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create status post");
    }
  };

  const isSubmitting = isCreating || isUploading || isUploadingVideo || isCompressing;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/campaigns/status-posts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Back to Status Posts
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Create Status Post</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Publish a new status post to your station</p>
      </div>

      {/* Form Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden max-w-2xl">
        <div className="p-4 sm:p-6 space-y-5">
          {/* Country + Partner (super admin only — optional filters) */}
          {isSuperAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Country</label>
                <select
                  value={countryId}
                  onChange={(e) => {
                    setCountryId(e.target.value);
                    setPartnerId("");
                    setStationId("");
                  }}
                  disabled={countriesLoading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
                >
                  <option value="">{countriesLoading ? "Loading..." : "All Countries"}</option>
                  {countries.map((c: any) => (
                    <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Partner</label>
                <select
                  value={partnerId}
                  onChange={(e) => {
                    setPartnerId(e.target.value);
                    setStationId("");
                  }}
                  disabled={partnersLoading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
                >
                  <option value="">{partnersLoading ? "Loading..." : "All Partners"}</option>
                  {partners.map((p: any) => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Station (required for super_admin and partner_admin, hidden for station_admin) */}
          {!isStationScoped && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Station<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                disabled={stationsLoading}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
              >
                <option value="">{stationsLoading ? "Loading..." : "Select Station"}</option>
                {stations.map((s: any) => (
                  <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Content Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Content Type<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setContentType("Text"); removeImage(); removeVideo(); setStickerUrl(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  contentType === "Text"
                    ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                <FileText size={14} /> Text
              </button>
              <button
                type="button"
                onClick={() => { setContentType("Image"); removeVideo(); setStickerUrl(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  contentType === "Image"
                    ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                <Image size={14} /> Image
              </button>
              <button
                type="button"
                onClick={() => { setContentType("Video"); removeImage(); setStickerUrl(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  contentType === "Video"
                    ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                <Video size={14} /> Video
              </button>
              <button
                type="button"
                onClick={() => { setContentType("Sticker"); removeImage(); removeVideo(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  contentType === "Sticker"
                    ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                <Sparkles size={14} /> Sticker
              </button>
            </div>
          </div>

          {/* Sticker picker */}
          {contentType === "Sticker" && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Sticker<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {BUILTIN_STICKERS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStickerUrl(s.url)}
                    className={`aspect-square rounded-xl border p-2 transition-all ${
                      stickerUrl === s.url
                        ? "border-[#02B2FF] bg-[#02B2FF]/10 ring-2 ring-[#02B2FF]/40"
                        : "border-border hover:bg-muted"
                    }`}
                    title={s.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt={s.name} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
              {stickerUrl && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={stickerUrl} alt="Selected sticker" className="w-16 h-16 object-contain" />
                  <div className="text-xs text-muted-foreground">Selected sticker preview</div>
                  <button
                    type="button"
                    onClick={() => setStickerUrl(null)}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Content (Caption / Description) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Content<span className="text-red-500 ml-0.5">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  showEmojiPicker
                    ? "border-[#02B2FF] bg-[#02B2FF]/10 text-[#02B2FF]"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title="Insert emoji"
              >
                <span className="text-base leading-none">😊</span>
                Emoji
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                contentType === "Image"
                  ? "Enter image caption or description..."
                  : contentType === "Video"
                  ? "Enter video caption or description..."
                  : contentType === "Sticker"
                  ? "Optional caption for this sticker..."
                  : "Enter your status post text content..."
              }
              rows={4}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all resize-none"
            />
            {showEmojiPicker && (
              <div className="mt-2 p-2 rounded-xl border border-border bg-muted/20 grid grid-cols-8 sm:grid-cols-10 gap-1">
                {EMOJI_LIST.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    onClick={() => setContent((c) => c + emoji)}
                    className="h-9 w-9 rounded-lg hover:bg-[#02B2FF]/15 text-xl leading-none flex items-center justify-center transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Image Upload */}
          {contentType === "Image" && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Image<span className="text-red-500 ml-0.5">*</span>
              </label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-56 rounded-lg border border-border" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-[#02B2FF]/50 transition-colors cursor-pointer"
                >
                  <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold text-foreground">Click to upload image</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Recommended: 1080 × 1920 px (9:16 vertical story format, up to 20MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">Recommended: 1080 × 1920 px (9:16 vertical format)</p>
            </div>
          )}

          {/* Video Upload */}
          {contentType === "Video" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Video (Max 45s after trim, up to 150MB)<span className="text-red-500 ml-0.5">*</span>
                </label>
                {videoPreview ? (
                  <div className="relative inline-block">
                    <video
                      src={videoPreview}
                      controls
                      playsInline
                      className="max-h-64 rounded-lg border border-border bg-black"
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-[#02B2FF]/50 transition-colors cursor-pointer"
                  >
                    <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-foreground">Click to upload video</p>
                    <p className="text-xs text-muted-foreground mt-0.5">MP4, MOV, M4V, WebM (up to 150MB)</p>
                  </div>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.m4v"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Recommended: 9:16 portrait reel. Server compresses automatically after upload.
                </p>
              </div>

              {/* Timeline trimmer — only when source is longer than 45s */}
              {videoPreview && sourceDurationSec > STATUS_MAX_VIDEO_SECONDS && (
                <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Trim — keep {STATUS_MAX_VIDEO_SECONDS}s
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {Math.round(trimStartSec)}s → {Math.round(Math.min(sourceDurationSec, trimStartSec + STATUS_MAX_VIDEO_SECONDS))}s
                      {" "}(source {Math.round(sourceDurationSec)}s)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, Math.floor(sourceDurationSec - STATUS_MAX_VIDEO_SECONDS))}
                    step={0.5}
                    value={trimStartSec}
                    onChange={(e) => setTrimStartSec(Number(e.target.value))}
                    className="w-full accent-[#02B2FF] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Start</span>
                    <span>
                      End = start + {STATUS_MAX_VIDEO_SECONDS}s
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Server will compress and cut this window automatically.
                  </p>
                </div>
              )}

              {/* Upload progress note */}
              {isCompressing && (
                <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Loader2 size={13} className="text-[#02B2FF] animate-spin" /> Uploading — server will compress…
                    </span>
                    <span className="text-muted-foreground font-mono">{compressionProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#02B2FF] h-1.5 transition-all duration-300 rounded-full"
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Thumbnail Section */}
              {videoPreview && (
                <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-foreground">Video Preview Thumbnail</span>
                      <p className="text-[11px] text-muted-foreground">Auto-generated from 1s frame, or upload custom</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => thumbInputRef.current?.click()}
                      className="text-xs font-semibold text-[#02B2FF] hover:underline"
                    >
                      Upload Custom
                    </button>
                    <input
                      ref={thumbInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleCustomThumbnailSelect}
                      className="hidden"
                    />
                  </div>

                  {thumbnailPreview && (
                    <div className="flex items-center gap-3">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-16 h-24 object-cover rounded-lg border border-border"
                      />
                      <span className="text-xs text-muted-foreground">9:16 Vertical Preview Thumbnail Ready</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Duration<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATIONS.map((d) => (
                <button
                  type="button"
                  key={d.hours}
                  onClick={() => setDuration(d)}
                  className={`py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    duration.hours === d.hours
                      ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Note:</span> Posts cannot be edited after publishing. Duration starts from the moment of publication.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row gap-3 bg-muted/20">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !content.trim() ||
              (contentType === "Video" && !videoFile) ||
              (contentType === "Sticker" && !stickerUrl)
            }
            className="flex-1 sm:flex-initial justify-center flex items-center gap-2 px-5 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {isCompressing ? `Compressing (${compressionProgress}%)` : isUploading || isUploadingVideo ? "Uploading media..." : "Publishing..."}
              </>
            ) : (
              "Publish Post"
            )}
          </button>
          <Link
            href="/campaigns/status-posts"
            className="flex-1 sm:flex-initial justify-center px-5 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </div>

      <ImageCropModal
        isOpen={cropConfig.isOpen}
        imageSrc={cropConfig.imageSrc}
        file={cropConfig.file}
        aspect={9 / 16}
        cropShape="rect"
        title={cropConfig.isForThumbnail ? "Crop Video Thumbnail (9:16)" : "Crop Status Post (9:16)"}
        recommendedHint="Recommended: 1080 × 1920 px (9:16 vertical format)"
        onCropComplete={handleCropComplete}
        onCancel={() => setCropConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
