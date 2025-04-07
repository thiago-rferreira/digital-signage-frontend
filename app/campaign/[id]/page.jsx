"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Modal, Button, Card, InputNumber, Popconfirm, Select, Input, Radio } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./page.module.css";

const { Option } = Select;

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

  const [contentType, setContentType] = useState("media");
  const [widgetType, setWidgetType] = useState(null);
  const [customURL, setCustomURL] = useState("");

  useEffect(() => {
    fetchMedia();
  }, [id]);

  const fetchMedia = async () => {
    try {
      // Fetch both media and widgets
      const [mediaResponse, widgetsResponse] = await Promise.all([
        fetch(`${API_URL}/media/${id}`),
        fetch(`${API_URL}/widgets/${id}`)
      ]);
      
      const mediaData = await mediaResponse.json();
      const widgetsData = await widgetsResponse.json();
      
      // Combine and sort the results
      const combinedData = [...mediaData, ...widgetsData]
        .sort((a, b) => (a.widget_order || a.id) - (b.widget_order || b.id));
      
      setMediaList(combinedData);
    } catch (error) {
      toast.error("Erro ao carregar itens.");
    }
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
    if (contentType === "media") {
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
        toast.success("Mídia adicionada com sucesso!");
        fetchMedia();
        resetModal();
      } else {
        toast.error("Erro ao enviar mídia.");
      }
    } else {
      let source = "";
      let name = "";
      if (widgetType === "clock") {
        source = "/widgets/clock";
        name = "Relógio";
      } else if (widgetType === "weather") {
        source = "/widgets/tempo";
        name = "Previsão do Tempo";
      } else if (widgetType === "custom") {
        source = customURL;
        name = "URL Personalizada";
        if (!customURL) {
          toast.error("Informe uma URL válida.");
          return;
        }
      }

      const response = await fetch(`${API_URL}/widgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign_id: id,
          name,
          source,
          duration,
          widget_order: mediaList.length + 1,
        }),
      });

      if (response.ok) {
        toast.success("Widget adicionado com sucesso!");
        fetchMedia();
        resetModal();
      } else {
        toast.error("Erro ao adicionar widget.");
      }
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreviewURL(null);
    setDuration(10);
    setCustomURL("");
    setWidgetType(null);
    setContentType("media");
    setModalOpen(false);
  };

  const handleConfirmDelete = (itemId) => {
    setDeletingId(itemId);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      const itemToDelete = mediaList.find(item => item.id === deletingId);
      const isWidget = itemToDelete.hasOwnProperty('source');
      
      const endpoint = isWidget ? 'widgets' : 'media';
      const response = await fetch(`${API_URL}/${endpoint}/${deletingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Item removido com sucesso!");
        fetchMedia();
      } else {
        toast.error("Erro ao excluir item.");
      }
    } catch (error) {
      toast.error("Erro ao excluir item.");
    } finally {
      setConfirmDelete(false);
      setDeletingId(null);
    }
  };

  const handleEditDuration = (item) => {
    setEditingId(item.id);
    setEditDuration(item.duration);
  };

  const handleUpdateDuration = async () => {
    if (!editingId) return;

    try {
      const itemToUpdate = mediaList.find(item => item.id === editingId);
      const isWidget = itemToUpdate.hasOwnProperty('source');
      
      const endpoint = isWidget ? 'widgets' : 'media';
      const response = await fetch(`${API_URL}/${endpoint}/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration: editDuration,
          ...(isWidget ? {} : { file_type: itemToUpdate.file_type })
        }),
      });

      if (response.ok) {
        toast.success("Duração atualizada com sucesso!");
        fetchMedia();
        setEditingId(null);
      } else {
        toast.error("Erro ao atualizar duração.");
      }
    } catch (error) {
      toast.error("Erro ao atualizar duração.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gerenciar Mídias e Widgets</h1>

      <Button type="primary" className={styles.addButton} onClick={() => setModalOpen(true)}>
        <PlusOutlined />
      </Button>

      <div className={styles.mediaGrid}>
        {mediaList.map((item) => (
          <Card
            key={item.id}
            className={styles.mediaCard}
            cover={
              item.file_type === "image" ? (
                <img src={`${API_URL}/${item.file_path}`} alt="Mídia" />
              ) : item.file_type === "video" ? (
                <video src={`${API_URL}/${item.file_path}`} controls />
              ) : (
                <iframe 
                  src={item.source} 
                  width="100%" 
                  height="200" 
                  title={item.name}
                  sandbox="allow-scripts allow-same-origin"
                />
              )
            }
            actions={[
              <EditOutlined 
                key="edit" 
                onClick={() => handleEditDuration(item)} 
                className={styles.editIcon}
              />,
              <DeleteOutlined 
                key="delete" 
                onClick={() => handleConfirmDelete(item.id)} 
                className={styles.deleteIcon}
              />
            ]}
          >
            <Card.Meta
              title={item.name || (item.file_type === "image" ? "Imagem" : "Vídeo")}
              description={
                editingId === item.id ? (
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
                  <p><strong>Duração:</strong> {item.duration}s</p>
                )
              }
            />
          </Card>
        ))}
      </div>

      <Modal 
        title="Adicionar Novo Item" 
        open={modalOpen} 
        onCancel={resetModal} 
        footer={null} 
        width={800}
      >
        <div style={{ marginBottom: 20 }}>
          <Radio.Group 
            value={contentType} 
            onChange={(e) => setContentType(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="media">Mídia</Radio.Button>
            <Radio.Button value="widget">Widget</Radio.Button>
          </Radio.Group>
        </div>

        {contentType === "media" ? (
          <div className={styles.modalContent}>
            <div className={styles.previewContainer}>
              {previewURL ? (
                file?.type.startsWith("image") ? (
                  <img src={previewURL} className={styles.previewImage} alt="Pré-visualização" />
                ) : (
                  <video src={previewURL} className={styles.previewVideo} controls />
                )
              ) : (
                <div className={styles.previewPlaceholder}>
                  {file ? "Pré-visualização não disponível" : "Nenhum arquivo selecionado"}
                </div>
              )}
            </div>
            <div className={styles.uploadForm}>
              <label className={styles.fileLabel}>
                Escolher Arquivo
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className={styles.fileInput} 
                  accept="image/*,video/*"
                />
              </label>
              <InputNumber 
                min={1} 
                max={86400}
                value={duration} 
                onChange={setDuration} 
                className={styles.durationInput} 
                placeholder="Duração (segundos)" 
                disabled={file?.type?.startsWith("video")} 
              />
              <Button 
                type="primary" 
                onClick={handleUpload} 
                disabled={!file}
                className={styles.uploadButton}
              >
                Adicionar Mídia
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.widgetForm}>
            <Select
              placeholder="Selecione um tipo de widget"
              onChange={(value) => setWidgetType(value)}
              value={widgetType}
              style={{ width: "100%", marginBottom: 16 }}
              allowClear
            >
              <Option value="clock">Relógio</Option>
              <Option value="weather">Previsão do Tempo</Option>
              <Option value="custom">URL Personalizada</Option>
            </Select>

            {widgetType === "custom" && (
              <Input
                placeholder="Digite a URL completa (ex: https://exemplo.com)"
                value={customURL}
                onChange={(e) => setCustomURL(e.target.value)}
                style={{ marginBottom: 16 }}
              />
            )}

            <InputNumber 
              min={1} 
              max={86400} 
              value={duration} 
              onChange={setDuration} 
              className={styles.durationInput}
              placeholder="Duração (segundos)" 
              style={{ marginBottom: 16 }}
            />
            <Button 
              type="primary" 
              onClick={handleUpload} 
              disabled={!widgetType || (widgetType === "custom" && !customURL)}
              className={styles.addWidgetButton}
            >
              Adicionar Widget
            </Button>
          </div>
        )}
      </Modal>

      <Modal 
        title="Confirmar Exclusão" 
        open={confirmDelete} 
        onCancel={() => setConfirmDelete(false)} 
        onOk={handleDelete}
        okText="Excluir"
        cancelText="Cancelar"
      >
        <p>Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
      </Modal>
      
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        closeOnClick 
        pauseOnHover 
      />
    </div>
  );
}