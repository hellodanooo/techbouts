// components/LogoUpload.tsx
import React, { useState, useCallback } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase_techbouts/config';
import Cropper from 'react-easy-crop';

// Add these interfaces for proper typing
interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface LogoUploadProps {
  docId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (downloadUrl: string) => void;
  source: string;
}

const LogoUpload: React.FC<LogoUploadProps> = ({ docId, isOpen, onClose, onSuccess, source }) => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metadata = {
    contentType: 'image/png'
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/png');
  };

  const uploadLogo = async () => {
    if (!image || !croppedAreaPixels) return;

    try {
      setUploading(true);
      setError(null);

      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      const storage = getStorage(app);
      const logoRef = ref(storage, `techbouts_${source}/${docId}.png`);
      
      const base64Data = croppedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Upload the blob and get the download URL
      await uploadBytes(logoRef, blob, metadata);
      const downloadUrl = await getDownloadURL(logoRef);
      
      onSuccess(downloadUrl);
      onClose();
    } catch (err) {
      setError('Failed to upload logo. Please try again.');
      console.error('Error uploading logo:', err);
    } finally {
      setUploading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Upload Gym Logo</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modal-body">
          {!image ? (
            <div className="upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="upload-button"
              >
                Select Image
              </label>
            </div>
          ) : (
            <>
              <div className="cropper-container">
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </div>

              <div className="zoom-control">
                <label>Zoom:</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>

              <div className="button-group">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setImage(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                >
                  Reset
                </button>
                <button
                  className="primary-button"
                  onClick={uploadLogo}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Save Logo'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0 8px;
        }

        .error-message {
          background-color: #fee2e2;
          color: #dc2626;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .upload-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .upload-button {
          background-color: #3b82f6;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .upload-button:hover {
          background-color: #2563eb;
        }

        .cropper-container {
          position: relative;
          height: 300px;
          margin-bottom: 20px;
        }

        .zoom-control {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .zoom-control input {
          flex: 1;
        }

        .button-group {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .primary-button, .secondary-button {
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s;
        }

        .primary-button {
          background-color: #3b82f6;
          color: white;
        }

        .primary-button:hover {
          background-color: #2563eb;
        }

        .primary-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }

        .secondary-button {
          background-color: #e5e7eb;
          color: #374151;
        }

        .secondary-button:hover {
          background-color: #d1d5db;
        }

        .hidden {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default LogoUpload;