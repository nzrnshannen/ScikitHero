import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { useCallback } from 'react'

export function usePdfExport() {
  const exportPdf = useCallback(async ({ previewRef }) => {
    if (!previewRef || !previewRef.current) return
    
    // We add a temporary printing class if needed, though the preview is already formatted perfectly
    document.body.classList.add('printing')

    try {
      // Find all the chapter pages rendered inside the preview sheet container
      const chapterNodes = previewRef.current.querySelectorAll('.chapter-page')
      
      if (chapterNodes.length === 0) {
        throw new Error("No chapter pages found to export.")
      }

      let pdf = null;
      const pdfWidth = 210; // 210mm standard A4 width

      // Allow a tiny bit of time for any fonts/images inside the preview to settle
      await new Promise((r) => setTimeout(r, 100))

      for (let i = 0; i < chapterNodes.length; i++) {
        const node = chapterNodes[i]
        
        try {
          const canvas = await html2canvas(node, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#0f1117',
            logging: false,
          })
          
          const imgData = canvas.toDataURL('image/png')
          const dynamicHeight = (canvas.height * pdfWidth) / canvas.width;
          
          if (!pdf) {
            pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: [pdfWidth, dynamicHeight],
            })
          } else {
            pdf.addPage([pdfWidth, dynamicHeight], 'portrait')
          }
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, dynamicHeight)
        } catch (pageErr) {
          console.error(`Failed to export page ${i}:`, pageErr)
          // Add a fallback blank page with error text to continue export
          if (!pdf) {
            pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, 297] })
          } else {
            pdf.addPage([pdfWidth, 297], 'portrait')
          }
          pdf.setTextColor(255, 0, 0)
          pdf.text(`Error: Failed to render chapter ${i + 1}`, 20, 30)
          pdf.setTextColor(150, 150, 150)
          pdf.text("This is usually caused by a cross-origin image or tainted canvas.", 20, 40)
        }
      }

      if (pdf) {
        const filename = chapterNodes.length > 1 ? 'scikithero-textbook.pdf' : 'scikithero-chapter.pdf'
        pdf.save(filename)
      }
      
    } catch (error) {
      alert("Export Error: " + error.message)
      console.error(error)
    } finally {
      document.body.classList.remove('printing')
    }
  }, [])

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
