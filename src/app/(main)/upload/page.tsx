'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabaseClient'

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [parsedData, setParsedData] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    parseFile(acceptedFiles[0])
  }, [])

  const parseFile = (file: File) => {
    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: (result) => {
          setParsedData(result.data)
        },
      })
    } else if (file.name.endsWith('.xlsx')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        setParsedData(json)
      }
      reader.readAsBinaryString(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleUpload = async () => {
    if (files.length === 0) {
      return
    }

    setUploading(true)
    setUploadSuccess(false)

    const file = files[0]
    const fileName = `${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('datasets')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      setUploading(false)
      return
    }

    const { data: insertData, error: insertError } = await supabase
      .from('datasets')
      .insert([
        {
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
        },
      ])

    if (insertError) {
      console.error('Error inserting file metadata:', insertError)
      setUploading(false)
      return
    }

    setUploading(false)
    setUploadSuccess(true)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div
        {...getRootProps()}
        className={`w-full max-w-lg p-10 border-2 border-dashed rounded-lg text-center cursor-pointer ${
          isDragActive ? 'border-blue-500' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold">Selected files:</h4>
          <ul>
            {files.map((file) => (
              <li key={file.name}>
                {file.name} - {file.size} bytes
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpload}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {uploadSuccess && (
            <p className="mt-2 text-green-500">File uploaded successfully!</p>
          )}
        </div>
      )}
      {parsedData.length > 0 && (
        <div className="mt-8 w-full">
          <h4 className="text-lg font-semibold">Data Preview:</h4>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr>
                  {Object.keys(parsedData[0]).map((key) => (
                    <th key={key} className="px-4 py-2">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((value: any, j) => (
                      <td key={j} className="border px-4 py-2">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
