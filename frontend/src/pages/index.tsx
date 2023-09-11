// index.tsx
// 処理の際には、フルパスを使用する。必要に応じて「path.basename()」を使用してファイル名のみを取得する。

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

  // ページ数を付与するかどうかのフラグ
  const [addPageNumbers, setAddPageNumbers] = useState(false);

  // 白紙を差し込むファイルの一覧
  const [filesToInsertBlank, setFilesToInsertBlank] = useState<string[]>([]);

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

        // Electronメインプロセスから一時保存ディレクトリのパスを取得
        // レンダラープロセス側でos.tmpdir()を呼び出すと、適切な一時保存ディレクトリが取得できない。
        const tempDir = await window.electron.invoke('get-os-tmpdir');
        console.log("Temp Directory:", tempDir);

        const uniqueFilename = Date.now() + ".pdf"; // 一時保存ディレクトリに保存するファイルの名前
        const outputFilePath = path.join(tempDir, uniqueFilename).replace(/\//g, '\\'); // 一時保存ディレクトリに保存するファイルのパス
        const outputFileName = path.basename(outputFilePath);  // 一時保存ディレクトリに保存するファイルの名前

        console.log(fileExt, file.type, file.path, outputFilePath);
        
        // ファイルの種類に応じて、変換処理を実行
        if (['doc', 'docx'].includes(fileExt || '')) {
          console.log(outputFilePath);
          await window.electron.invoke('convert-word-to-pdf', file.path, outputFilePath);
        } else if (['xls', 'xlsx'].includes(fileExt || '')) {
          await window.electron.invoke('convert-excel-to-pdf', file.path, outputFilePath);
        } else if (['ppt', 'pptx'].includes(fileExt || '')) {
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
          setOddPageFiles(prevFiles => [...prevFiles, outputFilePath]);
        }

      } else {
        alert(`${file.name} is not a supported file type.`);
      }
      
    }
    // ステートを更新して、フロントエンドにアップロードされたファイルの情報を表示
    fetchFiles();
  };

  // ページ数が奇数のPDFファイルに白紙を差し込む
  const handleAddBlankPages = async () => {
    for (const filePath of filesToInsertBlank) {
      try {
        const newFilePath = await window.electron.invoke('add-blank-page', filePath);
        setFileList(prevFiles => [...prevFiles, newFilePath]);
      } catch (error) {
        console.error(`Error adding blank page to ${filePath}:`, error);
      }
    }
    console.log('白紙差し込み完了');
    // ファイルリストを更新
    fetchFiles();
  };
  
  
  const handleCombinePDFs = async () => {
    console.log(fileList);  // ここで fileList の内容を確認
    try {    
      const tempFilePath = await window.electron.invoke('combine-pdfs', {
        files: fileList,
        addPageNumbers: addPageNumbers
      });

      await window.electron.invoke('open-file', tempFilePath);
    } catch (error) {
      console.error("Error combining PDFs:", error);
    }
  };

  const handleInsertBlankCheckboxChange = (filePath: string, isChecked: boolean) => {
    if (isChecked) {
      setFilesToInsertBlank(prev => [...prev, filePath]);
    } else {
      setFilesToInsertBlank(prev => prev.filter(f => f !== filePath));
    }
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
          {fileList.map(file => {
            console.log("Checking file:", file, oddPageFiles.includes(file));  // このログを追加
            return (
              <li key={file}>
                {file}
                {oddPageFiles.includes(file) && (
                  <div>
                      <input
                        type="checkbox"
                        id={`insert-blank-${path.basename(file)}`}
                        onChange={(e) => handleInsertBlankCheckboxChange(file, e.target.checked)}
                      />
                      <label htmlFor={`insert-blank-${path.basename(file)}`}>白紙を差し込む</label>
                      <button onClick={handleAddBlankPages}>白紙差し込みを実行</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <label>
            <input
              type="checkbox"
              checked={addPageNumbers}
              onChange={e => setAddPageNumbers(e.target.checked)}
            />
            ページ数を付与する
          </label>
        </div>

        <div className="mt-4">
          <button onClick={handleCombinePDFs}>ファイルを統合する</button>
        </div>

      </div>
     </div>
  );
}

