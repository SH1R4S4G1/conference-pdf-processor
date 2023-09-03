// index.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ipcRenderer } from 'electron';

export default function Home() {
  const [pdfData, setPdfData] = useState<Blob | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);  
  const [fileList, setFileList] = useState<string[]>([]);

  const fetchFiles = async () => {
    const files = await window.electron.invoke('get-temp-files');
    setFileList(files);
  };

  useEffect(() => {
    fetchFiles();
  }, []); // 依存配列が空なので、このuseEffectはマウント時にのみ実行されます。

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileBuffer = await file.arrayBuffer();
      const filePath = await window.electron.invoke('save-to-temp', fileBuffer);
      uploadedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        path: filePath
      });
    }
    fetchFiles(); // ファイルを保存した後、ファイルリストを再度取得します。
  };

  return (
    <div>
      <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} style={{ border: '1px dashed', height: '200px' }}>
        PDFをここにドロップ
      </div>

      {thumbnail && (
        <div>
          <img src={thumbnail} alt="サムネイル" />
          {/* ダウンロードリンクの修正 */}
          <a href={pdfData ? URL.createObjectURL(pdfData) : '#'} download="edited.pdf">ダウンロード</a>
        </div>
      )}

      {/* 一時ディレクトリのファイル一覧を表示する */}
      <div>
        <h2>Uploaded Files</h2>
        <ul>
          {fileList.map(file => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}
