// index.tsx
// 処理の際には、フルパスを使用する。必要に応じて「path.basename()」を使用してファイル名のみを取得する。

import React, { useState, useEffect } from 'react';
import FileRowWithControls from '../components/FileRowWithControls';
import axios from 'axios';
import { ipcRenderer } from 'electron';
import * as os from 'os';
import * as path from 'path';

type Pattern = {
  id: number;
  addPageNumbers: boolean;
  oddPageFiles: string[];
};

type UploadedFile = {
  originalName: string;
  tempPath: string;
};

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

  // 処理を実行するためのファイルの一覧（FileListのコピー）
  const [targetFileList, setTargetFileList] = useState<Array<{ id: number, path: string }>>([]);

  // 処理のパターンの一覧
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  // アップロードされた一時保存ディレクトリとオリジナルファイルの名前の対応の保持
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);  

  useEffect(() => {
    console.log('fileList has changed:', fileList);
  }, [fileList]);
  
  useEffect(() => {
    console.log('oddPageFiles has changed:', oddPageFiles);
  }, [oddPageFiles]);  

  const fetchFiles = async () => {
    // 一時保存ディレクトリからファイルの一覧を取得。全てのファイルを取得するので使用機会はない。
    const files = await window.electron.invoke('get-temp-files');
    setFileList(files);
  };

  useEffect(() => {
    // fetchFiles();
  }, []); // 依存配列が空なので、このuseEffectはマウント時にのみ実行されます。

  useEffect(() => {
    if (fileList.length > 0 && patterns.length === 0) {
      addPattern();  // 処理前のファイルリストが表示されたとき、最初のパターンを自動で作成する
    }
  }, [fileList]);
 
  useEffect(() => {
    const newFileList = uploadedFiles.map(f => f.tempPath);
    setFileList(newFileList);
    
    const newOddPageFiles = newFileList.filter(file => oddPageFiles.includes(file));
    setOddPageFiles(newOddPageFiles);
  
    const newPatterns = patterns.map(pattern => {
      return {
        ...pattern,
        oddPageFiles: pattern.oddPageFiles.filter(file => newFileList.includes(file))
      };
    });
    setPatterns(newPatterns);

    console.log('uploadedFiles has changed:',"uploadedFiles :", uploadedFiles,"newFileList :", newFileList, "newOddPageFiles :", newOddPageFiles,"newPatterns :", newPatterns);

  }, [uploadedFiles]);  

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  
    // ドロップされたファイルを取得
    const files = event.dataTransfer.files;
    console.log("投入されたファイル", files);
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
  
      if (file.type === 'application/pdf' || ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt || '')) {
        // ファイルがWord, Excel, PowerPointの場合、変換後のPDFを取得
        const fileBuffer = await file.arrayBuffer();

        // Electronメインプロセスから一時保存ディレクトリのパスを取得
        // レンダラープロセス側でos.tmpdir()を呼び出すと、適切な一時保存ディレクトリが取得できない。
        const tempDir = await window.electron.invoke('get-os-tmpdir');
        console.log("Temp Directory:", tempDir);

        const uniqueFilename = Date.now() + ".pdf"; // 一時保存ディレクトリに保存するファイルの名前
        const outputFilePath = path.join(tempDir, uniqueFilename).replace(/\//g, '\\'); // 一時保存ディレクトリに保存するファイルのパス

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

        // オリジナルのファイル名を保存
        setUploadedFiles(prev => [...prev, { originalName: file.name, tempPath: outputFilePath }]);

        // 処理済みPDFからページ数を取得
        const pageCount = await window.electron.invoke('get-pdf-page-count', outputFilePath);
        console.log(pageCount);
        if (pageCount % 2 !== 0) {
          console.log("ページ数が奇数です。");
          console.log("oddPageFiles更新前");
          setOddPageFiles(prevFiles => [...prevFiles, outputFilePath]);
          console.log("oddPageFiles更新後");
        }
      } else {
        alert(`${file.name} is not a supported file type.`);
      }
      
    }
    // console.log("fetchFiles()前");
    // // ステートを更新して、フロントエンドにアップロードされたファイルの情報を表示
    // fetchFiles();
    // console.log("fetchFiles()後");
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
    // fetchFiles();
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

  const handleCombinePDFsForAllPatterns = async () => {
    for (const pattern of patterns) {
      const combinedFiles = await combineFilesForPattern(pattern);
      const tempFilePath = await window.electron.invoke('combine-pdfs', {
        files: combinedFiles,
        addPageNumbers: pattern.addPageNumbers
      });
      await window.electron.invoke('open-file', tempFilePath); // 合成したPDFを開く
    }
  };
  
  const combineFilesForPattern = async (pattern: Pattern) => {
    let combinedFiles: string[] = [];
  
    for (const file of fileList) {
      if (pattern.oddPageFiles.includes(file)) {
        const newFilePath = await window.electron.invoke('add-blank-page', file);
        combinedFiles.push(newFilePath);  // 白紙を追加した新しいファイルを結合リストに追加
      } else {
        combinedFiles.push(file);  // 通常のファイルを結合リストに追加
      }
    }
    return combinedFiles;
  };
  
    
  const addPattern = () => {
    const newPattern: Pattern = {
      id: Date.now(),
      addPageNumbers: false,
      oddPageFiles: [],
    };
    setPatterns((prevPatterns) => [...prevPatterns, newPattern]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles.splice(index, 1);
        return newFiles;
    });
    console.log('uploadedFiles has removed:', uploadedFiles);
};

  
  const handleMoveFileUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...uploadedFiles];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index - 1];
    newFiles[index - 1] = temp;
    setUploadedFiles(newFiles);
  };
  
  const handleMoveFileDown = (index: number) => {
    if (index === uploadedFiles.length - 1) return;
    const newFiles = [...uploadedFiles];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + 1];
    newFiles[index + 1] = temp;
    setUploadedFiles(newFiles);
  };
  

  return (
    <div className="p-10">
      <div 
        className="border-dashed border-2 h-60 flex justify-center items-center transition-colors hover:bg-gray-100 cursor-pointer" 
        onDrop={onDrop} 
        onDragOver={(e) => e.preventDefault()}
      >
        PDFをここにドロップ
      </div>
  
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-5">処理前のファイルリスト</h2>
        <table className="w-full border rounded-lg">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-2 w-1/3 border">ファイル名</th>
              {patterns.map((pattern, index) => (
                <th key={pattern.id} className={`px-4 py-2 border ${index % 2 === 0 ? 'bg-gray-200' : 'bg-gray-300'}`}>
                  パターン {pattern.id}
                  <br />
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={pattern.addPageNumbers}
                      onChange={e => {
                        const updatedPatterns = patterns.map(p => {
                          if (p.id === pattern.id) {
                            return { ...p, addPageNumbers: e.target.checked };
                          }
                          return p;
                        });
                        setPatterns(updatedPatterns);
                      }}
                    />
                    <span>ページ数を付与</span>
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uploadedFiles.map((file, index) => (
              <tr key={file.tempPath}>
                <td className="px-4 py-2 border flex items-center">
                  {file.originalName}
                  <FileRowWithControls
                    fileName={file.originalName}
                    isFirst={index === 0}
                    isLast={index === uploadedFiles.length - 1}
                    onMoveUp={() => handleMoveFileUp(index)}
                    onMoveDown={() => handleMoveFileDown(index)}
                    onRemove={() => handleRemoveFile(index)}
                  />
                </td>
                {patterns.map((pattern, index) => (
                  <td key={pattern.id} className={`px-4 py-2 border ${index % 2 === 0 ? 'bg-gray-200' : 'bg-gray-300'}`}>
                    {oddPageFiles.includes(file.tempPath) && (
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={pattern.oddPageFiles.includes(file.tempPath)}
                        onChange={e => {
                          const updatedPatterns = patterns.map(p => {
                            if (p.id === pattern.id) {
                              if (e.target.checked) {
                                return { ...p, oddPageFiles: [...p.oddPageFiles, file.tempPath] };
                              } else {
                                return { ...p, oddPageFiles: p.oddPageFiles.filter(f => f !== file.tempPath) };
                              }
                            }
                            return p;
                          });
                          setPatterns(updatedPatterns);
                        }}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
  
        {uploadedFiles.length > 0 && (
          <button className="mt-5 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onClick={addPattern}>＋</button>
        )}
  
        {uploadedFiles.length > 0 && patterns.length > 0 && (
          <button className="mt-5 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 ml-4" onClick={handleCombinePDFsForAllPatterns}>ファイルを統合する</button>
        )}
      </div>
    </div>
  );
}
