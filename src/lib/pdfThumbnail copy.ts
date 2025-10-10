import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Generates a thumbnail image from the first page of a PDF file
 * @param pdfUrl - URL or data URL of the PDF file
 * @param maxWidth - Maximum width of the thumbnail (default: 300px)
 * @param maxHeight - Maximum height of the thumbnail (default: 400px)
 * @returns Promise<Blob> - Thumbnail image as a Blob
 */
export async function generatePdfThumbnail(
  pdfUrl: string,
  maxWidth: number = 300,
  maxHeight: number = 400
): Promise<Blob> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // Get the first page
    const page = await pdf.getPage(1);

    // Calculate scale to fit within max dimensions while maintaining aspect ratio
    const viewport = page.getViewport({ scale: 1 });
    const scaleX = maxWidth / viewport.width;
    const scaleY = maxHeight / viewport.height;
    const scale = Math.min(scaleX, scaleY);

    const scaledViewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Render PDF page to canvas
    const renderContext: any = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    await page.render(renderContext).promise;

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('No se pudo generar el thumbnail del PDF'));
          }
        },
        'image/jpeg',
        0.85 // Quality
      );
    });
  } catch (error) {
    console.error('Error generando thumbnail del PDF:', error);
    throw error;
  }
}

/**
 * Generates a thumbnail from a PDF File object and returns it as a File
 * @param pdfFile - PDF File object
 * @param maxWidth - Maximum width of the thumbnail
 * @param maxHeight - Maximum height of the thumbnail
 * @returns Promise<File> - Thumbnail as a File object
 */
export async function generatePdfThumbnailFile(
  pdfFile: File,
  maxWidth: number = 300,
  maxHeight: number = 400
): Promise<File> {
  // Convert File to data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(pdfFile);
  });

  // Generate thumbnail blob
  const thumbnailBlob = await generatePdfThumbnail(dataUrl, maxWidth, maxHeight);

  // Convert blob to File
  const thumbnailFileName = pdfFile.name.replace(/\.pdf$/i, '_thumbnail.jpg');
  return new File([thumbnailBlob], thumbnailFileName, { type: 'image/jpeg' });
}
