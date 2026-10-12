import React, { useState, useEffect, useRef, useCallback } from 'react';
import UniverseView from './components/UniverseView.jsx';
import WorkspaceView from './components/WorkspaceView.jsx';
import KeySettingsModal from './components/KeySettingsModal.jsx';
import FloatingCapsule from './components/FloatingCapsule.jsx';
import HudNotification from './components/HudNotification.jsx';
import ToastNotification from './components/ToastNotification.jsx';
import UploadModal from './components/UploadModal.jsx';
import VoiceTranscriptionOverlay from './components/VoiceTranscriptionOverlay.jsx';

import { useDocuments } from './hooks/useDocuments.js';
import { useHardwareController } from './hooks/useHardwareController.js';

export default function App() {
  // Navigation & View
  const [view, setView] = useState('universe'); // 'universe' | 'workspace'
  const [deepMode, setDeepMode] = useState(true);

  // PDF reading parameters
  const [pdfScale, setPdfScale] = useState(1.15);
  const [highlightActive, setHighlightActive] = useState(false);
  const [activeAiTab, setActiveAiTab] = useState('chat');
  const [notes, setNotes] = useState([]);

  // Modals state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTriggerKey, setUploadTriggerKey] = useState('S1');

  // Feedback Notifications
  const [hudMessage, setHudMessage] = useState('');
  const [hudVisible, setHudVisible] = useState(false);
  const [toast, setToast] = useState({ message: '', id: 0 });

  const hudTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const viewRef = useRef(view);
  const isKeyModalOpenRef = useRef(isKeyModalOpen);
  const isUploadModalOpenRef = useRef(isUploadModalOpen);

  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { isKeyModalOpenRef.current = isKeyModalOpen; }, [isKeyModalOpen]);
  useEffect(() => { isUploadModalOpenRef.current = isUploadModalOpen; }, [isUploadModalOpen]);

  // Toast Helper
  const showToast = useCallback((message, duration = 2400) => {
    setToast({ message, id: Date.now() });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast({ message: '', id: 0 });
    }, duration);
  }, []);

  // HUD Helper
  const showHud = useCallback((text) => {
    setHudMessage(text);
    setHudVisible(true);
    clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setHudVisible(false);
    }, 1400);
  }, []);

  // Hook 1: Documents State & Persistence
  const {
    documents,
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
  } = useDocuments({ showToast, setView, viewRef });

  // Hook 2: Hardware Controller (EasyInput USB HID, Web Serial & Hotkeys)
  const {
    hardwareMap,
    recordingToken,
    setRecordingToken,
    serialConnected,
    isDeviceConnected,
    serialLogs,
    activeHighlightToken,
    liveSignal,
    onHardwareTrigger,
    toggleConnectSerial,
    handleUpdateHardwareAction,
    handleResetDefaults
  } = useHardwareController({
    handleDeleteDoc,
    viewRef,
    setView,
    documentsRef,
    selectedDocIndexRef,
    setSelectedDocIndex,
    currentDocRef,
    setCurrentDoc,
    setCurrentPage,
    setPdfScale,
    setDeepMode,
    setActiveAiTab,
    setHighlightActive,
    isUploadModalOpenRef,
    setIsUploadModalOpen,
    setUploadTriggerKey,
    isKeyModalOpenRef,
    setIsKeyModalOpen,
    showToast,
    showHud
  });

  // Global blur on button click to prevent Enter key accidental submission
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        setTimeout(() => {
          if (document.activeElement?.tagName === 'BUTTON') {
            document.activeElement.blur();
          }
        }, 30);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Open doc with initial prompt
  const handleStartReadingWithPrompt = (doc, prompt) => {
    handleOpenDoc(doc);
    if (prompt && prompt.trim()) {
      setActiveAiTab('chat');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col z-10 overflow-hidden font-sans select-none">
      {/* VIEW 1: Universe View */}
      {view === 'universe' && (
        <UniverseView
          documents={documents}
          selectedDocIndex={selectedDocIndex}
          onSelectDocIndex={setSelectedDocIndex}
          onOpenDoc={handleOpenDoc}
          onDeleteDoc={handleDeleteDoc}
          onUploadFiles={handleUploadFiles}
          onOpenKeySettings={() => setIsKeyModalOpen(true)}
          deepMode={deepMode}
          onToggleDeepMode={() => {
            setDeepMode(prev => {
              showToast(!prev ? '已开启深度精读模式' : '已切换为速读模式');
              return !prev;
            });
          }}
          showToast={showToast}
          onStartReadingWithPrompt={handleStartReadingWithPrompt}
        />
      )}

      {/* VIEW 2: Workspace View */}
      {view === 'workspace' && currentDoc && (
        <WorkspaceView
          currentDoc={currentDoc}
          onBackToUniverse={() => setView('universe')}
          onOpenKeySettings={() => setIsKeyModalOpen(true)}
          onUploadOtherPdf={handleUploadFiles}
          showToast={showToast}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pdfScale={pdfScale}
          setPdfScale={setPdfScale}
          highlightActive={highlightActive}
          setHighlightActive={setHighlightActive}
          activeAiTab={activeAiTab}
          setActiveAiTab={setActiveAiTab}
          notes={notes}
          setNotes={setNotes}
        />
      )}

      {/* Floating Status Capsule */}
      <FloatingCapsule
        serialConnected={serialConnected}
        isDeviceConnected={isDeviceConnected}
        hardwareMap={hardwareMap}
        onOpenModal={() => setIsKeyModalOpen(true)}
      />

      {/* EasyInput Hardware HUD */}
      <HudNotification message={hudMessage} visible={hudVisible} />

      {/* Voice Transcription Floating Overlay */}
      <VoiceTranscriptionOverlay />

      {/* Toast Notification */}
      <ToastNotification toast={toast} />

      {/* EasyInput Modal */}
      <KeySettingsModal
        isOpen={isKeyModalOpen}
        onClose={() => {
          setRecordingToken(null);
          setIsKeyModalOpen(false);
        }}
        hardwareMap={hardwareMap}
        onUpdateHardwareAction={handleUpdateHardwareAction}
        onResetDefaults={handleResetDefaults}
        serialConnected={serialConnected}
        isDeviceConnected={isDeviceConnected}
        onToggleConnectSerial={() => toggleConnectSerial(false)}
        onForceSelectPort={() => toggleConnectSerial(true)}
        serialLogs={serialLogs}
        activeHighlightToken={activeHighlightToken}
        liveSignal={liveSignal}
        recordingToken={recordingToken}
        onStartRecording={(token) => {
          setRecordingToken(token);
          if (token) {
            const isEncoder = token.startsWith('ENC');
            if (isEncoder) {
              showToast('旋钮在 USB 免驱模式下无法被浏览器检测到，请在键盘上按下目标键来绑定');
            } else {
              showToast('请在键盘上按下目标键，或按下 EasyInput 对应物理按键...');
            }
          }
        }}
        onHardwareTrigger={onHardwareTrigger}
        showToast={showToast}
      />

      {/* S1 Triggered PDF Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadFiles={handleUploadFiles}
        triggerKeyLabel={uploadTriggerKey}
      />
    </div>
  );
}
