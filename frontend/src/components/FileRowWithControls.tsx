import React from 'react';
import { FaRegTrashAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';

type Props = {
  fileName: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

const FileRowWithControls: React.FC<Props> = ({
  fileName,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => (
  <div className="flex justify-between items-center mb-2 bg-white rounded-md m-2">
    <p className='text-left ml-3'>{fileName}</p>
    <div className="flex space-x-2 m-1">
      <FaRegTrashAlt size={30} color="red" className="px-2 py-1 hover:bg-red-100 rounded" onClick={onRemove} />
      <FaArrowUp size={30} color="green" className={`px-2 py-1 hover:bg-green-100 rounded ${isFirst ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={onMoveUp} />
      <FaArrowDown size={30} color="blue" className={`px-2 py-1 hover:bg-blue-100 rounded ${isLast ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={onMoveDown} />
    </div>
  </div>
);

export default FileRowWithControls;
