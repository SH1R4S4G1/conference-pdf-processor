import React from 'react';

type SettingsModalProps = {
  show: boolean;
  onClose: () => void;
  handlePathChange: () => void;
  currentLibreOfficePath: string | null;
};

const SettingsModal: React.FC<SettingsModalProps> = ({ show, onClose, handlePathChange, currentLibreOfficePath }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-60" onClick={onClose}></div>

      <div className="relative bg-white w-4/5 md:w-2/3 lg:w-1/2 p-8 border-4 border-gray-700 rounded-lg shadow-lg overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-transparent text-3xl font-bold text-gray-600 hover:text-gray-800 transition-colors">
          &times;
        </button>

        <button onClick={handlePathChange} className="p-2 bg-blue-500 text-white rounded">
          LibreOfficeのインストールフォルダを選択
        </button>
        <div>
          <p>現在設定されているLibreOfficeのパス:</p>
          <p className="bg-gray-200 p-2 rounded-md">{currentLibreOfficePath || 'LibreOfficeの実行ファイルが見つかりません。'}</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
