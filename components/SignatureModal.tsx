import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface Props {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const FONTS = [
  { name: 'Sacramento', label: 'Sacramento' },
  { name: 'Dancing Script', label: 'Dancing' },
  { name: 'Great Vibes', label: 'Great Vibes' },
  { name: 'Allura', label: 'Allura' },
  { name: 'Pinyon Script', label: 'Pinyon' },
  { name: 'Tangerine', label: 'Tangerine' },
  { name: 'Herr Von Muellerhoff', label: 'Muellerhoff' },
  { name: 'Mrs Saint Delafield', label: 'Saint Delafield' },
  { name: 'Meie Script', label: 'Meie' },
  { name: 'Cedarville Cursive', label: 'Cedarville' },
  { name: 'Alex Brush', label: 'Alex Brush' },
];

const SignatureModal: React.FC<Props> = ({ onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0].name);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Customization State
  const [isBold, setIsBold] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [inkColor, setInkColor] = useState('#000000');

  // Canvas drawing logic
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.strokeStyle = inkColor;
      }
    }
  }, [activeTab, strokeWidth, inkColor]);

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
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.beginPath(); // Reset path
    }
  };

  const handleSave = () => {
    if (activeTab === 'draw' && canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    } else if (activeTab === 'type' && typedName) {
      // Create a temporary canvas to convert text to image
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear background
        ctx.fillStyle = 'rgba(0,0,0,0)'; 
        ctx.clearRect(0,0, canvas.width, canvas.height);
        
        // Font setup with Bold toggle
        ctx.font = `${isBold ? 'bold ' : ''}48px "${selectedFont}"`;
        ctx.fillStyle = inkColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(typedName, canvas.width/2, canvas.height/2);
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg">Create Your Signature</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors"><CloseIcon /></button>
        </div>

        <div className="p-2 flex gap-2 justify-center bg-white border-b border-gray-100">
           {['draw', 'type', 'upload'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={`px-6 py-2 text-sm font-medium rounded-full capitalize transition-all ${
                   activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
                 }`}
               >
                 {tab}
               </button>
           ))}
        </div>

        <div className="p-6 flex-1 flex flex-col items-center justify-start min-h-[400px] bg-gray-50 overflow-y-auto">
            
          {/* Controls Bar */}
          <div className="w-full flex justify-between items-center mb-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
             <div className="flex items-center gap-2">
                 <span className="text-xs font-semibold text-gray-500 uppercase">Color:</span>
                 <div className="flex gap-1">
                     {['#000000', '#1E40AF', '#DC2626'].map(c => (
                         <button 
                           key={c} 
                           onClick={() => setInkColor(c)}
                           className={`w-6 h-6 rounded-full border-2 ${inkColor === c ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                           style={{backgroundColor: c}}
                         />
                     ))}
                 </div>
             </div>

             {activeTab === 'draw' && (
                 <div className="flex items-center gap-2">
                     <span className="text-xs font-semibold text-gray-500 uppercase">Thickness:</span>
                     <input 
                       type="range" min="1" max="8" step="1" 
                       value={strokeWidth}
                       onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                       className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                     />
                 </div>
             )}

             {activeTab === 'type' && (
                 <div className="flex items-center gap-2">
                     <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={isBold}
                          onChange={(e) => setIsBold(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        Bold
                     </label>
                 </div>
             )}
          </div>

          {activeTab === 'draw' && (
            <div className="w-full h-64 bg-white border-2 border-dashed border-gray-300 rounded-xl relative shadow-sm">
               <canvas
                 ref={canvasRef}
                 width={500}
                 height={250}
                 className="w-full h-full cursor-crosshair touch-none"
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={stopDrawing}
                 onMouseLeave={stopDrawing}
                 onTouchStart={startDrawing}
                 onTouchMove={draw}
                 onTouchEnd={stopDrawing}
               />
               <button onClick={clearCanvas} className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700 bg-white px-3 py-1 rounded-md border border-red-100 shadow-sm font-medium">Clear</button>
               <div className="absolute bottom-2 left-0 right-0 text-center text-gray-300 text-xs pointer-events-none">Sign within the box</div>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="w-full space-y-6">
                <input 
                  type="text" 
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your name here"
                  className="w-full p-4 border border-gray-300 rounded-xl text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Style</label>
                    <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-2 border rounded-xl bg-white">
                        {FONTS.map(font => (
                            <button
                                key={font.name}
                                onClick={() => setSelectedFont(font.name)}
                                className={`p-3 text-center border rounded-lg transition-all ${selectedFont === font.name ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-100 hover:bg-gray-50'}`}
                            >
                                <span className="text-2xl text-gray-800" style={{ fontFamily: font.name, fontWeight: isBold ? 'bold' : 'normal', color: inkColor }}>
                                    {typedName || "Signature"}
                                </span>
                                <div className="text-[10px] text-gray-400 mt-1">{font.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'upload' && (
             <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input 
                    id="sig-upload" 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => {
                                 if(ev.target?.result) onSave(ev.target.result as string);
                             };
                             reader.readAsDataURL(file);
                         }
                         onClose();
                    }}
                />
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </div>
                <p className="text-gray-600 font-medium">Click to Upload Signature</p>
                <p className="text-sm text-gray-400 mt-2">Supports PNG, JPG (Transparent recommended)</p>
             </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md transform active:scale-95 transition-all">
            Insert Signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;