import React, { useState, useRef } from 'react';
import { PdfAnalysis, ToolAction, PageSetup } from '../types';
import { CustomPieChart, CustomBarChart } from './Charts';
import { DownloadIcon, TextIcon, ChartIcon, LoadingSpinner, SettingsIcon } from './Icons';
import { transformText } from '../services/geminiService';
import RichTextEditor from './RichTextEditor';
import { jsPDF } from "jspdf";
import PageSetupModal from './PageSetupModal';

interface Props {
  analysis: PdfAnalysis;
  onReset: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalysisView: React.FC<Props> = ({ analysis, onReset }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'charts'>('editor');
  // We initialize with simple text converted to basic paragraphs for the RTE
  const [editableContent, setEditableContent] = useState(() => {
    return analysis.fullText
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '<br/>')
      .join('');
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPageSetup, setShowPageSetup] = useState(false);
  
  // Page Configuration State
  const [pageConfig, setPageConfig] = useState<PageSetup>({
    watermark: '',
    header: '',
    footer: '',
    showPageNumbers: false
  });

  const handleToolAction = async (action: ToolAction) => {
    setIsProcessing(true);
    setLastAction(action);
    try {
      // Strip HTML for processing to keep Gemini focused on text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editableContent;
      const plainText = tempDiv.innerText;

      const result = await transformText(plainText, action);
      
      // Convert result back to simple HTML paragraphs
      const newHtml = result
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '<br/>')
        .join('');

      setEditableContent(newHtml);
      if (activeTab !== 'editor') setActiveTab('editor');
    } catch (e) {
      alert("Failed to process request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = async () => {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4'
    });

    // Create a temporary container to render HTML specifically for PDF
    const tempContainer = document.createElement('div');
    tempContainer.style.width = '550px'; // A4 width approx in pt minus margins
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '12px';
    tempContainer.innerHTML = `
      <div style="color: #444; line-height: 1.5;">${editableContent}</div>
    `;
    document.body.appendChild(tempContainer);

    try {
        await doc.html(tempContainer, {
            callback: (doc) => {
                const pageCount = doc.getNumberOfPages();
                const width = doc.internal.pageSize.getWidth();
                const height = doc.internal.pageSize.getHeight();

                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(10);
                    doc.setTextColor(150);

                    // Header
                    if (pageConfig.header) {
                        doc.text(pageConfig.header, 20, 30);
                    }

                    // Footer
                    if (pageConfig.footer) {
                         doc.text(pageConfig.footer, 20, height - 20);
                    }

                    // Page Numbers
                    if (pageConfig.showPageNumbers) {
                        doc.text(`Page ${i} of ${pageCount}`, width - 100, height - 20);
                    }

                    // Watermark (Centered, Rotated)
                    if (pageConfig.watermark) {
                        doc.saveGraphicsState();
                        doc.setTextColor(230, 230, 230); // Very light gray
                        doc.setFontSize(50);
                        // Rotate 45 degrees approx center
                        doc.text(pageConfig.watermark, width / 2, height / 2, { align: 'center', angle: 45 });
                        doc.restoreGraphicsState();
                    }
                }

                doc.save("smart-pdf-edit.pdf");
                document.body.removeChild(tempContainer);
            },
            x: 20,
            y: 40, // Offset for header
            width: 550,
            windowWidth: 800,
            margin: [40, 20, 40, 20] // Top, Right, Bottom, Left
        });
    } catch (e) {
        console.error(e);
        document.body.removeChild(tempContainer);
        alert("Could not generate PDF with advanced formatting. Falling back to simple text.");
    }
    
