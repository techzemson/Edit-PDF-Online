import React, { useRef, useEffect, useState } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, SignatureIcon, ImageIcon, HighlighterIcon, EyeOffIcon } from './Icons';
import SignatureModal from './SignatureModal';

interface Props {
  initialContent: string;
  onChange: (html: string) => void;
}

const RichTextEditor: React.FC<Props> = ({ initialContent, onChange }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showSigModal, setShowSigModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize content securely
  useEffect(() => {
    if (contentRef.current) {
        // Only set if empty to avoid cursor jumping issues on re-renders
        // For a simple editor, we assume one-way flow for major updates (like AI processing)
        if(contentRef.current.innerHTML !== initialContent) {
           contentRef.current.innerHTML = initialContent;
        }
    }
  }, [initialContent]);

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
    // Insert image at cursor
    const img = `<img src="${dataUrl}" alt="signature" style="max-height: 60px; vertical-align: middle;" />`;
    // We need to restore selection or append if lost
    if (contentRef.current) {
       contentRef.current.focus();
       // This simple execCommand inserts at the cursor position
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
          const imgHtml = `<img src="${event.target.result}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
          if (contentRef.current) {
             contentRef.current.focus();
             document.execCommand('insertHTML', false, imgHtml);
             handleChange();
          }
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const redactSelection = () => {
    // Apply black background and black text
    document.execCommand('backColor', false, 'black');
    document.execCommand('foreColor', false, 'black');
    handleChange();
  };

  const highlightSelection = () => {
    document.execCommand('hiliteColor', false, '#fef08a'); // Tailwind yellow-200
    handleChange();
  };

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-white shadow-sm border-slate-200">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 flex-wrap">
        <ToolbarButton onClick={() => execCmd('bold')} title="Bold"><BoldIcon /></ToolbarButton>
        <ToolbarButton onClick={() => execCmd('italic')} title="Italic"><ItalicIcon /></ToolbarButton>
        <ToolbarButton onClick={() => execCmd('underline')} title="Underline"><UnderlineIcon /></ToolbarButton>
        
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        
        <ToolbarButton onClick={() => execCmd('insertUnorderedList')} title="Bullet List"><ListIcon /></ToolbarButton>
        <ToolbarButton onClick={highlightSelection} title="Annotate / Highlight"><HighlighterIcon /></ToolbarButton>
        <ToolbarButton onClick={redactSelection} title="Redact Selection"><EyeOffIcon /></ToolbarButton>
        
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insert Image"><ImageIcon /></ToolbarButton>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleImageUpload}
        />

        <div className="w-px h-6 bg-slate-300 mx-1"></div>

        <button
          onClick={() => setShowSigModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded transition-all ml-auto border border-transparent hover:border-slate-200"
        >
          <SignatureIcon />
          <span>Sign</span>
        </button>
      </div>

      {/* Editor Area */}
      <div 
        ref={contentRef}
        className="flex-1 p-6 overflow-y-auto outline-none prose-editor prose max-w-none text-slate-800"
        contentEditable
        onInput={handleChange}
        onBlur={handleChange}
        suppressContentEditableWarning={true}
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
    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded transition-all"
  >
    {children}
  </button>
);

export default RichTextEditor;