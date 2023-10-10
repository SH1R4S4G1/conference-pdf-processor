import React from 'react';

type SettingsModalProps = {
  show: boolean;
  onClose: () => void;
  handlePathChange: () => void;
  currentLibreOfficePath: string | null;
  isWINWORDInstalled: boolean | undefined;
  isEXCELInstalled: boolean | undefined;
  isPOWERPOINTInstalled: boolean | undefined;
  isLibreOfficeInstalled: boolean | undefined;
  setIsWINWORDInstalled: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  setIsEXCELInstalled: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  setIsPOWERPONTInstalled: React.Dispatch<React.SetStateAction<boolean | undefined>>;
};

const SettingsModal: React.FC<SettingsModalProps> = ({ show, onClose, handlePathChange, currentLibreOfficePath, isWINWORDInstalled, isEXCELInstalled, isPOWERPOINTInstalled, isLibreOfficeInstalled, setIsWINWORDInstalled, setIsEXCELInstalled, setIsPOWERPONTInstalled  }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-60" onClick={onClose}></div>

      <div className="relative bg-white w-4/5 md:w-2/3 lg:w-1/2 p-8 border-4 border-gray-700 rounded-lg shadow-lg overflow-y-auto">

        {/* officeがインストールされていないことを警告 */}
        {!isWINWORDInstalled && <p className="bg-red-200 p-2 rounded-md">Wordが検出されませんでした。インストール済みの場合は手動で切替えてください。</p>}
        {!isEXCELInstalled && <p className="bg-red-200 p-2 rounded-md">Excelが検出されませんでした。インストール済みの場合は手動で切替えてください。</p>}
        {!isPOWERPOINTInstalled && <p className="bg-red-200 p-2 rounded-md">PowerPointが検出されませんでした。インストール済みの場合は手動で切替えてください。</p>}

        {/* Wordのインストール状況のトグルボタン */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className="cursor-pointer peer sr-only"
            checked={isWINWORDInstalled}
            onChange={() => setIsWINWORDInstalled(prev => !prev)}
          />
          <span
            className="block w-[2em] cursor-pointer bg-gray-500 rounded-full 
            p-[1px] after:block after:h-[1em] after:w-[1em] after:rounded-full 
            after:bg-white after:transition peer-checked:bg-blue-500 
            peer-checked:after:translate-x-[calc(100%-2px)]"
          >
          </span>
          <span>Word インストール済み</span>
        </label>

        {/* Excelのインストール状況のトグルボタン */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className="cursor-pointer peer sr-only"
            checked={isEXCELInstalled}
            onChange={() => setIsEXCELInstalled(prev => !prev)}
          />
          <span
            className="block w-[2em] cursor-pointer bg-gray-500 rounded-full 
            p-[1px] after:block after:h-[1em] after:w-[1em] after:rounded-full 
            after:bg-white after:transition peer-checked:bg-blue-500 
            peer-checked:after:translate-x-[calc(100%-2px)]"
          >
          </span>
          <span>Excel インストール済み</span>
        </label>

        {/* PowerPointのインストール状況のトグルボタン */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className="cursor-pointer peer sr-only"
            checked={isPOWERPOINTInstalled}
            onChange={() => setIsPOWERPONTInstalled(prev => !prev)}
          />
          <span
            className="block w-[2em] cursor-pointer bg-gray-500 rounded-full 
            p-[1px] after:block after:h-[1em] after:w-[1em] after:rounded-full 
            after:bg-white after:transition peer-checked:bg-blue-500 
            peer-checked:after:translate-x-[calc(100%-2px)]"
          >
          </span>
          <span>PowerPoint インストール済み</span>
        </label>


        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-transparent text-3xl font-bold text-gray-600 hover:text-gray-800 transition-colors">
          &times;
        </button>

        {!isLibreOfficeInstalled && <p className="bg-red-200 p-2 rounded-md">LibreOfficeがインストールされていません。</p>}

        {/* OfficeもLibreもない場合、https://ja.libreoffice.org/を案内する */}
        {!isLibreOfficeInstalled && !isWINWORDInstalled && !isEXCELInstalled && !isPOWERPOINTInstalled && <p className="bg-red-200 p-2 rounded-md">Officeファイルを開くには、LibreOfficeをインストールするか、Microsoft Officeをインストールしてください。</p>}

        {/* LibreOfficeのインストール状況のトグルボタン */}

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
