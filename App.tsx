import React, { useState, useEffect } from 'react';
import { AnalysisStatus, FileData, PdfAnalysis } from './types';
import { UploadIcon, CheckCircleIcon, LoadingSpinner } from './components/Icons';
import { analyzePdf } from './services/geminiService';
import AnalysisView from './components/AnalysisView';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [analysisData, setAnalysisData] = useState<PdfAnalysis | null>(null);
  const [fileName, setFileName] = useState('');

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg("Please upload a valid PDF file.");
      return;
    }

    setFileName(file.name);
    setStatus(AnalysisStatus.UPLOADING);
    setErrorMsg('');
    setProgress(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(uploadInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    // Read file
    const reader = new FileReader();
    reader.onload = async () => {
      clearInterval(uploadInterval);
      setProgress(100);
      
      const base64String = (reader.result as string).split(',')[1];
      
      setStatus(AnalysisStatus.ANALYZING);
      
      // Start "Thinking" progress
      let analysisProgress = 0;
      const analysisInterval = setInterval(() => {
        analysisProgress += 2;
        if(analysisProgress > 90) analysisProgress = 90; 
        setProgress(analysisProgress);
      }, 300);

      try {
        const data = await analyzePdf(base64String);
        clearInterval(analysisInterval);
        setAnalysisData(data);
        setStatus(AnalysisStatus.COMPLETE);
      } catch (err: any) {
        clearInterval(analysisInterval);
        setStatus(AnalysisStatus.ERROR);
        setErrorMsg(err.message || "Failed to analyze PDF. Please check your API key or file size.");
      }
    };
    reader.onerror = () => {
      clearInterval(uploadInterval);
      setStatus(AnalysisStatus.ERROR);
      setErrorMsg("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setStatus(AnalysisStatus.IDLE);
    setAnalysisData(null);
    setProgress(0);
    setFileName('');
  };

  // Render different views based on status
  if (status === AnalysisStatus.COMPLETE && analysisData) {
    return <AnalysisView analysis={analysisData} onReset={reset} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                P
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">Edit PDF Online</span>
            </div>
            <div className="flex items-center gap-4">
               <span className="text-sm text-slate-500 hidden sm:block">Advanced AI Processing</span>
               <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">Help</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero / Upload Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-3xl w-full space-y-8 text-center">
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Transform Your PDF with <span className="text-blue-600">AI Intelligence</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Upload any PDF to summarize, edit, translate, and extract data instantly. 
              Powered by advanced Gemini AI models for unmatched accuracy.
            </p>
          </div>

          {/* Upload Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-slate-100 flex flex-col items-center justify-center gap-6 min-h-[300px]">
              
              {status === AnalysisStatus.IDLE && (
                <>
                  <div className="bg-blue-50 p-6 rounded-full">
                    <UploadIcon />
                  </div>
                  <div className="space-y-2">
                    <label 
                      htmlFor="file-upload" 
                      className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 inline-block"
                    >
                      Select PDF File
                    </label>
                    <input 
                      id="file-upload" 
                      type="file" 
                      accept="application/pdf"
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <p className="text-sm text-slate-400 mt-4">or drop file here</p>
                  </div>
                  <p className="text-xs text-slate-400">Supported formats: PDF (Max 20MB)</p>
                </>
              )}

              {(status === AnalysisStatus.UPLOADING || status === AnalysisStatus.ANALYZING) && (
                <div className="w-full max-w-md space-y-6">
                  <div className="flex flex-col items-center gap-4">
                     {status === AnalysisStatus.ANALYZING ? (
                       <div className="text-blue-600"><LoadingSpinner /></div>
                     ) : (
                       <div className="text-green-500 animate-bounce"><CheckCircleIcon /></div>
                     )}
                     <h3 className="text-xl font-semibold text-slate-800">
                       {status === AnalysisStatus.UPLOADING ? "Uploading..." : "Analyzing Document..."}
                     </h3>
                     <p className="text-sm text-slate-500">
                       {status === AnalysisStatus.ANALYZING 
                        ? "Extracting entities, sentiment, and topics..." 
                        : "Preparing your file securely"}
                     </p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                      style={{ width: `${progress}%` }}
                    >
                      <span className="text-[10px] text-white font-bold">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {status === AnalysisStatus.ERROR && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 text-2xl font-bold">
                    !
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Something went wrong</h3>
                  <p className="text-red-500 max-w-sm">{errorMsg}</p>
                  <button 
                    onClick={reset}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 text-left">
             {[
               { title: "Smart Summary", desc: "Get key points instantly" },
               { title: "Edit & Rewrite", desc: "Fix grammar & tone" },
               { title: "Visual Insights", desc: "Charts & data extraction" },
               { title: "Secure & Fast", desc: "Processed in memory" }
             ].map((f, i) => (
               <div key={i} className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                 <h4 className="font-bold text-slate-800">{f.title}</h4>
                 <p className="text-sm text-slate-500">{f.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} Edit PDF Online. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;