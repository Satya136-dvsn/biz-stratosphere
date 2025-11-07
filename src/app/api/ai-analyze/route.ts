import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabaseClient'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  const { query, datasetId } = await req.json()

  // Fetch the dataset from Supabase
  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .select('file_path')
    .eq('id', datasetId)
    .single()

  if (datasetError) {
    console.error('Error fetching dataset:', datasetError)
    return NextResponse.json({ error: 'Error fetching dataset' }, { status: 500 })
  }

  // Download the file from Supabase Storage
  const { data: file, error: fileError } = await supabase.storage
    .from('datasets')
    .download(dataset.file_path)

  if (fileError) {
    console.error('Error downloading file:', fileError)
    return NextResponse.json({ error: 'Error downloading file' }, { status: 500 })
  }

  // Parse the file
  const fileText = await file.text()
  let parsedData: any[] = []
  if (dataset.file_path.endsWith('.csv')) {
    parsedData = Papa.parse(fileText, { header: true }).data
  } else if (dataset.file_path.endsWith('.xlsx')) {
    const workbook = XLSX.read(fileText, { type: 'binary' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    parsedData = XLSX.utils.sheet_to_json(worksheet)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a data analyst. The user has uploaded a dataset and is asking questions about it. The data is as follows: \n\n ${JSON.stringify(
            parsedData
          )} \n\n Please answer the user's question. If the user asks for a chart, please respond with a JSON object that can be used to render a chart with recharts. The JSON object should have a "chartData" key with an array of objects, and each object should have a "name" key and one or more other keys for the data.`,
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
