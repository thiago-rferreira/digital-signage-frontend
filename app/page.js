"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, Input, Card, Space, Typography, theme } from "antd";
import styles from "./page.module.css";
import { Header } from "@/app/components/Header";

const { Title, Text } = Typography;
const { useToken } = theme;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const { token } = useToken();

  useEffect(() => {
    fetch(`${API_URL}/campaigns`)
      .then((res) => res.json())
      .then((data) => setCampaigns(data))
      .catch((err) => console.error("Erro ao buscar campanhas:", err));
  }, []);

  const handleCreateOrUpdateCampaign = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `${API_URL}/campaigns/${editing}` : `${API_URL}/campaigns`;

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    if (response.ok) {
      const updatedCampaign = await response.json();
      setCampaigns(editing ? campaigns.map(c => c.id === editing ? updatedCampaign : c) : [...campaigns, updatedCampaign]);
      setOpen(false);
      setName("");
      setDescription("");
      setEditing(null);
    }
  };

  const handleEdit = (campaign) => {
    setEditing(campaign.id);
    setName(campaign.name);
    setDescription(campaign.description);
    setOpen(true);
  };

  const handleConfirmDelete = (id) => {
    setDeletingId(id);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    const response = await fetch(`${API_URL}/campaigns/${deletingId}`, { method: "DELETE" });
    if (response.ok) {
      setCampaigns(campaigns.filter(c => c.id !== deletingId));
    }
    setConfirmDelete(false);
    setDeletingId(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>Campanhas</Title>
        <Button 
          type="primary" 
          size="large"
          className={styles.createButton}
          onClick={() => { setOpen(true); setEditing(null); setName(""); setDescription(""); }}
        >
          Criar Campanha
        </Button>
      </div>
      
      <div className={styles.campaignsGrid}>
        {campaigns.map((campaign) => (
          <Card 
            key={campaign.id} 
            title={<Text strong style={{ fontSize: token.fontSizeLG }}>{campaign.name}</Text>} 
            className={styles.campaignCard}
            hoverable
          >
            <Text type="secondary" className={styles.description}>{campaign.description}</Text>
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
                type="default"
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
        ))}
      </div>
      
      <Modal 
        title={editing ? "Editar Campanha" : "Criar Nova Campanha"} 
        open={open} 
        onCancel={() => setOpen(false)} 
        onOk={handleCreateOrUpdateCampaign}
        okText={editing ? "Atualizar" : "Criar"}
        cancelText="Cancelar"
      >
        <Input 
          placeholder="Nome" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className={styles.modalInput}
        />
        <Input.TextArea 
          placeholder="Descrição" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          className={styles.modalInput}
          rows={4}
        />
      </Modal>
      
      <Modal 
        title="Confirmar Exclusão" 
        open={confirmDelete} 
        onCancel={() => setConfirmDelete(false)} 
        onOk={handleDelete}
        okText="Excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <Text>Tem certeza que deseja excluir esta campanha? Todas as mídias associadas a ela serão perdidas.</Text>
      </Modal>
    </div>
  );
}