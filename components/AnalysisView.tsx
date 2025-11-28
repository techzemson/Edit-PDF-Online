import React, { useState } from 'react';
import { PdfAnalysis, ToolAction } from '../types';
import { CustomPieChart, CustomBarChart } from './Charts';
import { DownloadIcon, TextIcon, ChartIcon, LoadingSpinner } from './Icons';
import { transformText } from '../services/geminiService';
import { jsPDF } from "jspdf";

interface Props {
  analysis: PdfAnalysis;
  onReset: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalysisView: React.FC<Props> = ({ analysis, onReset }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'charts'>('editor');
  const [editableText, setEditableText] = useState(analysis.fullText);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleToolAction = async (action: ToolAction) => {
    setIsProcessing(true);
    setLastAction(action);
    try {
      const result = await transformText(editableText, action);
      setEditableText(result);
      if (activeTab !== 'editor') setActiveTab('editor');
    } catch (e) {
      alert("Failed to process request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    
    // Title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Document Analysis Result", margin, 20);
    
    // Content
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    const splitText = doc.splitTextToSize(editableText, maxWidth);
    
    let y = 35;
    splitText.forEach((line: string) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    });
    
    doc.save("smart-pdf-edit.pdf");
    setShowExportMenu(false);
  };

  const downloadDoc = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const footer = "</body></html>";
    // Formatting text for word
    const formattedText = editableText.replace(/\n/g, '<br/>');
    const sourceHTML = header + `<div style="font-family: Arial; font-size: 11pt; white-space: pre-wrap;">${formattedText}</div>` + footer;
    
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
    // CSV with analysis data + text
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
      ["Edited Text", editableText.replace(/"/g, '""')]
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
    const element = document.createElement("a");
    const file = new Blob([editableText], {type: 'text/plain'});
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
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4 max-h-[calc(100vh-3rem)] sticky top-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 flex-shrink-0">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            AI Power Tools
          </h3>
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
            <div className="space-y-6">
              {/* Grouping Actions */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Basics</h4>
                <div className="grid grid-cols-1 gap-2">
                   {[ToolAction.SUMMARIZE, ToolAction.FIX_GRAMMAR, ToolAction.SIMPLIFY, ToolAction.BULLET_POINTS].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Translate</h4>
                <div className="grid grid-cols-2 gap-2">
                   {[ToolAction.TRANSLATE_ES, ToolAction.TRANSLATE_FR, ToolAction.TRANSLATE_DE, ToolAction.TRANSLATE_ZH].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tone & Style</h4>
                <div className="grid grid-cols-1 gap-2">
                   {[ToolAction.MAKE_PROFESSIONAL, ToolAction.MAKE_CASUAL, ToolAction.MAKE_ACADEMIC, ToolAction.MAKE_PERSUASIVE].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>

               <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Extract Data</h4>
                <div className="grid grid-cols-2 gap-2">
                   {[ToolAction.EXTRACT_EMAILS, ToolAction.EXTRACT_URLS, ToolAction.EXTRACT_DATES, ToolAction.EXTRACT_PHONE].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Advanced</h4>
                <div className="grid grid-cols-1 gap-2">
                   {[ToolAction.ACTION_ITEMS, ToolAction.RISK_ASSESSMENT, ToolAction.GENERATE_QUIZ, ToolAction.FORMAT_HTML].map(action => (
                     <ActionButton key={action} action={action} onClick={handleToolAction} disabled={isProcessing} />
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
          <h3 className="font-bold text-slate-800 mb-2">Doc Stats</h3>
          <div className="space-y-3 text-sm">
             <div className="flex justify-between items-center">
               <span className="text-slate-500">Reading Time</span>
               <span className="font-medium text-slate-900">{analysis.readingTimeMin} min</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-slate-500">Sentiment</span>
               <span className={`font-bold ${analysis.sentimentScore > 60 ? 'text-green-600' : analysis.sentimentScore < 40 ? 'text-red-600' : 'text-yellow-600'}`}>
                 {analysis.sentimentLabel} ({analysis.sentimentScore}%)
               </span>
             </div>
          </div>
        </div>

        <button 
          onClick={onReset}
          className="py-2 text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
        >
          ← Upload Another
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'editor' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TextIcon /> Editor
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'charts' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChartIcon /> Visualization
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              <DownloadIcon /> Export Result
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="py-1">
                  <button onClick={downloadPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
                    <span className="font-bold text-red-500">PDF</span> Document (.pdf)
                  </button>
                  <button onClick={downloadDoc} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
                    <span className="font-bold text-blue-600">Word</span> Document (.doc)
                  </button>
                  <button onClick={downloadCSV} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
                     <span className="font-bold text-green-600">Excel</span> / CSV Data (.csv)
                  </button>
                  <button onClick={downloadTxt} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
                     <span className="font-bold text-slate-500">TXT</span> Plain Text (.txt)
                  </button>
                </div>
              </div>
            )}
            {/* Backdrop to close menu */}
            {showExportMenu && (
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
            )}
          </div>
        </div>

        {/* Dynamic View */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col">
          
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 flex flex-col items-center animate-in fade-in zoom-in duration-200">
                <div className="text-blue-600 mb-2"><LoadingSpinner /></div>
                <p className="text-slate-600 font-medium">Processing: {lastAction}...</p>
              </div>
            </div>
          )}

          {activeTab === 'editor' ? (
            <div className="h-full flex flex-col">
               <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                  <span>AI Editor Mode</span>
                  <span className="bg-slate-200 px-2 py-1 rounded text-slate-600 font-mono">{editableText.length} chars</span>
               </div>
               <textarea
                 value={editableText}
                 onChange={(e) => setEditableText(e.target.value)}
                 className="flex-1 w-full p-6 resize-none focus:outline-none text-slate-800 leading-relaxed font-mono text-sm md:text-base"
                 spellCheck={false}
                 placeholder="Upload a PDF to see content here..."
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
    </div>
  );
};

// Helper component for buttons
interface ActionButtonProps {
  action: ToolAction;
  onClick: (action: ToolAction) => void;
  disabled: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, onClick, disabled }) => (
  <button
    onClick={() => onClick(action)}
    disabled={disabled}
    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-lg transition-all border border-slate-100 disabled:opacity-50 truncate"
    title={action}
  >
    {action}
  </button>
);

export default AnalysisView;