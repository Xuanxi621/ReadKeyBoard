// Robust PDF.js Loader & Thumbnail Renderer

export async function loadPdfDocument(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer.slice(0));
  try {
    return await window.pdfjsLib.getDocument({ data: data }).promise;
  } catch (err) {
    console.warn('PDF.js standard worker load failed, trying blob worker...', err);
    try {
      if (!window._blobWorkerUrl) {
        const response = await fetch('pdf.worker.min.js');
        const text = await response.text();
        const blob = new Blob([text], { type: 'application/javascript' });
        window._blobWorkerUrl = URL.createObjectURL(blob);
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = window._blobWorkerUrl;
      return await window.pdfjsLib.getDocument({ data: data }).promise;
    } catch (e2) {
      console.error('All PDF worker methods failed', e2);
      throw err;
    }
  }
}

export async function generateCoverThumbnail(pdfDoc) {
  try {
    const page = await pdfDoc.getPage(1);
    const scale = 0.5;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (e) {
    console.warn('Thumbnail generation failed, using fallback:', e);
    return null;
  }
}
