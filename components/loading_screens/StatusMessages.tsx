'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface StatusMessagesProps {
  messages: string[];
  isVisible: boolean;
  onClose: () => void;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({ 
  messages, 
  isVisible,
  onClose 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Match Creation Progress</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="p-2 text-gray-500 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Initializing match creation...
              </div>
            ) : (
              messages.map((message, index) => {
                // Determine message type based on content for styling
                const isError = message.includes('❌');
                const isSuccess = message.includes('✅');
                const isWarning = message.includes('⚠️');
                const isProcessing = message.includes('🔄') || message.includes('⚙️') || message.includes('🔍');
                
                let bgColor = 'bg-gray-100';
                if (isError) bgColor = 'bg-red-50';
                if (isSuccess) bgColor = 'bg-green-50';
                if (isWarning) bgColor = 'bg-yellow-50';
                if (isProcessing) bgColor = 'bg-blue-50';
                
                return (
                  <div 
                    key={index} 
                    className={`p-2 rounded ${bgColor} text-sm font-mono`}
                  >
                    {message}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusMessages;