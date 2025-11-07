'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient'

export default function InsightsPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; chartData?: any[] }>([])
  const [inputValue, setInputValue] = useState('')
  const [datasets, setDatasets] = useState<{ id: string; file_name: string }[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)

  useEffect(() => {
    const fetchDatasets = async () => {
      const { data, error } = await supabase.from('datasets').select('id, file_name')
      if (data) {
        setDatasets(data)
        setSelectedDataset(data[0]?.id)
      }
    }
    fetchDatasets()
  }, [])

  const handleSendMessage = async () => {
    if (inputValue.trim() && selectedDataset) {
      const newMessages = [...messages, { role: 'user', content: inputValue }]
      setMessages(newMessages)
      setInputValue('')

      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: inputValue, datasetId: selectedDataset }),
      })

      const data = await response.json()

      try {
        const jsonResponse = JSON.parse(data.response)
        if (jsonResponse.chartData) {
          setMessages([...newMessages, { role: 'assistant', content: '', chartData: jsonResponse.chartData }])
        } else {
          setMessages([...newMessages, { role: 'assistant', content: data.response }])
        }
      } catch (error) {
        setMessages([...newMessages, { role: 'assistant', content: data.response }])
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Ask AI</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            <select onChange={(e) => setSelectedDataset(e.target.value)}>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.file_name}
                </option>
              ))}
            </select>
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
                  <p>{message.content}</p>
                  {message.chartData && (
                    <div className="mt-2">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={message.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="pv" fill="#8884d8" />
                          <Bar dataKey="uv" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
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
              placeholder="Ask a question about your data..."
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
