import React, { useRef, useEffect, useState } from 'react';
import { 
  BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, SignatureIcon, 
  ImageIcon, HighlighterIcon, EyeOffIcon, LinkIcon, 
  AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
  UndoIcon, RedoIcon
} from './Icons';
import SignatureModal from './SignatureModal';

interface Props {
  initialContent: string;
  onChange: (html: string) => void;
}

const RichTextEditor: React.FC<Props> = ({ initialContent, onChange }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showSigModal, setShowSigModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  // Initialize content securely
  useEffect(() => {
    if (contentRef.current) {
        if(contentRef.current.innerHTML !== initialContent) {
           contentRef.current.innerHTML = initialContent;
        }
    }
  }, [initialContent]);

  // Click handler to detect image selection
  useEffect(() => {
    const handleEditorClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
            // Deselect previous
            if (selectedImage) {
                selectedImage.style.outline = 'none';
            }
            // Select new
            target.style.outline = '2px solid #3b82f6'; // Blue outline
            setSelectedImage(target as HTMLImageElement);
        } else {
            // Deselect if clicking elsewhere
            if (selectedImage) {
                selectedImage.style.outline = 'none';
                setSelectedImage(null);
            }
        }
    };

    const editor = contentRef.current;
    if (editor) {
        editor.addEventListener('click', handleEditorClick);
    }
    return () => {
        if (editor) editor.removeEventListener('click', handleEditorClick);
    };
  }, [selectedImage]);

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleChange();
  };

  const handleChange = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const insertSignature = (dataUrl: string) => {
    const img = `<img src="${dataUrl}" alt="signature" draggable="true" style="max-height: 60px; vertical-align: middle; cursor: move; display: inline-block; margin: 0 4px;" />`;
    if (contentRef.current) {
       contentRef.current.focus();
       document.execCommand('insertHTML', false, img);
       handleChange();
    }
    setShowSigModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imgHtml = `<img src="${event.target.result}" draggable="true" style="max-width: 100%; height: auto; margin: 10px 0; cursor: move;" />`;
          if (contentRef.current) {
             contentRef.current.focus();
             document.execCommand('insertHTML', false, imgHtml);
             handleChange();
          }
        }
      };
      reader.readAsDataURL(file);
    }
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertLink = () => {
    const url = prompt("Enter the link URL:");
    if (url) {
        execCmd('createLink', url);
    }
  };

  const redactSelection = () => {
    document.execCommand('backColor', false, 'black');
    document.execCommand('foreColor', false, 'black');
    handleChange();
  };

  const highlightSelection = () => {
    document.execCommand('hiliteColor', false, '#fef08a');
    handleChange();
  };

  const updateImageSize = (percent: number) => {
      if (selectedImage) {
          selectedImage.style.width = `${percent}%`;
          selectedImage.style.maxHeight = 'none'; // Unset max-height restriction if manually resizing width
          handleChange();
      }
  };

  const deleteSelectedImage = () => {
      if(selectedImage) {
          selectedImage.remove();
          setSelectedImage(null);
          handleChange();
      }
  };

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-white shadow-sm border-slate-200">
      {/* Enhanced Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 flex-wrap select-none min-h-[50px]">
        
        {selectedImage ? (
            <div className="flex items-center gap-4 w-full animate-in fade-in">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 uppercase">Image Selected</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Size:</span>
                    <input 
                      type="range" min="10" max="100" step="5" defaultValue="50"
                      onChange={(e) => updateImageSize(parseInt(e.target.value))}
                      className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => updateImageSize(25)} className="text-xs px-2 py-1 bg-white border rounded hover:bg-slate-50">S</button>
                    <button onClick={() => updateImageSize(50)} className="text-xs px-2 py-1 bg-white border rounded hover:bg-slate-50">M</button>
                    <button onClick={() => updateImageSize(100)} className="text-xs px-2 py-1 bg-white border rounded hover:bg-slate-50">L</button>
                </div>
                <button 
                  onClick={deleteSelectedImage}
                  className="ml-auto text-xs px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 font-medium"
                >
                    Remove Image
                </button>
                <button 
                  onClick={() => {
                      if(selectedImage) {
                          selectedImage.style.outline = 'none';
                          setSelectedImage(null);
                      }
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                    Cancel
                </button>
            </div>
        ) : (
            <>
                {/* History Group */}
                <div className="flex items-center gap-0.5 mr-2">
                    <ToolbarButton onClick={() => execCmd('undo')} title="Undo"><UndoIcon /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('redo')} title="Redo"><RedoIcon /></ToolbarButton>
                </div>
                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                {/* Formatting Group */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={() => execCmd('bold')} title="Bold (Ctrl+B)"><BoldIcon /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('italic')} title="Italic (Ctrl+I)"><ItalicIcon /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('underline')} title="Underline (Ctrl+U)"><UnderlineIcon /></ToolbarButton>
                </div>
                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                {/* Paragraph Group */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={() => execCmd('justifyLeft')} title="Align Left"><AlignLeftIcon /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('justifyCenter')} title="Align Center"><AlignCenterIcon /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('justifyRight')} title="Align Right"><AlignRightIcon /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('justifyFull')} title="Justify"><AlignJustifyIcon /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('insertUnorderedList')} title="Bullet List"><ListIcon /></ToolbarButton>
                </div>
                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                {/* Insert Group */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={insertLink} title="Insert Link"><LinkIcon /></ToolbarButton>
                    <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insert Image"><ImageIcon /></ToolbarButton>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                {/* Tools Group */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={highlightSelection} title="Highlight Text"><HighlighterIcon /></ToolbarButton>
                    <ToolbarButton onClick={redactSelection} title="Redact (Blackout)"><EyeOffIcon /></ToolbarButton>
                </div>

                {/* Signature CTA */}
                <div className="ml-auto pl-2">
                    <button
                    onClick={() => setShowSigModal(true)}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border border-transparent"
                    title="Add Signature"
                    >
                    <SignatureIcon />
                    <span>SIGN</span>
                    </button>
                </div>
            </>
        )}
      </div>

      {/* Editor Area */}
      <div 
        ref={contentRef}
        className="flex-1 p-8 overflow-y-auto outline-none prose-editor prose max-w-none text-slate-800 bg-white"
        contentEditable
        onInput={handleChange}
        onBlur={handleChange}
        suppressContentEditableWarning={true}
        style={{ minHeight: '600px' }}
      />

      {showSigModal && (
        <SignatureModal 
          onSave={insertSignature}
          onClose={() => setShowSigModal(false)}
        />
      )}
    </div>
  );
};

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; title: string }> = ({ onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-all active:scale-95"
  >
    {children}
  </button>
);

export default RichTextEditor;