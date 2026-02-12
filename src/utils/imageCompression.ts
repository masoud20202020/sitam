
/**
 * Utility to compress images client-side before upload
 * Uses HTML Canvas to resize and reduce quality
 */

export interface CompressionOptions {
  maxWidthOrHeight?: number;
  maxSizeMB?: number;
  quality?: number; // 0 to 1
}

export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const {
    maxWidthOrHeight = 1920,
    maxSizeMB = 1,
    quality = 0.8
  } = options;

  // Skip compression for SVGs or non-image files
  if (file.type === 'image/svg+xml' || !file.type.startsWith('image/')) {
    return file;
  }

  // If already small enough and no resize needed, return original
  if (file.size <= maxSizeMB * 1024 * 1024 && !maxWidthOrHeight) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (maxWidthOrHeight) {
          if (width > height) {
            if (width > maxWidthOrHeight) {
              height = Math.round((height * maxWidthOrHeight) / width);
              width = maxWidthOrHeight;
            }
          } else {
            if (height > maxWidthOrHeight) {
              width = Math.round((width * maxWidthOrHeight) / height);
              height = maxWidthOrHeight;
            }
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format
        // Prefer WebP for better compression + transparency support
        // Fallback to JPEG if original was JPEG or if we want max compression
        // Keep PNG if original was PNG to be safe, but WebP is usually better
        const outputType = 'image/webp';
        
        // If original is JPEG, stick to JPEG or WebP. 
        // If original is PNG, WebP is best to keep transparency with low size.
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to original if blob creation fails
              resolve(file); 
              return;
            }
            
            // Create new file from blob
            const newExtension = outputType === 'image/webp' ? 'webp' : file.name.split('.').pop();
            const newName = file.name.replace(/\.[^/.]+$/, "") + "." + newExtension;

            const newFile = new File([blob], newName, {
              type: outputType,
              lastModified: Date.now(),
            });

            resolve(newFile);
          },
          outputType,
          quality
        );
      };
      
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
