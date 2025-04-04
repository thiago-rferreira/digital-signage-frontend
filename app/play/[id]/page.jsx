"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import styles from "./play.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const REFRESH_INTERVAL = parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL, 10) || 10000;

export default function PlayMedia() {
  const { id } = useParams();
  const [mediaList, setMediaList] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchMedia = () => {
      fetch(`${API_URL}/media/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setMediaList((prevList) => {
            const updatedList = prevList.filter((media) =>
              data.some((item) => item.id === media.id)
            );

            const newItems = data.filter(
              (item) => !prevList.some((media) => media.id === item.id)
            );

            const finalList = updatedList.map((media) => {
              const updatedMedia = data.find((item) => item.id === media.id);
              return updatedMedia ? updatedMedia : media;
            });

            return [...finalList, ...newItems];
          });
        })
        .catch((err) => console.error("Erro ao carregar mídias:", err));
    };

    fetchMedia();
    const interval = setInterval(fetchMedia, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [id]);

  // Corrige o índice se ele estiver fora dos limites após atualização
  useEffect(() => {
    if (currentMediaIndex >= mediaList.length && mediaList.length > 0) {
      setCurrentMediaIndex(0);
    }
  }, [mediaList, currentMediaIndex]);

  useEffect(() => {
    if (mediaList.length === 0) return;

    const currentMedia = mediaList[currentMediaIndex];
    if (!currentMedia) return;

    if (currentMedia.file_type === "image") {
      const timer = setTimeout(() => {
        setCurrentMediaIndex((prevIndex) =>
          mediaList.length > 0 ? (prevIndex + 1) % mediaList.length : 0
        );
      }, currentMedia.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentMediaIndex, mediaList]);

  useEffect(() => {
    if (videoRef.current) {
      const playVideo = () => {
        videoRef.current
          .play()
          .catch((err) => console.error("Erro ao reproduzir vídeo:", err));
      };

      videoRef.current.addEventListener("canplaythrough", playVideo);
      return () =>
        videoRef.current?.removeEventListener("canplaythrough", playVideo);
    }
  }, [currentMediaIndex]);

  if (mediaList.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noMedia}>Sem mídia adicionada</div>
      </div>
    );
  }

  const currentMedia = mediaList[currentMediaIndex] || null;

  return (
    <div className={styles.container}>
      <div className={styles.mediaWrapper}>
        {currentMedia && currentMedia.file_type === "image" ? (
          <img
            src={`${API_URL}/${currentMedia.file_path}`}
            alt="Mídia"
            className={styles.media}
          />
        ) : currentMedia ? (
          <video
            ref={videoRef}
            src={`${API_URL}/${currentMedia.file_path}`}
            className={styles.media}
            autoPlay
            playsInline
            muted={true}
            loop={false}
            controls={false}
            onEnded={() =>
              setCurrentMediaIndex((prevIndex) =>
                mediaList.length > 0 ? (prevIndex + 1) % mediaList.length : 0
              )
            }
          />
        ) : null}
      </div>
    </div>
  );
}
