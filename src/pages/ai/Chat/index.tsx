import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  message,
  Segmented,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CHAT_SSE_URL, chatSync } from "@/api/ai/chat";
import { getTempId, list as listSession } from "@/api/ai/session";
import { qaList } from "@/api/ai/history";
import type {
  Call,
  ChatSessionVo,
  ChatQaDetailsVo,
  TableDataInfo,
} from "@/types/ai";
import { useSSE } from "@/hooks/ai/useSSE";
import ChatBubble from "@/components/ai/ChatBubble";
import { useTranslation } from "react-i18next";

const { Text, Paragraph } = Typography;

export default function ChatPage() {
  const qc = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<number | undefined>(
    undefined
  );
  const [streamText, setStreamText] = useState<string>("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content?: string }[]
  >([]);
  const [settingsForm] = Form.useForm();
  const [mode, setMode] = useState<"sse" | "sync">("sse");
  const [inputVal, setInputVal] = useState<string>("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("aiChat");

  const { data: sessions, isLoading: loadingSessions } = useQuery<
    TableDataInfo<ChatSessionVo>
  >({
    queryKey: ["ai", "chat", "sessions"],
    queryFn: () => listSession({}),
  });

  const {
    data: history,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useQuery<TableDataInfo<ChatQaDetailsVo>>({
    queryKey: ["ai", "chat", "history", currentSessionId],
    queryFn: () => qaList({ sessionId: currentSessionId }),
    enabled: !!currentSessionId,
  });

  const { start, stop, status } = useSSE(CHAT_SSE_URL);

  useEffect(() => {
    if (currentSessionId) refetchHistory();
  }, [currentSessionId, refetchHistory]);

  const createTemp = useMutation({
    mutationFn: () => getTempId(),
    onSuccess: (res: any) => {
      const id = res.msg;
      setCurrentSessionId(id);
      message.success("已创建临时会话");
      qc.invalidateQueries({ queryKey: ["ai", "chat", "sessions"] });
    },
  });

  const sendSync = useMutation({
    mutationFn: (call: Call) => chatSync(call),
    onSuccess: () => {
      if (currentSessionId)
        qc.invalidateQueries({
          queryKey: ["ai", "chat", "history", currentSessionId],
        });
    },
  });

  const sessionsRows = useMemo(() => sessions?.rows || [], [sessions]);
  const historyRows = useMemo(() => history?.rows || [], [history]);

  useEffect(() => {
    if (!historyRows?.length) {
      setMessages([]);
      return;
    }
    const arr: { role: "user" | "assistant"; content?: string }[] = [];
    historyRows.forEach((h) => {
      arr.push({ role: "user", content: h.questionMsg || "" });
      arr.push({ role: "assistant", content: h.answerMsg || "" });
    });
    setMessages(arr);
  }, [historyRows]);

  // 消息更新时 滚动到最底部
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSendSse = async () => {
    const values = settingsForm.getFieldsValue();
    const body: Call = {
      ...values,
      msg: inputVal,
      sessionId: currentSessionId,
    };
    if (!body.msg) return;
    setMessages((prev) => [...prev, { role: "user", content: body.msg }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    let idx = -1;
    start(
      body,
      (text) => {
        setMessages((prev) => {
          const next = [...prev];
          idx = next.findIndex(
            (m, i) => i === next.length - 1 && m.role === "assistant"
          );
          if (idx >= 0)
            next[idx] = {
              ...next[idx],
              content: (next[idx].content || "") + text,
            };
          return next;
        });
      },
      () => {
        if (currentSessionId)
          qc.invalidateQueries({
            queryKey: ["ai", "chat", "history", currentSessionId],
          });
      }
    );
    setInputVal("");
  };

  const handleSendSync = async () => {
    const values = settingsForm.getFieldsValue();
    const body: Call = {
      ...values,
      msg: inputVal,
      sessionId: currentSessionId,
    };
    if (!body.msg) return;
    setMessages((prev) => [...prev, { role: "user", content: body.msg }]);
    const resp = await sendSync.mutateAsync(body);
    const content =
      resp?.choices?.[0]?.message?.content ||
      resp?.choices?.[0]?.delta?.content ||
      "";
    setMessages((prev) => [...prev, { role: "assistant", content }]);
    setInputVal("");
  };

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card
          title={t("session")}
          extra={
            <Button
              type="primary"
              loading={createTemp.isPending}
              onClick={() => createTemp.mutate()}>
              {t("newTempSession")}
            </Button>
          }>
          {loadingSessions ? (
            <Spin />
          ) : (
            <div style={{ height: "65vh", overflowY: "auto" }}>
              <List
                dataSource={sessionsRows}
                rowKey={(i) => String(i.id)}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => setCurrentSessionId(item.id)}
                    style={{ cursor: "pointer" }}>
                    <List.Item.Meta
                      title={item.sessionTitle || `会话 #${item.id}`}
                      description={item.systemRole}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </Card>
      </Col>
      <Col span={18}>
        <Card title={t("chat")}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div
              style={{ height: "65vh", overflowY: "auto", paddingRight: 8 }}
              ref={messagesRef}>
              {loadingHistory ? (
                <Spin />
              ) : (
                <div>
                  {messages.map((m, i) => (
                    <ChatBubble key={i} role={m.role} content={m.content} />
                  ))}
                </div>
              )}
            </div>

            <Card size="small">
              <Form
                form={settingsForm}
                layout="inline"
                initialValues={{ aiPlatform: "chatgpt", model: "gpt-4o" }}>
                <Form.Item name="aiPlatform" label={t("platform")}>
                  <Select
                    style={{ width: 140 }}
                    options={[
                      { value: "chatgpt", label: "ChatGPT" },
                      { value: "deepseek", label: "DeepSeek" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="model" label={t("model")}>
                  <Input style={{ width: 160 }} placeholder={"gpt-4o"} />
                </Form.Item>
                <Form.Item name="temperature" label={t("temperature")}>
                  <Input
                    style={{ width: 120 }}
                    type="number"
                    placeholder={"0-2"}
                  />
                </Form.Item>
                <div style={{ marginLeft: "auto" }}>
                  <Segmented
                    value={mode}
                    onChange={(v) => setMode(v as any)}
                    options={[
                      { label: t("sendStream"), value: "sse" },
                      { label: t("sendSync"), value: "sync" },
                    ]}
                  />
                </div>
              </Form>
            </Card>

            <Space.Compact
              style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
              <Input.TextArea
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                rows={2}
                placeholder={t("questionPlaceholder")}
                style={{ width: "85%" }}
              />
              <div style={{ display: "flex", alignItems: "center" }}>
                <Button
                  type="primary"
                  onClick={() =>
                    mode === "sse" ? handleSendSse() : handleSendSync()
                  }
                  disabled={!currentSessionId}
                  loading={
                    mode === "sse" ? status === "running" : sendSync.isPending
                  }
                  style={{ marginRight: 8 }}  
                >
                  {t("send")}
                </Button>
                <Button onClick={stop} disabled={status !== "running"}>
                  {t("stop")}
                </Button>
              </div>
            </Space.Compact>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
