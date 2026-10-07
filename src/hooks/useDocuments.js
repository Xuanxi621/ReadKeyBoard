import { useState, useEffect, useRef, useCallback } from 'react';
import {
  saveDocToIndexedDB,
  getAllDocsFromIndexedDB,
  removeDocFromIndexedDB
} from '../services/db.js';
import { loadPdfDocument, generateCoverThumbnail } from '../services/pdfLoader.js';

export function useDocuments({ showToast, setView, viewRef }) {
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  const documentsRef = useRef(documents);
  const currentDocRef = useRef(currentDoc);
  const selectedDocIndexRef = useRef(selectedDocIndex);

  useEffect(() => { documentsRef.current = documents; }, [documents]);
  useEffect(() => { currentDocRef.current = currentDoc; }, [currentDoc]);
  useEffect(() => { selectedDocIndexRef.current = selectedDocIndex; }, [selectedDocIndex]);

  // Restore persisted documents from IndexedDB on startup
  useEffect(() => {
    async function restoreDocs() {
      try {
        const savedDocs = await getAllDocsFromIndexedDB();
        const loadedDocs = [];

        for (const saved of savedDocs) {
          try {
            const pdf = await loadPdfDocument(saved.fileBuffer);
            const docRecord = {
              id: saved.id,
              fileName: saved.fileName,
              fileSize: saved.fileSize,
              fileSizeBytes: saved.fileSizeBytes,
              pages: saved.pages,
              fileBuffer: saved.fileBuffer,
              coverThumbnail: saved.coverThumbnail,
              cardProps: saved.cardProps,
              uploadedAt: saved.uploadedAt,
              pdfJsInstance: pdf,
              oneLiner: `已成功加载并持久化本地文档《${saved.fileName}》（共 ${saved.pages} 页）。`,
              keyTakeaways: [
                { tag: '本地持久化', text: `文件《${saved.fileName}》已永久保存在浏览器本地数据库中，刷新页面不丢失。` },
                { tag: '深度研读', text: '点击卡片即可在左右分屏开展多轮 AI 研读与笔记。' }
              ],
              outline: [],
              mindmap: [
                {
                  title: saved.fileName.replace('.pdf', ''),
                  children: ['文档概览', '核心章节', '实验结论', '参考文献']
                }
              ]
            };

            for (let p = 1; p <= Math.min(saved.pages, 10); p++) {
              docRecord.outline.push({ page: p, title: `第 ${p} 页 · 正文内容` });
            }

            loadedDocs.push(docRecord);
          } catch (err) {
            console.warn('Failed to restore saved PDF:', saved.fileName, err);
          }
        }

        setDocuments(loadedDocs);
        if (loadedDocs.length > 0) {
          showToast(`已从本地数据库载入 ${loadedDocs.length} 份 PDF 文档`);
        }
      } catch (err) {
        console.warn('Failed to read IndexedDB', err);
      }
    }

    restoreDocs();
  }, [showToast]);

  // Open Document in Workspace (进入阅读模式)
  const handleOpenDoc = useCallback((doc) => {
    if (!doc) return;
    setCurrentDoc(doc);
    setCurrentPage(1);
    setView('workspace');
    showToast(`已开启精读：《${doc.fileName}》`);
  }, [setView, showToast]);

  // Upload and Parse PDF Files
  const handleUploadFiles = useCallback(async (files) => {
    for (const file of files) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        showToast('请上传标准的 PDF 格式文件');
        continue;
      }

      const isDuplicate = documentsRef.current.some(
        d => d.fileName === file.name && d.fileSizeBytes === file.size
      );

      if (isDuplicate) {
        showToast(`⚠️ 该文件《${file.name}》已存在于星轨中，请勿重复上传！`, 3500);
        continue;
      }

      showToast(`正在解析并保存《${file.name}》至本地...`);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        try {
          const pdf = await loadPdfDocument(arrayBuffer);
          const coverThumbnail = await generateCoverThumbnail(pdf);

          const baseW = 120 + (Math.random() * 16 - 8);
          const baseH = baseW * 1.36;
          const cardProps = {
            w: Math.round(baseW),
            h: Math.round(baseH),
            baseTilt: Math.random() * 40 - 20,
            radiusX: 430 + (Math.random() * 40 - 20),
            radiusY: 260 + (Math.random() * 30 - 15),
            orbitOffset: Math.random() * Math.PI * 2
          };

          const docRecord = {
            id: 'doc-' + Date.now(),
            fileName: file.name,
            fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
            fileSizeBytes: file.size,
            pages: pdf.numPages,
            fileBuffer: arrayBuffer,
            coverThumbnail: coverThumbnail,
            cardProps: cardProps,
            uploadedAt: Date.now(),
            pdfJsInstance: pdf,
            oneLiner: `已成功加载并持久化本地文档《${file.name}》（共 ${pdf.numPages} 页）。`,
            keyTakeaways: [
              { tag: '本地持久化', text: `文件《${file.name}》已永久保存在浏览器本地数据库中，刷新页面不丢失。` },
              { tag: '深度研读', text: '点击卡片即可在左右分屏开展多轮 AI 研读与笔记。' }
            ],
            outline: [],
            mindmap: [
              {
                title: file.name.replace('.pdf', ''),
                children: ['文档概览', '核心章节', '实验结论', '参考文献']
              }
            ]
          };

          for (let p = 1; p <= Math.min(pdf.numPages, 10); p++) {
            docRecord.outline.push({ page: p, title: `第 ${p} 页 · 正文内容` });
          }

          await saveDocToIndexedDB(docRecord);
          setDocuments(prev => [...prev, docRecord]);

          if (viewRef.current === 'workspace') {
            setCurrentDoc(docRecord);
            setCurrentPage(1);
          }
          showToast(`✨ 《${file.name}》已永久存入本地星轨，刷新不丢失！`);
        } catch (err) {
          console.error('PDF parse failed', err);
          showToast(`PDF 解析失败: ${err.message || '格式不支持或文件损坏'}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [showToast, viewRef]);

  // Delete Document
  const handleDeleteDoc = useCallback(async (docId, fileName) => {
    if (window.confirm(`确定要从本地星轨中移除《${fileName}》吗？`)) {
      await removeDocFromIndexedDB(docId);
      const remaining = documentsRef.current.filter(d => d.id !== docId);
      documentsRef.current = remaining;
      setDocuments(remaining);
      const nextIndex = Math.min(selectedDocIndexRef.current, Math.max(0, remaining.length - 1));
      selectedDocIndexRef.current = nextIndex;
      setSelectedDocIndex(nextIndex);
      if (currentDocRef.current && currentDocRef.current.id === docId) {
        setView('universe');
        setCurrentDoc(null);
      }
      showToast('已从本地星轨中删除文献');
    }
  }, [setView, showToast]);

  return {
    documents,
    setDocuments,
    documentsRef,
    currentDoc,
    setCurrentDoc,
    currentDocRef,
    currentPage,
    setCurrentPage,
    selectedDocIndex,
    setSelectedDocIndex,
    selectedDocIndexRef,
    handleOpenDoc,
    handleUploadFiles,
    handleDeleteDoc
  };
}
