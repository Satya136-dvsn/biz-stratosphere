import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabaseClient'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  const { query, datasetId } = await req.json()

  // TODO: Create embeddings of the dataset and store them in the documents table

  // Create an embedding of the user's query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  })
  const queryEmbedding = embeddingResponse.data[0].embedding

  // Search for similar documents in the database
  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: 5,
  })

  if (error) {
    console.error('Error matching documents:', error)
    return NextResponse.json({ error: 'Error matching documents' }, { status: 500 })
  }

  const context = documents.map((doc: any) => doc.content).join('\n\n')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. The user is asking a question about a dataset. The following is some relevant context from the dataset: \n\n ${context} \n\n Please answer the user's question based on the context.`,
        },
        { role: 'user', content: query },
      ],
    })

    return NextResponse.json({ response: response.choices[0].message.content })
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    return NextResponse.json({ error: 'Error calling OpenAI API' }, { status: 500 })
  }
}
