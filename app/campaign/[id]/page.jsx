"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Modal, Button, Card, InputNumber, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CampaignMedia() {
  const { id } = useParams();
  const [mediaList, setMediaList] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [duration, setDuration] = useState(10);
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDuration, setEditDuration] = useState(10);

  useEffect(() => {
    fetchMedia();
  }, [id]);

  const fetchMedia = () => {
    fetch(`${API_URL}/media/${id}`)
      .then((res) => res.json())
      .then((data) => setMediaList(data))
      .catch(() => toast.error("Erro ao carregar mídias."));
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewURL(URL.createObjectURL(selectedFile));
      toast.success(`Arquivo selecionado: ${selectedFile.name}`);

      if (selectedFile.type.startsWith("video")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          setDuration(Math.floor(video.duration));
        };
        video.src = URL.createObjectURL(selectedFile);
      } else {
        setDuration(10);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo antes de enviar.");
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
      toast.success("Mídia adicionada com sucesso!");
      resetModal();
    } else {
      toast.error("Erro ao enviar mídia.");
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreviewURL(null);
    setDuration(10);
    setModalOpen(false);
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
      toast.success("Mídia removida com sucesso.");
    } else {
      toast.error("Erro ao excluir mídia.");
    }
    setConfirmDelete(false);
    setDeletingId(null);
  };

  const handleEditDuration = (media) => {
    setEditingId(media.id);
    setEditDuration(media.duration);
  };

  const handleUpdateDuration = async () => {
    if (!editingId) return;

    const response = await fetch(`${API_URL}/media/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        duration: editDuration,
        file_type: mediaList.find(m => m.id === editingId)?.file_type
      }),
    });

    if (response.ok) {
      toast.success("Duração atualizada com sucesso!");
      fetchMedia(); // Atualiza a lista
      setEditingId(null);
    } else {
      toast.error("Erro ao atualizar duração.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gerenciar Mídias</h1>

      <Button type="primary" className={styles.addButton} onClick={() => setModalOpen(true)} icon={<PlusOutlined />}>
        Adicionar Mídia
      </Button>

      <div className={styles.mediaGrid}>
        {mediaList.map((media) => (
          <Card
            key={media.id}
            className={styles.mediaCard}
            cover={
              media.file_type === "image" ? (
                <img src={`${API_URL}/${media.file_path}`} alt="Mídia" />
              ) : (
                <video src={`${API_URL}/${media.file_path}`} controls />
              )
            }
            actions={[
              <EditOutlined 
                key="edit" 
                onClick={() => handleEditDuration(media)} 
                className={styles.editIcon}
              />,
              <DeleteOutlined 
                key="delete" 
                onClick={() => handleConfirmDelete(media.id)} 
                className={styles.deleteIcon}
              />
            ]}
          >
            {editingId === media.id ? (
              <div className={styles.editDurationContainer}>
                <InputNumber 
                  min={1} 
                  max={86400} 
                  value={editDuration} 
                  onChange={setEditDuration}
                  className={styles.durationInput}
                />
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={handleUpdateDuration}
                  className={styles.saveButton}
                >
                  Salvar
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setEditingId(null)}
                  className={styles.cancelButton}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <p><strong>Duração:</strong> {media.duration}s</p>
            )}
          </Card>
        ))}
      </div>

      <Modal title="Adicionar Nova Mídia" open={modalOpen} onCancel={resetModal} footer={null} width={800}>
        <div className={styles.modalContent}>
          <div className={styles.previewContainer}>
            {previewURL ? (
              file.type.startsWith("image") ? (
                <img src={previewURL} className={styles.previewImage} alt="Pré-visualização" />
              ) : (
                <video src={previewURL} className={styles.previewVideo} controls />
              )
            ) : (
              <div className={styles.previewPlaceholder}>Pré-visualização</div>
            )}
          </div>
          <div className={styles.uploadForm}>
            <label className={styles.fileLabel}>
              Escolher Arquivo
              <input type="file" onChange={handleFileChange} className={styles.fileInput} />
            </label>
            <InputNumber 
              min={1} 
              max={60} 
              value={duration} 
              onChange={setDuration} 
              className={styles.durationInput} 
              placeholder="Duração (segundos)" 
              disabled={file && file.type.startsWith("video")} 
            />
            <Button type="primary" onClick={handleUpload} disabled={!file}>
              Adicionar à Campanha
            </Button>
          </div>
        </div>
      </Modal>

      <Modal title="Confirmar Exclusão" open={confirmDelete} onCancel={() => setConfirmDelete(false)} onOk={handleDelete}>
        <p>Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita.</p>
      </Modal>
      
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
    </div>
  );
}