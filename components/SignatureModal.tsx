import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface Props {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const SignatureModal: React.FC<Props> = ({ onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Canvas drawing logic
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
      }
    }
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSave = () => {
    if (activeTab === 'draw' && canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    } else if (activeTab === 'type' && typedName) {
      // Create a temporary canvas to convert text to image
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '48px Sacramento'; // Handwriting font
        ctx.fillStyle = 'black';
        ctx.fillText(typedName, 20, 70);
        onSave(canvas.toDataURL());
      }
    } else if (activeTab === 'upload') {
        const fileInput = document.getElementById('sig-upload') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if(e.target?.result) onSave(e.target.result as string);
            }
            reader.readAsDataURL(file);
        }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Add Signature</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
        </div>

        <div className="p-2 flex gap-2 justify-center bg-white border-b border-gray-100">
           {['draw', 'type', 'upload'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={`px-4 py-2 text-sm font-medium rounded-lg capitalize ${
                   activeTab === tab ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'
                 }`}
               >
                 {tab}
               </button>
           ))}
        </div>

        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px] bg-gray-50">
          {activeTab === 'draw' && (
            <div className="w-full h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg relative">
               <canvas
                 ref={canvasRef}
                 width={450}
                 height={192}
                 className="w-full h-full cursor-crosshair touch-none"
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={stopDrawing}
                 onMouseLeave={stopDrawing}
                 onTouchStart={startDrawing}
                 onTouchMove={draw}
                 onTouchEnd={stopDrawing}
               />
               <button onClick={clearCanvas} className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500 bg-white px-2 py-1 rounded border">Clear</button>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="w-full space-y-4">
                <input 
                  type="text" 
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your name"
                  className="w-full p-4 border rounded-lg text-center text-3xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="h-24 flex items-center justify-center border rounded-lg bg-white overflow-hidden">
                    <span className="text-4xl text-gray-800" style={{ fontFamily: 'Sacramento, cursive' }}>
                        {typedName || "Signature Preview"}
                    </span>
                </div>
            </div>
          )}

          {activeTab === 'upload' && (
             <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white">
                <input id="sig-upload" type="file" accept="image/*" className="mb-2" />
                <p className="text-sm text-gray-500">Upload an image of your signature</p>
             </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm">
            Add Signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;