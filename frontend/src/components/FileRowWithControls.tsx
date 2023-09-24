import React, { useState, useRef, useEffect } from 'react';
import { FaRegTrashAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';

type FileRowWithControlsProps = {
  fileName: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onFileNameChange: (newFileName: string) => void;
  onEditStateChange?: (isEditing: boolean) => void;
};

  const FileRowWithControls: React.FC<FileRowWithControlsProps> = ({
    fileName,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onRemove,
    onFileNameChange,
    onEditStateChange,
  }) => {
    const [editing, setEditing] = useState(false);
    const [tempFileName, setTempFileName] = useState(fileName);
    const inputRef = useRef<HTMLInputElement | null>(null); // 入力フィールドの参照を取得

    const toggleEditing = (isEditing: boolean) => {
      setEditing(isEditing);
      if (onEditStateChange) {
        onEditStateChange(isEditing);
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (editing && inputRef.current && !inputRef.current.contains(event.target as Node)) {
          // クリックがフォームの外部で行われた場合
          toggleEditing(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        // コンポーネントのアンマウント時にイベントリスナーを削除
        document.removeEventListener("mousedown", handleClickOutside);
      };
      
    }, [editing]);

    const handleFileNameChange = (newFileName: string) => {
      // newFileNameが空欄だった場合、「新しいファイル」を設定
      if (!newFileName || newFileName.trim() === "") {
        newFileName = "新しいファイル";
      }
      setTempFileName(newFileName); // ローカルステートを更新
      onFileNameChange(newFileName);
      toggleEditing(false);
    };

  return (
    <div className="flex justify-between items-center mb-2 bg-white rounded-md m-2">
      {editing ? (
        <input
          type="text"
          value={tempFileName}
          onChange={e => setTempFileName(e.target.value)}
          onBlur={() => handleFileNameChange(tempFileName)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              handleFileNameChange(tempFileName);
            }
          }}
          autoFocus
        />
      ) : (
      <span 
        className="whitespace-nowrap overflow-hidden overflow-ellipsis w-11/12" 
        title={fileName} 
        onClick={() => toggleEditing(true)}
      >
        {fileName}
      </span>
    )}

    {editing === false && (
      <div className="flex space-x-2 m-1">
        <FaRegTrashAlt size={30} color="red" className="px-2 py-1 hover:bg-red-100 rounded" onClick={onRemove} />
        <FaArrowUp size={30} color="green" className={`px-2 py-1 hover:bg-green-100 rounded ${isFirst ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={onMoveUp} />
        <FaArrowDown size={30} color="blue" className={`px-2 py-1 hover:bg-blue-100 rounded ${isLast ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={onMoveDown} />
      </div>
    )}
    </div>
  );
};

export default FileRowWithControls;
