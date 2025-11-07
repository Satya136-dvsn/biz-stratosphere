'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ChatbotPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [inputValue, setInputValue] = useState('')
  const [datasetId, setDatasetId] = useState('123') // TODO: Replace with actual datasetId

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const newMessages = [...messages, { role: 'user', content: inputValue }]
      setMessages(newMessages)
      setInputValue('')

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: inputValue, datasetId }),
      })

      const data = await response.json()
      setMessages([...newMessages, { role: 'assistant', content: data.response }])
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Chatbot</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage()
                }
              }}
              placeholder="Ask a question..."
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
