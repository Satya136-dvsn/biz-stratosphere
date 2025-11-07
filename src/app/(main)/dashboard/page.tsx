'use client'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function DashboardPage() {
  const exportToPdf = () => {
    const input = document.getElementById('dashboard')
    if (input) {
      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF()
        pdf.addImage(imgData, 'PNG', 0, 0)
        pdf.save('dashboard.pdf')
      })
    }
  }

  return (
    <div>
      <div id="dashboard">
        <h1>Dashboard</h1>
      </div>
      <button onClick={exportToPdf} className="mt-4 px-4 py-2 bg-violet text-white rounded-lg">
        Export to PDF
      </button>
    </div>
  )
}
