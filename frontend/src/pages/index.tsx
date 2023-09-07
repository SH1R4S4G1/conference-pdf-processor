// index.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ipcRenderer } from 'electron';
import * as os from 'os';
import * as path from 'path';

export default function Home() {
  const [pdfData, setPdfData] = useState<Blob | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);  
  const [fileList, setFileList] = useState<string[]>([]);

  // ページ数が奇数のPDFファイルの一覧
  const [oddPageFiles, setOddPageFiles] = useState<string[]>([]);
  // ページ数が偶数のPDFファイルの一覧
  // const [evenPageFiles, setEvenPageFiles] = useState<string[]>([]);

  useEffect(() => {
    console.log('fileList has changed:', fileList);
  }, [fileList]);
  
  useEffect(() => {
    console.log('oddPageFiles has changed:', oddPageFiles);
  }, [oddPageFiles]);  

  const fetchFiles = async () => {
    const files = await window.electron.invoke('get-temp-files');
    setFileList(files);
  };

  useEffect(() => {
    fetchFiles();
  }, []); // 依存配列が空なので、このuseEffectはマウント時にのみ実行されます。

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  
    // ドロップされたファイルを取得
    const files = event.dataTransfer.files;
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      // let convertedFilePath: string | null = null;
  
      if (file.type === 'application/pdf' || ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt || '')) {
        // ファイルがWord, Excel, PowerPointの場合、変換後のPDFを取得
        const fileBuffer = await file.arrayBuffer();
        // const tempDir = os.tmpdir(); // windowsなのにlinuxのtempDirが取得される
        const tempDir = 'C:\\Users\\devuser\\AppData\\Local\\Temp'; // TODO: 環境変数から取得するようにする
        console.log("Temp Directory:", tempDir); 
        const uniqueFilename = Date.now() + ".pdf"; // 一時保存ディレクトリに保存するファイルの名前
        const outputFilePath = path.join(tempDir, uniqueFilename); // 一時保存ディレクトリに保存するファイルのパス
        const outputFileName = path.basename(outputFilePath);  // 一時保存ディレクトリに保存するファイルの名前

        console.log(fileExt, file.type, file.path, outputFilePath);
        
        // ファイルの種類に応じて、変換処理を実行
        if (['doc', 'docx'].includes(fileExt || '')) {
          console.log(outputFilePath);
          // convertedFilePath = await window.electron.invoke('convert-word-to-pdf', file.path, outputFilePath);
          await window.electron.invoke('convert-word-to-pdf', file.path, outputFilePath);
          // console.log(convertedFilePath);
        } else if (['xls', 'xlsx'].includes(fileExt || '')) {
          // convertedFilePath = await window.electron.invoke('convert-excel-to-pdf', file.path, outputFilePath);
          await window.electron.invoke('convert-excel-to-pdf', file.path, outputFilePath);
        } else if (['ppt', 'pptx'].includes(fileExt || '')) {
          // convertedFilePath = await window.electron.invoke('convert-ppt-to-pdf', file.path, outputFilePath);
          await window.electron.invoke('convert-ppt-to-pdf', file.path, outputFilePath);
        } else if (file.type === 'application/pdf') {
          // PDFファイルの場合、そのまま一時保存ディレクトリに保存
          await window.electron.invoke('save-to-temp', new Uint8Array(fileBuffer), outputFilePath);
        }

        // 処理済みPDFからページ数を取得
        const pageCount = await window.electron.invoke('get-pdf-page-count', outputFilePath);
        console.log(pageCount);
        if (pageCount % 2 !== 0) {
          console.log("ページ数が奇数です。");
          setOddPageFiles(prevFiles => [...prevFiles, outputFileName]); 
        }

      } else {
        alert(`${file.name} is not a supported file type.`);
      }
      
    }
    // ステートを更新して、フロントエンドにアップロードされたファイルの情報を表示
    fetchFiles();
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
            <li key={file}>
              {file}
              {oddPageFiles.includes(file) && (
                <div>
                  <input type="checkbox" id={`insert-blank-${file}`} />
                  <label htmlFor={`insert-blank-${file}`}>白紙を差し込む</label>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
