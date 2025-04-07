"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  Button,
  Input,
  Card,
  Space,
  Typography,
  theme,
  Select,
  message,
} from "antd";
import styles from "./page.module.css";

const { Title, Text } = Typography;
const { useToken } = theme;
const { Option } = Select;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("fullscreen");
  const router = useRouter();
  const { token } = useToken();

  useEffect(() => {
    fetch(`${API_URL}/campaigns`)
      .then((res) => res.json())
      .then((data) => setCampaigns(data))
      .catch((err) => {
        console.error("Erro ao buscar campanhas:", err);
        message.error("Erro ao carregar campanhas.");
      });
  }, []);

  const handleCreateOrUpdateCampaign = async () => {
    if (!name || !description || !type) {
      message.warning("Preencha todos os campos antes de continuar.");
      return;
    }

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `${API_URL}/campaigns/${editing}`
      : `${API_URL}/campaigns`;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, type }),
      });

      if (!response.ok) throw new Error("Erro ao salvar a campanha.");

      const updatedCampaign = await response.json();
      setCampaigns(
        editing
          ? campaigns.map((c) => (c.id === editing ? updatedCampaign : c))
          : [...campaigns, updatedCampaign]
      );

      message.success(
        editing ? "Campanha atualizada com sucesso!" : "Campanha criada com sucesso!"
      );

      setOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      message.error("Erro ao salvar a campanha.");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setType("fullscreen");
    setEditing(null);
  };

  const handleEdit = (campaign) => {
    setEditing(campaign.id);
    setName(campaign.name);
    setDescription(campaign.description);
    setType(campaign.type || "fullscreen");
    setOpen(true);
  };

  const handleConfirmDelete = (id) => {
    setDeletingId(id);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir.");

      setCampaigns(campaigns.filter((c) => c.id !== deletingId));
      message.success("Campanha excluída com sucesso!");
    } catch (err) {
      console.error(err);
      message.error("Erro ao excluir campanha.");
    } finally {
      setConfirmDelete(false);
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>Minhas Campanhas</Title>
      </div>

      <div className={styles.campaignsFlex}>
        {campaigns.map((campaign) => {
          const campaignUrl = `/play/${campaign.id}`;

          return (
            <Card
              key={campaign.id}
              title={
                <Text strong style={{ fontSize: token.fontSizeLG }}>
                  {campaign.name}
                </Text>
              }
              className={styles.campaignCard}
              hoverable
            >
              <div className={styles.previewContainer}>
                <iframe
                  src={campaignUrl}
                  className={styles.previewIframe}
                  title={`Preview ${campaign.name}`}
                  frameBorder="0"
                  allowFullScreen
                />
              </div>

              <Text type="secondary" className={styles.description}>
                {campaign.description}
              </Text>
              <br />
              <Text type="secondary" italic>
                Tipo: {campaign.type || "Não definido"}
              </Text>

              <div className={styles.urlBox}>
                <Text strong>URL:</Text>{" "}
                <Text copyable className={styles.urlText}>
                  {typeof window !== "undefined" ? window.location.origin + campaignUrl : campaignUrl}
                </Text>
              </div>

              <Space className={styles.buttonGroup}>
                <Button
                  className={styles.button}
                  onClick={() => router.push(`/campaign/${campaign.id}`)}
                >
                  Mídias
                </Button>
                <Button
                  className={styles.button}
                  onClick={() => handleEdit(campaign)}
                >
                  Editar
                </Button>
                <Button
                  className={styles.button}
                  onClick={() => handleConfirmDelete(campaign.id)}
                  danger
                >
                  Excluir
                </Button>
              </Space>
            </Card>
          );
        })}
      </div>

      {/* Botão + flutuante */}
      <button className={styles.addButton} onClick={() => setOpen(true)}>
        +
      </button>

      {/* Modal criar/editar */}
      <Modal
        title={editing ? "Editar Campanha" : "Nova Campanha"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleCreateOrUpdateCampaign}
        okText={editing ? "Salvar" : "Criar"}
      >
        <Input
          placeholder="Nome da campanha"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.modalInput}
        />
        <Input
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.modalInput}
        />
        <Select
          value={type}
          onChange={(value) => setType(value)}
          className={styles.modalInput}
        >
          <Option value="fullscreen">Tela cheia</Option>
          <Option value="portrait">Retrato</Option>
          <Option value="split">Tela dividida</Option>
        </Select>
      </Modal>

      {/* Modal confirmação de exclusão */}
      <Modal
        title="Confirmar exclusão"
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onOk={handleDelete}
        okText="Excluir"
        okButtonProps={{ danger: true }}
      >
        Tem certeza que deseja excluir esta campanha?
      </Modal>
    </div>
  );
}
