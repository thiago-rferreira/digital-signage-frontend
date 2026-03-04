"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import styles from "./play.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const REFRESH_INTERVAL =
  parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL, 10) || 10000;

export default function PlayMedia() {
  const { id } = useParams();
  const [mediaList, setMediaList] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const imageTimerRef = useRef(null);
  const transitionTimeoutRef = useRef(null);

  // ─── Fetch & merge da lista de mídias ────────────────────────────────────
  useEffect(() => {
    const fetchMedia = () => {
      fetch(`${API_URL}/media/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setMediaList((prev) => {
            const kept = prev.filter((m) => data.some((d) => d.id === m.id));
            const merged = kept.map((m) => data.find((d) => d.id === m.id) ?? m);
            const added = data.filter((d) => !prev.some((m) => m.id === d.id));
            return [...merged, ...added];
          });
        })
        .catch((err) => console.error("Erro ao carregar mídias:", err));
    };

    fetchMedia();
    const interval = setInterval(fetchMedia, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [id]);

  // ─── Corrige índice fora dos limites ─────────────────────────────────────
  useEffect(() => {
    if (mediaList.length > 0 && currentMediaIndex >= mediaList.length) {
      setCurrentMediaIndex(0);
    }
  }, [mediaList, currentMediaIndex]);

  // ─── Avança para próxima mídia com transição fade ─────────────────────────
  const goToNext = useCallback(() => {
    clearInterval(progressIntervalRef.current);
    clearTimeout(imageTimerRef.current);
    setTransitioning(true);
    setIsVisible(false);

    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentMediaIndex((prev) =>
        mediaList.length > 0 ? (prev + 1) % mediaList.length : 0
      );
      setProgress(0);
      setTransitioning(false);
      setIsVisible(true);
    }, 400);
  }, [mediaList.length]);

  // ─── Timer/progresso para imagens ─────────────────────────────────────────
  useEffect(() => {
    clearInterval(progressIntervalRef.current);
    clearTimeout(imageTimerRef.current);

    if (mediaList.length === 0) return;
    const current = mediaList[currentMediaIndex];
    if (!current || current.file_type !== "image") return;

    const totalMs = current.duration * 1000;
    const tickMs = 50;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + tickMs / totalMs;
        return next >= 1 ? 1 : next;
      });
    }, tickMs);

    imageTimerRef.current = setTimeout(goToNext, totalMs);

    return () => {
      clearInterval(progressIntervalRef.current);
      clearTimeout(imageTimerRef.current);
    };
  }, [currentMediaIndex, mediaList, goToNext]);

  // ─── Autoplay de vídeo + progresso ────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => {
      video.play().catch((err) => console.error("Erro ao reproduzir vídeo:", err));
    };

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress(video.currentTime / video.duration);
      }
    };

    video.addEventListener("canplaythrough", onCanPlay);
    video.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      video.removeEventListener("canplaythrough", onCanPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [currentMediaIndex]);

  // ─── Cleanup geral ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(progressIntervalRef.current);
      clearTimeout(imageTimerRef.current);
      clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  if (mediaList.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noMedia}>
          <span className={styles.noMediaIcon}>📺</span>
          <p>Sem mídia adicionada</p>
        </div>
      </div>
    );
  }

  const currentMedia = mediaList[currentMediaIndex] ?? null;

  return (
    <div className={styles.container}>
      {/* Mídia atual */}
      <div className={`${styles.mediaWrapper} ${isVisible ? styles.visible : styles.hidden}`}>
        {currentMedia?.file_type === "image" ? (
          <img
            key={currentMedia.id}
            src={`${API_URL}/${currentMedia.file_path}`}
            alt="Mídia"
            className={styles.media}
          />
        ) : currentMedia ? (
          <video
            key={currentMedia.id}
            ref={videoRef}
            src={`${API_URL}/${currentMedia.file_path}`}
            className={styles.media}
            autoPlay
            playsInline
            muted
            loop={false}
            controls={false}
            onEnded={goToNext}
          />
        ) : null}
      </div>

      {/* Barra de progresso */}
      {mediaList.length > 0 && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* Indicadores de slide (opcional — remova se não quiser) */}
      {mediaList.length > 1 && (
        <div className={styles.dots}>
          {mediaList.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === currentMediaIndex ? styles.dotActive : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}