    setShowExportMenu(false);
  };

  const downloadDoc = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + `<div style="font-family: Arial; font-size: 11pt;">${editableContent}</div>` + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'smart-pdf-edit.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
    setShowExportMenu(false);
  };

  const downloadCSV = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editableContent;
    const plainText = tempDiv.innerText;

    const rows = [
      ["Type", "Content"],
      ["Summary", analysis.summary.replace(/"/g, '""')],
      ["Reading Time", `${analysis.readingTimeMin} min`],
      ["Sentiment", `${analysis.sentimentLabel} (${analysis.sentimentScore}%)`],
      ["Entity Count", analysis.entityCount],
      [],
      ["Keyword", "Frequency"],
      ...analysis.keywords.map(k => [k.name, k.value]),
      [],
      ["Topic", "Relevance"],
      ...analysis.topics.map(t => [t.name, t.value]),
      [],
      ["Edited Text", plainText.replace(/"/g, '""')]
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(c => `"${c}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "smart-pdf-data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const downloadTxt = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editableContent;
    const plainText = tempDiv.innerText;

    const element = document.createElement("a");
    const file = new Blob([plainText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "smart-pdf-edit.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      
      {/* Sidebar / Toolbar */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 lg:max-h-[calc(100vh-3rem)] sticky top-6">
        
        {/* Upload Another Button (Moved to Top) */}
        <button 
          onClick={onReset}
          className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 text-lg"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Upload Another PDF
        </button>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </span>
                AI Power Tools
             </h3>
             <p className="text-xs text-slate-500 mt-1 pl-10">Click to transform your content</p>
          </div>
          
          <div className="overflow-y-auto pr-2 pl-4 pb-4 pt-2 custom-scrollbar flex-1 space-y-6">
              {/* Group: Smart Basics */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> 
                    Smart Actions
                </h4>
                <div className="grid grid-cols-1 gap-2">
                   {[ToolAction.SUMMARIZE, ToolAction.FIX_GRAMMAR, ToolAction.SIMPLIFY, ToolAction.BULLET_POINTS].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>

              {/* Group: Writing & Editing */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> 
                    Writing Assistant
                </h4>
                <div className="grid grid-cols-1 gap-2">
                   {[ToolAction.DRAFT_REPLY, ToolAction.CRITIQUE, ToolAction.MAKE_PROFESSIONAL, ToolAction.EXPAND].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                   <div className="grid grid-cols-2 gap-2">
                       {[ToolAction.MAKE_CASUAL, ToolAction.MAKE_PERSUASIVE].map(action => (
                         <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                       ))}
                   </div>
                </div>
              </div>

               {/* Group: Data & Extraction */}
               <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> 
                    Extract & Organize
                </h4>
                <div className="grid grid-cols-1 gap-2">
                     <ActionButton action={ToolAction.CONVERT_TO_TABLE} onClick={handleToolAction} disabled={isProcessing} />
                     <ActionButton action={ToolAction.EXPLAIN_TERMS} onClick={handleToolAction} disabled={isProcessing} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                   {[ToolAction.EXTRACT_EMAILS, ToolAction.EXTRACT_URLS, ToolAction.EXTRACT_DATES, ToolAction.EXTRACT_PHONE].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>

              {/* Group: Structure & Knowledge */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> 
                    Structure & Knowledge
                </h4>
                <div className="grid grid-cols-1 gap-2">
                   {[ToolAction.ACTION_ITEMS, ToolAction.GENERATE_FAQS, ToolAction.GENERATE_QUIZ, ToolAction.FORMAT_HTML].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>

              {/* Group: Clean & Secure */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> 
                    Clean & Secure
                </h4>
                <div className="grid grid-cols-1 gap-2">
                   {[ToolAction.REMOVE_WATERMARK, ToolAction.REDACT_PII].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>

              {/* Group: Translate */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> 
                    Translate
                </h4>
                <div className="grid grid-cols-2 gap-2">
                   {[ToolAction.TRANSLATE_ES, ToolAction.TRANSLATE_FR, ToolAction.TRANSLATE_DE, ToolAction.TRANSLATE_ZH].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200 flex-shrink-0">
          <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Document Stats</h3>
          <div className="space-y-3 text-sm">
             <div className="flex justify-between items-center">
               <span className="text-slate-500">Reading Time</span>
               <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{analysis.readingTimeMin} min</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-slate-500">Entities</span>
               <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{analysis.entityCount}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-slate-500">Sentiment</span>
               <span className={`font-bold px-2 py-0.5 rounded ${analysis.sentimentScore > 60 ? 'text-green-700 bg-green-100' : analysis.sentimentScore < 40 ? 'text-red-700 bg-red-100' : 'text-yellow-700 bg-yellow-100'}`}>
                 {analysis.sentimentLabel}
               </span>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-md border border-slate-200 flex-wrap gap-2">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all ${
                activeTab === 'editor' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <TextIcon /> Editor
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all ${
                activeTab === 'charts' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <ChartIcon /> Visualization
            </button>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
               onClick={() => setShowPageSetup(true)}
               className="flex items-center gap-2 px-4 py-2.5 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <SettingsIcon /> Page Setup
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
              >
                <DownloadIcon /> Export
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">Download As</div>
                    <button onClick={downloadPDF} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">PDF</div>
                      <span className="font-semibold">PDF Document</span>
                    </button>
                    <button onClick={downloadDoc} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">DOC</div>
                      <span className="font-semibold">Word Document</span>
                    </button>
                    <button onClick={downloadCSV} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">CSV</div>
                      <span className="font-semibold">Excel / Data</span>
                    </button>
                    <button onClick={downloadTxt} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">TXT</div>
                      <span className="font-semibold">Plain Text</span>
                    </button>
                  </div>
                </div>
              )}
              {showExportMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic View */}
        <div className="flex-1 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden relative flex flex-col">
          
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl">
              <div className="bg-white p-8 rounded-2xl shadow-2xl border border-blue-100 flex flex-col items-center animate-in fade-in zoom-in duration-200 max-w-sm text-center">
                <div className="text-blue-600 mb-4 scale-150"><LoadingSpinner /></div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">AI is Working...</h3>
                <p className="text-slate-500 text-sm">Processing <strong>{lastAction}</strong>. This may take a few seconds.</p>
              </div>
            </div>
          )}

          {activeTab === 'editor' ? (
            <div className="h-full flex flex-col p-1">
               <RichTextEditor 
                 initialContent={editableContent}
                 onChange={setEditableContent}
               />
            </div>
          ) : (
            <div className="p-6 overflow-y-auto h-full grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-6 text-center">Topic Distribution</h4>
                <CustomPieChart data={analysis.topics} colors={COLORS} />
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {analysis.topics.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-6 text-center">Top Keywords</h4>
                <CustomBarChart data={analysis.keywords} />
              </div>

              <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <span className="text-xl">✨</span> AI Summary
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPageSetup && (
        <PageSetupModal 
          config={pageConfig}
          onSave={setPageConfig}
          onClose={() => setShowPageSetup(false)}
        />
      )}
    </div>
  );
};

// Helper component for buttons (Enhanced Design)
interface ActionButtonProps {
  action: ToolAction;
  onClick: (action: ToolAction) => void;
  disabled: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, onClick, disabled }) => (
  <button
    onClick={() => onClick(action)}
    disabled={disabled}
    className="group w-full text-left px-4 py-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
    title={action}
  >
    <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 truncate mr-2">{action}</span>
    <span className="text-slate-300 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-transform">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
      </svg>
    </span>
  </button>
);

export default AnalysisView;