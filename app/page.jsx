"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  Button,
  Input,
  Select,
  message,
} from "antd";
import styles from "./page.module.css";

const { Option } = Select;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const TYPE_LABELS = {
  fullscreen: "Tela cheia",
  portrait: "Retrato",
  split: "Dividida",
};

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("fullscreen");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_URL}/campaigns`)
      .then((res) => res.json())
      .then((data) => setCampaigns(data))
      .catch(() => message.error("Erro ao carregar campanhas."));
  }, []);

  const handleCreateOrUpdate = async () => {
    if (!name || !description || !type) {
      message.warning("Preencha todos os campos antes de continuar.");
      return;
    }

    setLoading(true);
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `${API_URL}/campaigns/${editing}`
      : `${API_URL}/campaigns`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, type }),
      });
      if (!res.ok) throw new Error();

      const saved = await res.json();
      setCampaigns((prev) =>
        editing ? prev.map((c) => (c.id === editing ? saved : c)) : [...prev, saved]
      );
      message.success(editing ? "Campanha atualizada!" : "Campanha criada!");
      setOpen(false);
      resetForm();
    } catch {
      message.error("Erro ao salvar a campanha.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setType("fullscreen");
    setEditing(null);
  };

  const handleEdit = (c) => {
    setEditing(c.id);
    setName(c.name);
    setDescription(c.description);
    setType(c.type || "fullscreen");
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/campaigns/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setCampaigns((prev) => prev.filter((c) => c.id !== deletingId));
      message.success("Campanha excluída.");
    } catch {
      message.error("Erro ao excluir campanha.");
    } finally {
      setConfirmDelete(false);
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>◈</span>
          <div>
            <h1 className={styles.title}>Campanhas</h1>
            <p className={styles.subtitle}>{campaigns.length} campanha{campaigns.length !== 1 ? "s" : ""} ativa{campaigns.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button className={styles.newBtn} onClick={() => setOpen(true)}>
          <span>+</span> Nova campanha
        </button>
      </header>

      {/* ── Grid de campanhas ── */}
      <main className={styles.grid}>
        {campaigns.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>▣</span>
            <p>Nenhuma campanha ainda.</p>
            <button className={styles.emptyBtn} onClick={() => setOpen(true)}>
              Criar primeira campanha
            </button>
          </div>
        ) : (
          campaigns.map((campaign, i) => {
            const campaignUrl = `/play/${campaign.id}`;
            const fullUrl =
              typeof window !== "undefined"
                ? window.location.origin + campaignUrl
                : campaignUrl;

            return (
              <article
                key={campaign.id}
                className={styles.card}
                style={{ "--i": i }}
              >
                {/* Preview iframe */}
                <div className={styles.preview}>
                  <iframe
                    src={campaignUrl}
                    title={`Preview ${campaign.name}`}
                    frameBorder="0"
                    allowFullScreen
                    className={styles.iframe}
                  />
                  <div className={styles.previewOverlay} />
                  <span className={styles.typeBadge}>
                    {TYPE_LABELS[campaign.type] ?? campaign.type}
                  </span>
                </div>

                {/* Info */}
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{campaign.name}</h2>
                  <p className={styles.cardDesc}>{campaign.description}</p>

                  {/* URL copiável */}
                  <div
                    className={styles.urlRow}
                    title="Clique para copiar"
                    onClick={() => {
                      navigator.clipboard.writeText(fullUrl);
                      message.success("URL copiada!");
                    }}
                  >
                    <span className={styles.urlIcon}>⎋</span>
                    <span className={styles.urlText}>{fullUrl}</span>
                  </div>

                  {/* Ações */}
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => router.push(`/campaign/${campaign.id}`)}
                    >
                      Mídias
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleEdit(campaign)}
                    >
                      Editar
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => {
                        setDeletingId(campaign.id);
                        setConfirmDelete(true);
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </main>

      {/* ── Modal criar/editar ── */}
      <Modal
        title={editing ? "Editar Campanha" : "Nova Campanha"}
        open={open}
        onCancel={() => { setOpen(false); resetForm(); }}
        onOk={handleCreateOrUpdate}
        okText={editing ? "Salvar" : "Criar"}
        confirmLoading={loading}
        className={styles.modal}
      >
        <div className={styles.modalFields}>
          <Input
            placeholder="Nome da campanha"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            value={type}
            onChange={setType}
            style={{ width: "100%" }}
          >
            <Option value="fullscreen">Tela cheia</Option>
            <Option value="portrait">Retrato</Option>
            <Option value="split">Tela dividida</Option>
          </Select>
        </div>
      </Modal>

      {/* ── Modal confirmação exclusão ── */}
      <Modal
        title="Confirmar exclusão"
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onOk={handleDelete}
        okText="Excluir"
        okButtonProps={{ danger: true }}
      >
        Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
      </Modal>
    </div>
  );
}