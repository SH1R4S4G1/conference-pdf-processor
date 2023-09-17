// index.tsx
// 処理の際には、フルパスを使用する。必要に応じて「path.basename()」を使用してファイル名のみを取得する。

import React, { useState, useEffect } from 'react';
import { FaRegTrashAlt, FaFileUpload } from 'react-icons/fa';
import FileRowWithControls from '../components/FileRowWithControls';
import axios from 'axios';
import { ipcRenderer } from 'electron';
import * as os from 'os';
import * as path from 'path';

type Pattern = {
  id: number;
  addPageNumbers: boolean;
  oddPageFiles: string[];
  selectedFiles: string[];
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  size?: number;
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

  // スクロールヒントの表示
  const [isScrollable, setIsScrollable] = useState(false);
  const [scrollIndicatorOpacity, setScrollIndicatorOpacity] = useState(1);

  // ページ番号の設定
  const [pageNumberPosition, setPageNumberPosition] = useState('bottom-right');
  const [pageNumberSize, setPageNumberSize] = useState(16);
  
  // DEV:ファイルリストの変更を監視
  useEffect(() => {
    console.log('fileList has changed:', fileList);
  }, [fileList]);
  
  // DEV:ページ数が奇数のファイルの変更を監視
  useEffect(() => {
    console.log('oddPageFiles has changed:', oddPageFiles);
  }, [oddPageFiles]);  

  // const fetchFiles = async () => {
  //   // 一時保存ディレクトリからファイルの一覧を取得。全てのファイルを取得するので使用機会はない。
  //   const files = await window.electron.invoke('get-temp-files');
  //   setFileList(files);
  // };

  useEffect(() => {
    // fetchFiles();
  }, []); // 依存配列が空なので、このuseEffectはマウント時にのみ実行されます。

  useEffect(() => {
    if (fileList.length > 0 && patterns.length === 0) {
      addPattern();  // 処理前のファイルリストが表示されたとき、最初のパターンを自動で作成する
    }
  }, [fileList]);
 
  // ユーザーがUI上で行ったファイルリスト(uploadedFiles)の更新を、各種ステートに反映する
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

  // テーブルの横幅に応じて、スクロールヒントを表示するかどうかを判定
  useEffect(() => {
    const tableWrapper = document.getElementById('tableWrapper');
    if (tableWrapper) {
      const scrollable = tableWrapper.scrollWidth > tableWrapper.clientWidth;
      setIsScrollable(scrollable);
      console.log("Is the table scrollable?", scrollable);
    }
  }, [uploadedFiles, patterns]);

  // スクロールヒントを表示するかどうかの判定に応じて、ヒントを表示する
  useEffect(() => {
    if (isScrollable) {
      setScrollIndicatorOpacity(1); // ヒントを表示
      setTimeout(() => {
        setScrollIndicatorOpacity(0); // 0.5秒後にヒントを非表示
      }, 500);
    }
  }, [isScrollable]);

  // ドラッグ＆ドロップでファイルを投入したときの処理
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
        setPatterns(prev => prev.map(p => ({ ...p, selectedFiles: [...p.selectedFiles, outputFilePath] })));

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
  };

  const handleCombinePDFsForAllPatterns = async () => {
    try {    
      for (const pattern of patterns) {
      // ここでselectedFilesの内容を参照して処理対象のファイルを絞り込む
      const filesToProcess = uploadedFiles.filter(file => pattern.selectedFiles.includes(file.tempPath));
      // const combinedFiles = await handleCombinePDFs(pattern, filesToProcess);
      const combinedFiles = await combineFilesForPattern(pattern, filesToProcess);
      
        const tempFilePath = await window.electron.invoke('combine-pdfs', {
          files: combinedFiles,
          addPageNumbers: pattern.addPageNumbers,
          position: pattern.position,
          size: pattern.size
        });
        await window.electron.invoke('open-file', tempFilePath); // 合成したPDFを開く
      }
    } catch (error) {
      console.error("Error combining PDFs:", error);
    }
  };
  
  const combineFilesForPattern = async (pattern: Pattern, filesToProcess: Array<UploadedFile>) => {
    let combinedFiles: string[] = [];
  
    for (const file of filesToProcess) {
      const filePathToProcess = file.tempPath;
      if (pattern.oddPageFiles.includes(filePathToProcess)) {
        const newFilePath = await window.electron.invoke('add-blank-page', filePathToProcess);
        combinedFiles.push(newFilePath);  // 白紙を追加した新しいファイルを結合リストに追加
      } else {
        combinedFiles.push(filePathToProcess);  // 通常のファイルを結合リストに追加
      }
    }
    return combinedFiles;
  };
    
  const addPattern = () => {
    const newPattern: Pattern = {
      id: patterns.length + 1,
      addPageNumbers: false,
      oddPageFiles: [],
      selectedFiles: uploadedFiles.map(file => file.tempPath),  // すべてのファイルをデフォルトで選択する
      position: 'bottom-right',
      size: 16
    };
    setPatterns((prevPatterns) => [...prevPatterns, newPattern]);
  };

  const removePattern = (patternId: number) => {
    setPatterns((prevPatterns) => {
      return prevPatterns.filter((pattern) => pattern.id !== patternId);
    });
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
    <div 
    className="p-10 h-screen w-screen"
    onDrop={onDrop}
    onDragOver={(e) => e.preventDefault()}
    >  
      <div 
        className="border-dashed border-2 h-60 flex justify-center items-center transition-colors hover:bg-gray-100 cursor-pointer" 
      >
        <FaFileUpload size={30} color="gray" className="px-2 py-1 hover:bg-black-100 rounded"/>
        PDFをドロップ
      </div>

      {uploadedFiles.length > 0 && (
        <div id="tableWrapper" className="mt-10 relative overflow-x-auto">
          <table className="w-full border rounded-lg ">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-2 w-1/3 border">ファイル名</th>
                {patterns.map((pattern, index) => (
                  <th key={pattern.id} className={`px-4 py-2 border ${index % 2 === 0 ? 'bg-gray-200' : 'bg-gray-300'}`}>
                    パターン {pattern.id}
                    {patterns.length > 1 && (
                      <FaRegTrashAlt size={30} color="red" className="px-2 py-1 hover:bg-red-100 rounded" onClick={() => removePattern(pattern.id)} />
                    )}
                    <br />
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="cursor-pointer peer sr-only"
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
                      <span
                        className="block w-[2em] cursor-pointer bg-gray-500 rounded-full 
                        p-[1px] after:block after:h-[1em] after:w-[1em] after:rounded-full 
                        after:bg-white after:transition peer-checked:bg-blue-500 
                        peer-checked:after:translate-x-[calc(100%-2px)]"
                      >
                      </span>
                      <span>ページ数を付与</span>
                    </label>
                    {/* 位置の選択ドロップダウン */}
                    <select
                      value={pattern.position}
                      onChange={e => {
                        const updatedPatterns = patterns.map(p => {
                          if (p.id === pattern.id) {
                            return { ...p, position: e.target.value as 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' };
                          }
                          return p;
                        });
                        setPatterns(updatedPatterns);
                      }}
                    >
                      <option value="top-left">左上</option>
                      <option value="top-center">中央上</option>
                      <option value="top-right">右上</option>
                      <option value="bottom-left">左下</option>
                      <option value="bottom-center">中央下</option>
                      <option value="bottom-right">右下</option>
                    </select>

                    {/* サイズの選択ドロップダウン */}
                    <select
                      value={pattern.size}
                      onChange={e => {
                        const updatedPatterns = patterns.map(p => {
                          if (p.id === pattern.id) {
                            return { ...p, size: parseInt(e.target.value) };
                          }
                          return p;
                        });
                        setPatterns(updatedPatterns);
                      }}
                    >
                      {Array.from({ length: 57 }, (_, i) => i + 8).map(size => (
                        <option key={size} value={size}>{size}px</option>
                      ))}
                    </select>
                  </th>
                ))}

              </tr>
            </thead>
            <tbody>
              {uploadedFiles.map((file, index) => (
                <tr key={file.tempPath}>
                  <td className="px-4 py-2 border flex items-center">
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
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="cursor-pointer mr-2"
                        checked={pattern.selectedFiles?.includes(file.tempPath)}
                        onChange={e => {
                          const updatedPatterns = patterns.map(p => {
                            if (p.id === pattern.id) {
                              if (e.target.checked) {
                                return { ...p, selectedFiles: p.selectedFiles ? [...p.selectedFiles, file.tempPath] : [file.tempPath] };
                              } else {
                                return { ...p, selectedFiles: p.selectedFiles?.filter(f => f !== file.tempPath) };
                              }
                            }
                            return p;
                          });
                          setPatterns(updatedPatterns);
                        }}
                      />
                      <span>統合PDFに追加</span>
                    </label>
                    <div className="border-t mt-2 mb-2"></div>
                    {oddPageFiles.includes(file.tempPath) && (
                      <label className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          className="cursor-pointer mr-2 peer sr-only"
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
                        <span
                          className="block w-[2em] cursor-pointer bg-gray-500 rounded-full 
                          p-[1px] after:block after:h-[1em] after:w-[1em] after:rounded-full 
                          after:bg-white after:transition peer-checked:bg-blue-500 
                          peer-checked:after:translate-x-[calc(100%-2px)]"
                        >
                        </span>
                        <span className="ml-2">白紙差込み</span>
                      </label>
                    )}
                  </td>
                ))}

                </tr>
              ))}
            </tbody>
          </table>
    
          {isScrollable && (
            <div
            className={`absolute inset-x-0 top-0 h-full bg-white bg-opacity-60 flex justify-center items-center transition-opacity duration-500 ${scrollIndicatorOpacity === 0 ? 'hidden' : 'block'}`}
            style={{ opacity: scrollIndicatorOpacity }}
            >
            <p className="text-lg font-bold">横スクロール可能</p>
            </div>
          )}

        </div>
      )}

        {uploadedFiles.length > 0 && (
          <button className="mt-5 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onClick={addPattern}>＋</button>
        )}
  
        {uploadedFiles.length > 0 && patterns.length > 0 && (
          <button className="mt-5 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 ml-4" onClick={handleCombinePDFsForAllPatterns}>ファイルを統合する</button>
        )}
    </div>
  );
}
