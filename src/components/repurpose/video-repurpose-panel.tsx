"use client";

/**
 * Video Repurpose Panel
 * Repurposes YouTube links and direct MP4/MOV uploads into 9:16 vertical promo reels.
 * System Layer: ui / repurpose
 */

import React, { useState, useEffect, useRef } from "react";
import { UserTemplateRecord } from "@/db/queries-brand-kit";
import { VideoProgressState, ManualTimestamp } from "@/components/repurpose/types";
import { VideoProgressCard } from "@/components/repurpose/video-progress-card";
import { VideoReelSettings } from "@/components/repurpose/video-reel-settings";

interface VideoRepurposePanelProps {
  templates: UserTemplateRecord[];
}

export function VideoRepurposePanel({
  templates,
}: VideoRepurposePanelProps): React.JSX.Element {
  const [videoTab, setVideoTab] = useState<"youtube" | "upload">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedStorageKey, setUploadedStorageKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video Options
  const videoTemplates = templates.filter((t) => t.format === "video-reel");
  const [selectedVideoTemplateId, setSelectedVideoTemplateId] = useState<string>(
    videoTemplates[0]?.id || ""
  );
  const [framingMode, setFramingMode] = useState<"smart_zoom" | "blurred_background" | "center_crop">("smart_zoom");
  const [topMargin, setTopMargin] = useState<number>(0);
  const [bottomMargin, setBottomMargin] = useState<number>(0);
  const [clipMode, setClipMode] = useState<"ai_auto" | "manual">("ai_auto");
  const [clipsCount, setClipsCount] = useState<number>(3);
  const [targetDuration, setTargetDuration] = useState<"15-30" | "30-60" | "60-90">("30-60");
  const [manualTimestamps, setManualTimestamps] = useState<ManualTimestamp[]>([
    { start: "01:04", end: "01:46" },
  ]);

  // Collapsible Advanced Settings
  const [language, setLanguage] = useState("");
  const [vocabularyHint, setVocabularyHint] = useState("");

  // Job Submission & Progress Polling
  const [videoJobRunning, setVideoJobRunning] = useState(false);
  const [videoJobError, setVideoJobError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<VideoProgressState | null>(null);

  const handleInspectYoutube = (url: string) => {
    setYoutubeUrl(url);
    if (!url.trim()) {
      setVideoThumbnail(null);
      return;
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      const videoId = match[2];
      setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
      if (!videoTitle) {
        setVideoTitle(`YouTube Video (${videoId})`);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadedStorageKey(null);
      if (!videoTitle) {
        setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadFileToR2 = async (): Promise<string> => {
    if (!uploadFile) throw new Error("No file selected.");
    setUploading(true);
    setUploadProgress(0);

    try {
      const presignRes = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadFile.name,
          contentType: uploadFile.type || "video/mp4",
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Failed to get upload authorization.");
      }

      const { uploadUrl, storageKey } = presignData;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", uploadFile.type || "video/mp4");

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage returned status ${xhr.status} during upload.`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during direct video upload."));
        xhr.send(uploadFile);
      });

      setUploadedStorageKey(storageKey);
      return storageKey;
    } finally {
      setUploading(false);
    }
  };

  const handleEnqueueVideoJob = async () => {
    setVideoJobRunning(true);
    setVideoJobError(null);
    setActiveJob(null);

    try {
      let finalVideoUrl = "";
      let sourceType: "youtube" | "video_upload" = "youtube";

      if (videoTab === "youtube") {
        if (!youtubeUrl.trim()) throw new Error("Please enter a valid YouTube link.");
        finalVideoUrl = youtubeUrl.trim();
        sourceType = "youtube";
      } else {
        if (!uploadFile && !uploadedStorageKey) {
          throw new Error("Please select a video file to upload.");
        }
        sourceType = "video_upload";
        finalVideoUrl = uploadedStorageKey || (await handleUploadFileToR2());
      }

      const res = await fetch("/api/repurpose/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          videoUrl: finalVideoUrl,
          title: videoTitle.trim() || (videoTab === "youtube" ? "YouTube Video" : uploadFile?.name),
          thumbnailUrl: videoThumbnail,
          templateId: selectedVideoTemplateId || undefined,
          framingMode,
          viewport: (topMargin > 0 || bottomMargin > 0) ? { top: topMargin, bottom: bottomMargin } : undefined,
          clipSelectionMode: clipMode,
          clipsCount: clipMode === "ai_auto" ? clipsCount : manualTimestamps.length,
          targetDuration,
          manualTimestamps: clipMode === "manual" ? manualTimestamps : undefined,
          language: language.trim() || undefined,
          vocabularyHint: vocabularyHint.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start video processing.");

      setActiveJob({
        jobId: data.jobId,
        articleId: data.articleId,
        status: data.status || "queued",
        progressPct: 5,
        stageMessage: "Enqueued in worker queue...",
        errorMessage: null,
        formats: [],
      });
    } catch (err: any) {
      setVideoJobError(err.message || "Failed to start video repurpose job.");
    } finally {
      setVideoJobRunning(false);
    }
  };

  // Poll active video job progress while running
  useEffect(() => {
    if (!activeJob || activeJob.status === "completed" || activeJob.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/repurpose/video/status?jobId=${activeJob.jobId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveJob((prev) => (prev ? { ...prev, ...data } : null));
        }
      } catch {
        // Network polling error handled gracefully
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeJob]);

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-6 shadow-xs space-y-6">
      {/* Sub-tab: YouTube URL vs File Upload */}
      <div className="flex items-center gap-3 border-b border-app-border pb-4">
        <button
          type="button"
          onClick={() => setVideoTab("youtube")}
          className={`text-xs font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            videoTab === "youtube"
              ? "border-red-600 text-red-600 font-bold"
              : "border-transparent text-app-muted hover:text-app-ink"
          }`}
        >
          <span>🔴</span>
          <span>YouTube Video Link</span>
        </button>
        <button
          type="button"
          onClick={() => setVideoTab("upload")}
          className={`text-xs font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            videoTab === "upload"
              ? "border-app-accent text-app-accent font-bold"
              : "border-transparent text-app-muted hover:text-app-ink"
          }`}
        >
          <span>📁</span>
          <span>Upload Video File (.mp4, .mov)</span>
        </button>
      </div>

      {/* YouTube Input Mode */}
      {videoTab === "youtube" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-app-ink mb-1.5">
              YouTube Video Link
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={youtubeUrl}
              onChange={(e) => handleInspectYoutube(e.target.value)}
              className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs text-app-ink placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent shadow-2xs font-mono"
            />
            <p className="text-[11px] text-app-muted mt-1">
              Audio transcript will be pulled and analyzed for viral hook climaxes.
            </p>
          </div>

          {videoThumbnail && (
            <div className="flex items-center gap-4 p-3 rounded-lg border border-app-border bg-app-subtle/30">
              <img
                src={videoThumbnail}
                alt="YouTube Thumbnail"
                className="h-20 w-32 object-cover rounded border border-app-border shadow-xs"
              />
              <div className="flex-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                  YouTube Detected
                </span>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Video Title..."
                  className="mt-1.5 w-full font-serif font-bold text-sm text-app-ink bg-transparent border-b border-dashed border-app-border focus:border-app-accent focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Direct File Upload Mode */}
      {videoTab === "upload" && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,audio/mpeg,audio/wav"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-app-border hover:border-app-accent hover:bg-app-subtle/20 rounded-xl p-8 text-center cursor-pointer transition-colors"
          >
            <div className="text-3xl mb-2">📹</div>
            <p className="text-xs font-semibold text-app-ink">
              {uploadFile ? uploadFile.name : "Click to select or drop a podcast video (.mp4, .mov)"}
            </p>
            <p className="text-[11px] text-app-muted mt-1">
              Supports up to 2.5 GB. Direct upload to Cloudflare R2 object storage.
            </p>
            {uploadFile && (
              <p className="text-[10px] font-mono text-app-accent mt-2">
                Size: {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
          </div>

          {uploading && (
            <div className="space-y-1.5 p-3 rounded-lg border border-app-border bg-app-subtle/20">
              <div className="flex justify-between text-xs text-app-muted">
                <span>Uploading directly to Cloudflare R2...</span>
                <span className="font-mono font-bold text-app-ink">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-app-accent h-2 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reel Generation Configuration Form */}
      <VideoReelSettings
        templates={templates}
        selectedTemplateId={selectedVideoTemplateId}
        onSelectTemplateId={setSelectedVideoTemplateId}
        framingMode={framingMode}
        onChangeFramingMode={setFramingMode}
        topMargin={topMargin}
        onChangeTopMargin={setTopMargin}
        bottomMargin={bottomMargin}
        onChangeBottomMargin={setBottomMargin}
        clipMode={clipMode}
        onChangeClipMode={setClipMode}
        clipsCount={clipsCount}
        onChangeClipsCount={setClipsCount}
        targetDuration={targetDuration}
        onChangeTargetDuration={setTargetDuration}
        manualTimestamps={manualTimestamps}
        onChangeManualTimestamps={setManualTimestamps}
        language={language}
        onChangeLanguage={setLanguage}
        vocabularyHint={vocabularyHint}
        onChangeVocabularyHint={setVocabularyHint}
        isSubmitting={videoJobRunning || uploading}
        onSubmit={handleEnqueueVideoJob}
      />

      {/* Error Display */}
      {videoJobError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {videoJobError}
        </div>
      )}

      {/* Progress tracker */}
      {activeJob && <VideoProgressCard activeJob={activeJob} />}
    </div>
  );
}
