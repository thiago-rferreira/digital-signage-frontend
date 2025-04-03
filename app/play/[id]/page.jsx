"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import styles from "./play.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function PlayMedia() {
  const { id } = useParams();
  const [mediaList, setMediaList] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/media/${id}`)
      .then((res) => res.json())
      .then((data) => setMediaList(data))
      .catch((err) => console.error("Erro ao carregar mídias:", err));
  }, [id]);

  useEffect(() => {
    if (mediaList.length === 0) return;
    
    const currentMedia = mediaList[currentMediaIndex];
    
    if (currentMedia.file_type === "image") {
      const timer = setTimeout(() => {
        setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % mediaList.length);
      }, currentMedia.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentMediaIndex, mediaList]);

  useEffect(() => {
    if (videoRef.current) {
      const playVideo = () => {
        videoRef.current.play().catch((err) => console.error("Erro ao reproduzir vídeo:", err));
      };
      
      videoRef.current.addEventListener("canplaythrough", playVideo);
      return () => videoRef.current?.removeEventListener("canplaythrough", playVideo);
    }
  }, [currentMediaIndex]);

  if (mediaList.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noMedia}>Sem mídia adicionada</div>
      </div>
    );
  }

  const currentMedia = mediaList[currentMediaIndex];

  return (
    <div className={styles.container}>
      <div className={styles.mediaWrapper}>
        {currentMedia.file_type === "image" ? (
          <img
            src={`${API_URL}/${currentMedia.file_path}`}
            alt="Mídia"
            className={styles.media}
          />
        ) : (
          <video
            ref={videoRef}
            src={`${API_URL}/${currentMedia.file_path}`}
            className={styles.media}
            autoPlay
            playsInline
            muted={true}
            loop={false}
            controls={false}
            onEnded={() => setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % mediaList.length)}
          />
        )}
      </div>
    </div>
  );
}
