import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useCallback } from 'react'

export function usePdfExport(contentRef, topicName) {
  const exportPdf = useCallback(async () => {
    if (!contentRef.current) return
    document.body.classList.add('printing')
    await new Promise((r) => setTimeout(r, 100))
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`chapter-${topicName}.pdf`)
    } finally {
      document.body.classList.remove('printing')
    }
  }, [contentRef, topicName])

  return exportPdf
}

export function usePngExport(canvasRef, topicName) {
  const exportPng = useCallback(() => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `chart-${topicName}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [canvasRef, topicName])

  return exportPng
}
