import { useState, useEffect } from 'react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { LeftToolbar } from './components/LeftToolbar';
import { TopBar } from './components/TopBar';
import { BottomBar } from './components/BottomBar';
import { AiPanel } from './components/AiPanel';
import { CollaborationPanel } from './components/CollaborationPanel';
import { ChatBox } from './components/ChatBox';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from './components/ui/sonner';

export type Tool = 'select' | 'selection-area' | 'brush' | 'eraser' | 'stroke-eraser' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text';

export interface DrawingSettings {
  color: string;
  brushSize: number;
  opacity: number;
}

export default function App() {
  const [currentTool, setCurrentTool] = useState<Tool>('brush');
  const [eraserMode, setEraserMode] = useState<'eraser' | 'stroke-eraser'>('eraser');
  const [isLeftToolbarOpen, setIsLeftToolbarOpen] = useState(true);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [drawingSettings, setDrawingSettings] = useState<DrawingSettings>({
    color: '#000000',
    brushSize: 3,
    opacity: 1,
  });
  const [zoom, setZoom] = useState(1);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
      // Zoom In: + or =
      if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setZoom((prev) => Math.min(prev + 0.1, 3));
      }
      // Zoom Out: -
      if (e.key === '-' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setZoom((prev) => Math.max(prev - 0.1, 0.25));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUndo = () => {
    const event = new CustomEvent('canvas-undo');
    window.dispatchEvent(event);
  };

  const handleRedo = () => {
    const event = new CustomEvent('canvas-redo');
    window.dispatchEvent(event);
  };

  const handleClear = () => {
    const event = new CustomEvent('canvas-clear');
    window.dispatchEvent(event);
  };

  const handleExport = (format: 'png' | 'svg') => {
    const event = new CustomEvent('canvas-export', { detail: { format } });
    window.dispatchEvent(event);
  };

  const handleImportImage = () => {
    const event = new CustomEvent('canvas-import-image');
    window.dispatchEvent(event);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col">
      <Toaster />
      
      {/* Top Bar */}
      <TopBar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        onImportImage={handleImportImage}
        onToggleAiPanel={() => setIsAiPanelOpen(!isAiPanelOpen)}
        onToggleCollaboration={() => setIsCollaborationOpen(!isCollaborationOpen)}
        isAiPanelOpen={isAiPanelOpen}
        isCollaborationOpen={isCollaborationOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Toolbar */}
        <LeftToolbar
          isOpen={isLeftToolbarOpen}
          onToggle={() => setIsLeftToolbarOpen(!isLeftToolbarOpen)}
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          currentColor={drawingSettings.color}
          onColorChange={(color) => setDrawingSettings({ ...drawingSettings, color })}
          eraserMode={eraserMode}
          onEraserModeChange={setEraserMode}
        />

        {/* Canvas Area */}
        <motion.div
          className="flex-1 relative"
          animate={{
            marginRight: isAiPanelOpen || isCollaborationOpen ? '380px' : '0px',
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <DrawingCanvas
            currentTool={currentTool === 'eraser' || currentTool === 'stroke-eraser' ? eraserMode : currentTool}
            settings={drawingSettings}
            zoom={zoom}
          />
        </motion.div>

        {/* AI Panel */}
        <AnimatePresence mode="wait">
          {isAiPanelOpen && !isCollaborationOpen && (
            <AiPanel onClose={() => setIsAiPanelOpen(false)} />
          )}
        </AnimatePresence>

        {/* Collaboration Panel */}
        <AnimatePresence mode="wait">
          {isCollaborationOpen && !isAiPanelOpen && (
            <CollaborationPanel 
              onClose={() => setIsCollaborationOpen(false)}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              isChatOpen={isChatOpen}
            />
          )}
        </AnimatePresence>

        {/* Chat Box */}
        <AnimatePresence>
          {isChatOpen && isCollaborationOpen && (
            <ChatBox onClose={() => setIsChatOpen(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar */}
      <BottomBar
        brushSize={drawingSettings.brushSize}
        opacity={drawingSettings.opacity}
        onBrushSizeChange={(size) => setDrawingSettings({ ...drawingSettings, brushSize: size })}
        onOpacityChange={(opacity) => setDrawingSettings({ ...drawingSettings, opacity })}
        zoom={zoom}
        onZoomChange={setZoom}
      />
    </div>
  );
}
