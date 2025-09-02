// Define type for pixel crop area
export type Area = { x: number; y: number; width: number; height: number }

// Helper function to create a cropped image
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error: Event) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number = pixelCrop.width,
  outputHeight: number = pixelCrop.height
): Promise<Blob | null> {
  try {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    
    // Get context with alpha channel explicitly enabled
    const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: true })

    if (!ctx) {
      return null
    }

    // Set canvas dimensions
    canvas.width = outputWidth
    canvas.height = outputHeight

    // Ensure the canvas is fully transparent before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set compositing mode for proper transparency handling
    ctx.globalCompositeOperation = 'source-over'

    // Draw the image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputWidth,
      outputHeight
    )

    // Always use PNG to preserve transparency
    return new Promise((resolve) => {
      // Using 1.0 quality for best transparency
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png', 1.0)
    })
  } catch (error) {
    console.error("Error in getCroppedImg:", error)
    return null
  }
} 