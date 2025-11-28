import React, { useState } from 'react';
import { CloseIcon } from './Icons';
import { PageSetup } from '../types';

interface Props {
  config: PageSetup;
  onSave: (config: PageSetup) => void;
  onClose: () => void;
}

const PageSetupModal: React.FC<Props> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState<PageSetup>(config);

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Page Setup & Layout</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Header Text</label>
            <input 
              type="text" 
              value={localConfig.header}
              onChange={(e) => setLocalConfig({...localConfig, header: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Company Confidential"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Footer Text</label>
            <input 
              type="text" 
              value={localConfig.footer}
              onChange={(e) => setLocalConfig({...localConfig, footer: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Copyright 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Watermark Text</label>
            <input 
              type="text" 
              value={localConfig.watermark}
              onChange={(e) => setLocalConfig({...localConfig, watermark: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., DRAFT"
            />
            <p className="text-xs text-slate-400 mt-1">Watermark will appear diagonally on every page of the exported PDF.</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="pageNums"
              checked={localConfig.showPageNumbers}
              onChange={(e) => setLocalConfig({...localConfig, showPageNumbers: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="pageNums" className="text-sm font-medium text-slate-700">Add Page Numbers</label>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageSetupModal;