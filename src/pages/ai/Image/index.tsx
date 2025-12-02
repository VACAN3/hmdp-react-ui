import React, { useMemo, useRef, useState } from 'react'
import { Button, Card, Col, Form, Input, Row, Select, Space, Spin, Typography, message, List } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { imgGetTempId, imgList } from '@/api/ai/session'
import { imgQaList } from '@/api/ai/history'
import { imageGeneration } from '@/api/ai/image'
import type { ImageGenerationCall, ChatImgSessionVo, ChatImgQaDetailsVo, TableDataInfo } from '@/types/ai'
import { useTranslation } from 'react-i18next'
import ChatBubble from '@/components/ai/ChatBubble'

const { Text, Paragraph } = Typography

export default function ImagePage() {
  const qc = useQueryClient()
  const [currentSessionId, setCurrentSessionId] = useState<number | undefined>(undefined)
  const [form] = Form.useForm<ImageGenerationCall>()
  const { t } = useTranslation('aiImage')
  const [messages, setMessages] = useState<{ role: 'user'|'assistant'; content?: string; imageUrl?: string }[]>([])
  const messagesRef = useRef<HTMLDivElement>(null)

  const { data: sessions, isLoading: loadingSessions } = useQuery<TableDataInfo<ChatImgSessionVo>>({
    queryKey: ['ai', 'image', 'sessions'],
    queryFn: () => imgList({}),
  })

  const { data: history, isLoading: loadingHistory } = useQuery<TableDataInfo<ChatImgQaDetailsVo>>({
    queryKey: ['ai', 'image', 'history', currentSessionId],
    queryFn: () => imgQaList({ sessionId: currentSessionId }),
    enabled: !!currentSessionId,
  })

  const createTemp = useMutation({
    mutationFn: () => imgGetTempId(),
    onSuccess: (id: number) => {
      setCurrentSessionId(id)
      message.success('已创建图片临时会话')
      qc.invalidateQueries({ queryKey: ['ai', 'image', 'sessions'] })
    },
  })

  const generate = useMutation({
    mutationFn: (payload: ImageGenerationCall) => imageGeneration(payload),
    onSuccess: () => {
      if (currentSessionId) qc.invalidateQueries({ queryKey: ['ai', 'image', 'history', currentSessionId] })
    },
  })

  const sessionsRows = useMemo(() => sessions?.rows || [], [sessions])
  const historyRows = useMemo(() => history?.rows || [], [history])

  React.useEffect(() => {
    if (!historyRows?.length) { setMessages([]); return }
    const arr: { role: 'user'|'assistant'; content?: string; imageUrl?: string }[] = []
    historyRows.forEach(h => {
      arr.push({ role: 'user', content: h.questionMsg || '' })
      arr.push({ role: 'assistant', content: h.answerMsg || '', imageUrl: h.imageUrl || '' })
    })
    setMessages(arr)
  }, [historyRows])

  React.useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const handleGenerate = async () => {
    const values = await form.validateFields()
    const body: ImageGenerationCall = { ...values, sessionId: currentSessionId }
    setMessages(prev => [...prev, { role: 'user', content: body.msg }])
    const res = await generate.mutateAsync(body)
    setMessages(prev => [...prev, { role: 'assistant', content: res?.answerMsg || '', imageUrl: res?.imageUrl || '' }])
  }

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card title={t('imgSession')} extra={<Button type="primary" loading={createTemp.isPending} onClick={() => createTemp.mutate()}>{t('newTempImgSession')}</Button>}>
          {loadingSessions ? (
            <Spin />
          ) : (
            <div style={{ height: '65vh', overflowY: 'auto' }}>
              <List
                dataSource={sessionsRows}
                rowKey={(i) => String(i.id)}
                renderItem={(item) => (
                  <List.Item onClick={() => setCurrentSessionId(item.id)} style={{ cursor: 'pointer' }}>
                    <List.Item.Meta title={item.sessionTitle || `会话 #${item.id}`} />
                  </List.Item>
                )}
              />
            </div>
          )}
        </Card>
      </Col>
      <Col span={18}>
        <Card title={t('imgGen')}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form form={form} layout="vertical" initialValues={{ model: 'dall-e-3', size: '1024x1024', quality: 'standard', style: 'vivid' }}>
              <Form.Item name="msg" label={t('prompt')} rules={[{ required: true }]}>
                <Input.TextArea rows={3} placeholder={t('promptPlaceholder')} />
              </Form.Item>
              <Row gutter={8}>
                <Col span={6}>
                  <Form.Item name="model" label={t('model')}>
                    <Select options={[{ value: 'dall-e-3', label: 'DALL·E 3' }, { value: 'dall-e-2', label: 'DALL·E 2' }]} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="size" label={t('size')}>
                    <Select options={[{ value: '1024x1024', label: '1024x1024' }, { value: '1792x1024', label: '1792x1024' }, { value: '1024x1792', label: '1024x1792' }]} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="quality" label={t('quality')}>
                    <Select options={[{ value: 'standard', label: 'standard' }, { value: 'hd', label: 'hd' }]} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="style" label={t('style')}>
                    <Select options={[{ value: 'vivid', label: 'vivid' }, { value: 'natural', label: 'natural' }]} />
                  </Form.Item>
                </Col>
              </Row>
              <Space>
                <Button type="primary" onClick={handleGenerate} loading={generate.isPending} disabled={!currentSessionId}>{t('generate')}</Button>
              </Space>
            </Form>

            <Card size="small" title={t('genRecords')}>
              <div style={{ height: '65vh', overflowY: 'auto', paddingRight: 8 }} ref={messagesRef}>
                {loadingHistory ? <Spin /> : (
                  <div>
                    {messages.map((m, i) => (
                      <ChatBubble key={i} role={m.role} content={m.content} imageUrl={m.imageUrl} />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Space>
        </Card>
      </Col>
    </Row>
  )
}
