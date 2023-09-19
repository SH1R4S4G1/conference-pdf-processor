  // index.tsx
  // 処理の際には、フルパスを使用する。必要に応じて「path.basename()」を使用してファイル名のみを取得する。

  import React, { useState, useEffect } from 'react';
  import { FaRegTrashAlt, FaFileUpload } from 'react-icons/fa';
  import FileRowWithControls from './../components/FileRowWithControls';
  import CharacterComponent from './../components/CharacterComponent';
  import { AppStatus } from './../types/types';
  import axios from 'axios';
  import { ipcRenderer } from 'electron';
  import * as os from 'os';
  import * as path from 'path';

  type Pattern = {
    id: number;
    addPageNumbers: boolean;
    createContentList: boolean;
    addBlankPageForContentList: boolean;
    oddPageFiles: string[];
    selectedFiles: string[];
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    size?: number;
    alignOrientation: boolean; // 資料の向きを合わせるためのフラグ
  };

  type UploadedFile = {
    originalName: string;
    tempPath: string;
    pageCount: number;
  };

  export default function Home() {
    // 生のファイル一覧
    const [fileList, setFileList] = useState<string[]>([]);

    // ページ数が奇数のPDFファイルの一覧
    const [oddPageFiles, setOddPageFiles] = useState<string[]>([]);

    // 処理のパターンの一覧
    const [patterns, setPatterns] = useState<Pattern[]>([]);

    // アップロードされた一時保存ディレクトリとオリジナルファイルの名前の対応の保持
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);  

    // スクロールヒントの表示
    const [isScrollable, setIsScrollable] = useState(false);
    const [scrollIndicatorOpacity, setScrollIndicatorOpacity] = useState(1);

    // アプリケーションの状態
    const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);

    // DEV:ファイルリストの変更を監視
    useEffect(() => {
      console.log('fileList has changed:', fileList);
    }, [fileList]);
    
    // DEV:ページ数が奇数のファイルの変更を監視
    useEffect(() => {
      console.log('oddPageFiles has changed:', oddPageFiles);
    }, [oddPageFiles]);  

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

    useEffect(() => {
      console.log("Status has changed:", status);

      if (status === AppStatus.COMPLETED || status === AppStatus.ERROR) {
        const timer = setTimeout(() => {
          setStatus(AppStatus.IDLE);
        }, 5000);  // 5秒後にIDLEに戻す
    
        // useEffectのクリーンアップ関数。コンポーネントがアンマウントされる時や、次のuseEffectが実行される前に実行される
        return () => {
          clearTimeout(timer);
        };
      }
    }, [status]);  // statusが変更されるたびにこのuseEffectが再評価される    

    // ドラッグ＆ドロップでファイルを投入したときの処理
    const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setStatus(AppStatus.PROCESSING);
    
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

          // 処理済みPDFからページ数を取得
          const pageCount = await window.electron.invoke('get-pdf-page-count', outputFilePath);
          console.log(pageCount);
          if (pageCount % 2 !== 0) {
            console.log("ページ数が奇数です。");
            console.log("oddPageFiles更新前");
            setOddPageFiles(prevFiles => [...prevFiles, outputFilePath]);
            console.log("oddPageFiles更新後");
          }

          // オリジナルのファイル名、ページ数を保存
          setUploadedFiles(prev => [...prev, { originalName: file.name, tempPath: outputFilePath, pageCount: pageCount}]);
          setPatterns(prev => prev.map(p => ({ ...p, selectedFiles: [...p.selectedFiles, outputFilePath] })));

          setStatus(AppStatus.COMPLETED);
        } else {
          setStatus(AppStatus.ERROR);
          alert(`${file.name} is not a supported file type.`);
        }
        
      }
    };

    // ファイルを統合する
    const handleCombinePDFsForAllPatterns = async () => {
      try {    
        setStatus(AppStatus.PROCESSING);
        let contentListPdfPath;  // 資料一覧のPDFファイルのパス

        for (const pattern of patterns) {
          // ここでselectedFilesの内容を参照して処理対象のファイルを絞り込む
          const filesToProcess = uploadedFiles.filter(file => pattern.selectedFiles.includes(file.tempPath));

          let currentPage = 1;  // 現在のページ番号を追跡するための変数
          const filesWithStartPages = filesToProcess.map(file => {
            const startPage = currentPage;
            currentPage += file.pageCount;  // 次のファイルの開始ページを計算
    
            if (patterns.some(pattern => pattern.oddPageFiles.includes(file.tempPath) && pattern.selectedFiles.includes(file.tempPath))) {
                currentPage++;  // 白紙差し込みが適用される場合、ページ数を+1する
            }
    
            return { ...file, startPage };
          });

          // 資料一覧のPDFファイルを作成
          if (pattern.createContentList) {
            const contentListData = filesWithStartPages.map(file => ({
                name: file.originalName,
                pageCount: file.pageCount,
                startPage: file.startPage  // 開始ページの情報を追加
            }));

            contentListPdfPath = await window.electron.invoke('create-content-list', contentListData);
            const pageCount = await window.electron.invoke('get-pdf-page-count', contentListPdfPath);
            if (pattern.addBlankPageForContentList && pageCount % 2 !== 0) {
                const newContentListPdfPath = await window.electron.invoke('add-blank-page', contentListPdfPath);
                contentListPdfPath = newContentListPdfPath;
            }
          }

          // 処理対象のファイルの白紙差込み
          const combinedFiles = await insertBlankForPattern(pattern, filesToProcess);

          // 白紙差し込み実行後のファイルを結合
          const tempFilePath = await window.electron.invoke('combine-pdfs', {
            files: combinedFiles,
            addPageNumbers: pattern.addPageNumbers,
            alignOrientation: pattern.alignOrientation,
            position: pattern.position,
            size: pattern.size
          });

          // 統合PDFと資料一覧のPDFを結合
          if (pattern.createContentList && contentListPdfPath) {
            const finalPdfPath = await window.electron.invoke('combine-pdfs', {
                files: [contentListPdfPath, tempFilePath],
                addPageNumbers: false
            });
            await window.electron.invoke('open-file', finalPdfPath);  // 合成したPDFを開く
          } else {
            await window.electron.invoke('open-file', tempFilePath);  // 合成したPDFを開く
          }
        }
        setStatus(AppStatus.COMPLETED);
      } catch (error) {
        console.error("Error combining PDFs:", error);
        setStatus(AppStatus.ERROR);
      }
    };
    
    // 白紙差し込みを実行する
    const insertBlankForPattern = async (pattern: Pattern, filesToProcess: Array<UploadedFile>) => {
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
        createContentList: false,
        addBlankPageForContentList: false,  
        oddPageFiles: [],
        selectedFiles: uploadedFiles.map(file => file.tempPath),  // すべてのファイルをデフォルトで選択する
        position: 'bottom-right',
        size: 16,
        alignOrientation: false
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
    
    // TODO: 微妙に右側にはみ出している？
    // TODO: ページ数を付与しないを選んだら同時にファイル一覧作成及びファイル一覧への白紙差し込みを選択解除する
    // TODO: ファイル一覧作成を解除したらファイル一覧への白紙差し込みを選択解除する
    // TODO: パターン名を変更できるようにする。パターン名の重複を避ける
    // TODO: パターンの順番を変更できるようにする
    // TODO: テーブルが表示されていない間だけ、見かけのドロップエリアを広げる
    // TODO: テーブルの幅が固定長になるようにする
    // TODO: ひとつもファイルが選択されていないパターンは処理の対象外にする
    return (
      <div 
      className="p-5 h-screen w-screen"
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
            <table className="table-fixed border rounded-lg ">
              <thead>
                <tr className="text-left">
                  <th className="w-[250px] px-4 py-2 border">ファイル名</th>
                  {patterns.map((pattern, index) => (
                    <th key={pattern.id} className={`w-[200px] px-4 py-2 border ${index % 2 === 0 ? 'bg-gray-200' : 'bg-gray-300'}`}>
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

                    <input 
                        type="checkbox" 
                        id="alignOrientation" 
                        name="alignOrientation"
                        checked={pattern.alignOrientation}
                        onChange={e => {
                          const updatedPatterns = patterns.map(p => {
                            if (p.id === pattern.id) {
                              return { ...p, alignOrientation: e.target.checked };
                            }
                            return p;
                          });
                          setPatterns(updatedPatterns);
                        }}
                    />
                    <label htmlFor="alignOrientation">資料の向きを合わせる</label>


                    {pattern.addPageNumbers && (
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pattern.createContentList}
                          onChange={e => {
                            const updatedPatterns = patterns.map(p => {
                              if (p.id === pattern.id) {
                                return { ...p, createContentList: e.target.checked };
                              }
                              return p;
                            });
                            setPatterns(updatedPatterns);
                          }}
                        />
                        <span>ファイル一覧を作成</span>
                      </label>
                    )}

                    {pattern.addPageNumbers && pattern.createContentList && (
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pattern.addBlankPageForContentList}
                          onChange={e => {
                            const updatedPatterns = patterns.map(p => {
                              if (p.id === pattern.id) {
                                return { ...p, addBlankPageForContentList: e.target.checked };
                              }
                              return p;
                            });
                            setPatterns(updatedPatterns);
                          }}
                        />
                        <span>ファイル一覧が奇数の場合白紙を差込む</span>
                      </label>
                    )}

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
                    <td className="w-[250px] px-4 py-2 border flex items-center">
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
                    <td key={pattern.id} className={`w-[200px] px-4 py-2 border ${index % 2 === 0 ? 'bg-gray-200' : 'bg-gray-300'}`}>
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
          <button 
              disabled={status === AppStatus.PROCESSING} 
              className={`mt-5 p-2 rounded-lg ml-4 
                          ${status !== AppStatus.PROCESSING 
                              ? "bg-green-500 text-white hover:bg-green-600" 
                              : "bg-gray-500 text-gray-300 cursor-not-allowed opacity-70"
                          }`} 
              onClick={handleCombinePDFsForAllPatterns}>
              ファイルを統合する
          </button>
          )}


        <div className="fixed bottom-2.5 right-2.5">
          <CharacterComponent status={status} />
        </div>
  
      </div>

    );
  }
