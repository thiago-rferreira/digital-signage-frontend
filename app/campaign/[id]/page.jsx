"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Modal, Button, List, Card, InputNumber, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CampaignMedia() {
  const { id } = useParams();
  const [mediaList, setMediaList] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [duration, setDuration] = useState(5); // Duração padrão
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/media/${id}`)
      .then((res) => res.json())
      .then((data) => setMediaList(data))
      .catch((err) => console.error("Erro ao carregar mídias:", err));
  }, [id]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      message.success(`Arquivo selecionado: ${selectedFile.name}`);
      
      if (selectedFile.type.startsWith("video")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          setDuration(Math.floor(video.duration));
        };
        video.src = URL.createObjectURL(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      message.error("Selecione um arquivo antes de enviar.");
      return;
    }

    if (!duration || duration <= 0) {
      message.error("Insira uma duração válida.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("campaign_id", id);
    formData.append("file_type", file.type.startsWith("image") ? "image" : "video");
    formData.append("duration", duration);

    const response = await fetch(`${API_URL}/media`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const newMedia = await response.json();
      setMediaList([...mediaList, newMedia]);
      message.success("Mídia adicionada com sucesso!");
      setFile(null);
      setDuration(5);
    } else {
      message.error("Erro ao enviar mídia.");
    }
  };

  const handleConfirmDelete = (mediaId) => {
    setDeletingId(mediaId);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    const response = await fetch(`${API_URL}/media/${deletingId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setMediaList(mediaList.filter((m) => m.id !== deletingId));
      message.success("Mídia removida com sucesso.");
    } else {
      message.error("Erro ao excluir mídia.");
    }
    setConfirmDelete(false);
    setDeletingId(null);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gerenciar Mídias</h1>

      <div className={styles.uploadSection}>
        <InputNumber
          min={1}
          max={60}
          value={duration}
          onChange={setDuration}
          className={styles.durationInput}
          placeholder="Duração (segundos)"
          disabled={file && file.type.startsWith("video")}
        />
        
        <input type="file" onChange={handleFileChange} className={styles.fileInput} />

        <Button
          type="primary"
          className={styles.submitButton}
          onClick={handleUpload}
          disabled={!file}
        >
          Enviar
        </Button>
      </div>

      <div className={styles.mediaGrid}>
        {mediaList.map((media) => (
          <Card
            key={media.id}
            className={styles.mediaCard}
            cover={
              media.file_type === "image"
                ? <img src={`${API_URL}/${media.file_path}`} alt="Mídia" />
                : <video src={`${API_URL}/${media.file_path}`} controls />
            }
            actions={[
              <DeleteOutlined
                key="delete"
                className={styles.deleteIcon}
                onClick={() => handleConfirmDelete(media.id)}
              />
            ]}
          >
            <p><strong>Duração:</strong> {media.duration}s</p>
          </Card>
        ))}
      </div>

      <Modal title="Confirmar Exclusão" open={confirmDelete} onCancel={() => setConfirmDelete(false)} onOk={handleDelete}>
        <p>Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita.</p>
      </Modal>
    </div>
  );
}
