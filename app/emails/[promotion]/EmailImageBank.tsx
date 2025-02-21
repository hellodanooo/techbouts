import React, { useState, useEffect } from 'react';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase_techbouts/config';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (url: string) => void;
}

const ImageBankModal = ({ isOpen, onClose, onImageSelect }: ImageBankModalProps) => {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const storage = getStorage(app);
        const emailImagesRef = ref(storage, 'email_images');
        const eventFlyersRef = ref(storage, 'event_flyers');
        
        const [emailImagesResult, eventFlyersResult] = await Promise.all([
          listAll(emailImagesRef),
          listAll(eventFlyersRef)
        ]);

        const allItems = [...emailImagesResult.items, ...eventFlyersResult.items];
        
        const imagePromises = allItems.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            name: item.name,
            url: url
          };
        });

        const imageResults = await Promise.all(imagePromises);
        setImages(imageResults);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching images:', error);
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Image Bank</h2>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="text-center py-8">Loading images...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div 
                    key={image.name}
                    className="relative group cursor-pointer border rounded-lg overflow-hidden"
                    onClick={() => {
                      onImageSelect(image.url);
                      onClose();
                    }}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100">
                        Select
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ImageBankModal;