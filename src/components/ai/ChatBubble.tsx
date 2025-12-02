import { Avatar, Card } from 'antd'
import React from 'react'
import Markdown from './Markdown'

type Props = {
  role: 'user' | 'assistant'
  content?: string
  imageUrl?: string
}

export default function ChatBubble({ role, content, imageUrl }: Props) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && <Avatar style={{ marginRight: 8 }}>AI</Avatar>}
      <Card style={{ maxWidth: '70%', borderRadius: 8 }} bodyStyle={{ padding: 12 }}>
        {imageUrl ? (
          <img src={imageUrl} alt="image" style={{ maxWidth: '100%', borderRadius: 6 }} />
        ) : (
          <Markdown content={content} />
        )}
      </Card>
      {isUser && <Avatar style={{ marginLeft: 8 }}>U</Avatar>}
    </div>
  )
}
