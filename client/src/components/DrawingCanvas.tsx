import { useEffect, useRef, useState } from 'react';
import { Tool, DrawingSettings } from '../App';
import { TextFormatPanel } from './TextFormatPanel';
import { AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface DrawingCanvasProps {
  currentTool: Tool;
  settings: DrawingSettings;
  zoom: number;
}

interface Point {
  x: number;
  y: number;
}

interface TextFormat {
  font: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

interface DrawingElement {
  type: Tool | 'image';
  points?: Point[];
  startPoint?: Point;
  endPoint?: Point;
  color: string;
  brushSize: number;
  opacity: number;
  text?: string;
  textFormat?: TextFormat;
  imageData?: string;
  width?: number;
  height?: number;
  id?: string;
  isTemporary?: boolean; // For showing preview before finalizing
  isGeneratedAi?: boolean; // Mark images inserted from AI generation
}

// Helper function to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function DrawingCanvas({ currentTool, settings, zoom }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ start: Point; end: Point } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [hasDragStarted, setHasDragStarted] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [textFormat, setTextFormat] = useState<TextFormat>({
    font: 'Inter',
    fontSize: 24,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });

  // Resize canvas to match window size
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw canvas whenever elements change
  useEffect(() => {
    redrawCanvas();
  }, [elements, currentElement, scale, offset, selectionRect, selectedElementId]);

  // Event listeners for undo, redo, clear, export
  useEffect(() => {
    const handleUndo = () => {
      if (historyStep > 0) {
        setHistoryStep(historyStep - 1);
        setElements(history[historyStep - 1] || []);
      }
    };

    const handleRedo = () => {
      if (historyStep < history.length - 1) {
        setHistoryStep(historyStep + 1);
        setElements(history[historyStep + 1]);
      }
    };

    const handleClear = () => {
      setElements([]);
      setHistory([[...elements]]);
      setHistoryStep(history.length);
    };

    const handleExport = (e: Event) => {
      const customEvent = e as CustomEvent;
      const format = customEvent.detail.format;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (format === 'png') {
        // If an AI-generated image is selected, export only that image
        const aiImage = elements.find(el => el.id === selectedElementId && el.type === 'image' && el.isGeneratedAi && el.imageData);
        if (aiImage) {
          const link = document.createElement('a');
          link.download = 'generated-image.png';
          link.href = aiImage.imageData!;
          link.click();
          return;
        }

        const link = document.createElement('a');
        link.download = 'drawing.png';
        
        // Check if there's an active selection
        if (selectionRect) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Calculate actual coordinates with scale and offset
          const x = Math.min(selectionRect.start.x, selectionRect.end.x) * scale + offset.x;
          const y = Math.min(selectionRect.start.y, selectionRect.end.y) * scale + offset.y;
          const width = Math.abs(selectionRect.end.x - selectionRect.start.x) * scale;
          const height = Math.abs(selectionRect.end.y - selectionRect.start.y) * scale;

          // Create a temporary canvas for the selected area
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            // Fill with white background
            tempCtx.fillStyle = '#FFFFFF';
            tempCtx.fillRect(0, 0, width, height);
            
            // Draw the selected area
            tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
            
            link.href = tempCanvas.toDataURL('image/png');
          } else {
            link.href = canvas.toDataURL();
          }
        } else {
          // Export full canvas
          link.href = canvas.toDataURL();
        }
        
        link.click();
      }
    };

    const handleImportImage = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              // Scale down large images to fit better on canvas
              const maxWidth = 400;
              const maxHeight = 400;
              let width = img.width;
              let height = img.height;
              
              if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
              }
              
              const imageElement: DrawingElement = {
                type: 'image',
                startPoint: { x: 50, y: 50 },
                imageData: event.target?.result as string,
                width: width,
                height: height,
                color: '#000000',
                brushSize: 0,
                opacity: 1,
                id: generateId(),
              };
              const newElements = [...elements, imageElement];
              setElements(newElements);
              const newHistory = history.slice(0, historyStep + 1);
              newHistory.push(newElements);
              setHistory(newHistory);
              setHistoryStep(newHistory.length - 1);
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    };

    const handleAiGenerate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { sourceImage } = customEvent.detail || {};
      if (!sourceImage) {
        console.warn('AI Generate event missing sourceImage');
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Fit within 600x600 while keeping aspect ratio
        const maxW = 600;
        const maxH = 600;
        let w = img.width;
        let h = img.height;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);

        const imageElement: DrawingElement = {
          type: 'image',
          startPoint: { x: 80, y: 80 },
          imageData: sourceImage,
          width: w,
          height: h,
          color: '#000000',
          brushSize: 0,
          opacity: 1,
          id: generateId(),
          isGeneratedAi: true,
        };
        const newElements = [...elements, imageElement];
        setElements(newElements);
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
      };
      img.src = sourceImage;
    };

    const handleConvertToSketch = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { image } = customEvent.detail;
      
      // Create editable sketch from image
      const img = new Image();
      img.onload = () => {
        // Scale down large images to fit better on canvas
        const maxWidth = 600;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        const imageElement: DrawingElement = {
          type: 'image',
          startPoint: { x: 100, y: 100 },
          imageData: image,
          width: width,
          height: height,
          color: '#000000',
          brushSize: 0,
          opacity: 0.7, // Make it semi-transparent so it can be drawn over
          id: generateId(),
        };
        const newElements = [...elements, imageElement];
        setElements(newElements);
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
      };
      img.src = image;
    };

    const handleStartSelection = () => {
      setIsSelectionMode(true);
      setSelectionRect(null);
    };

    const handleGetSelection = (e: Event) => {
      const customEvent = e as CustomEvent;
      const callback = customEvent.detail.callback;
      
      if (!selectionRect || !canvasRef.current) {
        callback(null);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(null);
        return;
      }

      // Calculate actual coordinates with scale and offset
      const x = Math.min(selectionRect.start.x, selectionRect.end.x) * scale + offset.x;
      const y = Math.min(selectionRect.start.y, selectionRect.end.y) * scale + offset.y;
      const width = Math.abs(selectionRect.end.x - selectionRect.start.x) * scale;
      const height = Math.abs(selectionRect.end.y - selectionRect.start.y) * scale;

      // Create a temporary canvas for the selected area with white background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Fill with white background for JPEG
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, width, height);
        
        // Draw the selected area
        tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
        
        // Export as JPEG with quality 0.9
        callback(tempCanvas.toDataURL('image/jpeg', 0.9));
      } else {
        callback(null);
      }
    };

    const handleGetFull = (e: Event) => {
      const customEvent = e as CustomEvent;
      const callback = customEvent.detail.callback;
      
      if (!canvasRef.current) {
        callback('');
        return;
      }

      // Create a temporary canvas with white background for JPEG
      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Fill with white background for JPEG
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the canvas content
        tempCtx.drawImage(canvas, 0, 0);
        
        // Export as JPEG with quality 0.9
        callback(tempCanvas.toDataURL('image/jpeg', 0.9));
      } else {
        callback(canvas.toDataURL('image/jpeg', 0.9));
      }
    };

    window.addEventListener('canvas-undo', handleUndo);
    window.addEventListener('canvas-redo', handleRedo);
    window.addEventListener('canvas-clear', handleClear);
    window.addEventListener('canvas-export', handleExport);
    window.addEventListener('canvas-import-image', handleImportImage);
    window.addEventListener('canvas-ai-generate', handleAiGenerate);
    window.addEventListener('canvas-convert-to-sketch', handleConvertToSketch);
    window.addEventListener('canvas-start-selection', handleStartSelection);
    window.addEventListener('canvas-get-selection', handleGetSelection);
    window.addEventListener('canvas-get-full', handleGetFull);

    return () => {
      window.removeEventListener('canvas-undo', handleUndo);
      window.removeEventListener('canvas-redo', handleRedo);
      window.removeEventListener('canvas-clear', handleClear);
      window.removeEventListener('canvas-export', handleExport);
      window.removeEventListener('canvas-import-image', handleImportImage);
      window.removeEventListener('canvas-ai-generate', handleAiGenerate);
      window.removeEventListener('canvas-convert-to-sketch', handleConvertToSketch);
      window.removeEventListener('canvas-start-selection', handleStartSelection);
      window.removeEventListener('canvas-get-selection', handleGetSelection);
      window.removeEventListener('canvas-get-full', handleGetFull);
    };
  }, [elements, history, historyStep, selectionRect, selectedElementId]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw all elements
    [...elements, currentElement].forEach((element) => {
      if (!element) return;
      drawElement(ctx, element);
    });

    ctx.restore();

    // Draw selection rectangle if in selection mode
    if (selectionRect) {
      ctx.save();
      ctx.strokeStyle = '#3B82F6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      const x = Math.min(selectionRect.start.x, selectionRect.end.x) * scale + offset.x;
      const y = Math.min(selectionRect.start.y, selectionRect.end.y) * scale + offset.y;
      const width = Math.abs(selectionRect.end.x - selectionRect.start.x) * scale;
      const height = Math.abs(selectionRect.end.y - selectionRect.start.y) * scale;
      
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
    }
    
    // Draw selection highlight for selected element
    if (selectedElementId) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement) {
        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5, 5]);
        
        // Draw bounding box around selected element
        if (selectedElement.startPoint) {
          let x = selectedElement.startPoint.x;
          let y = selectedElement.startPoint.y;
          let width = selectedElement.width || 100;
          let height = selectedElement.height || 30;
          
          // Special handling for text elements (baseline is at startPoint.y)
          if (selectedElement.type === 'text') {
            const fontSize = selectedElement.textFormat?.fontSize || 24;
            y = selectedElement.startPoint.y - fontSize;
            height = fontSize * 1.3;
          } else if (selectedElement.endPoint) {
            x = Math.min(selectedElement.startPoint.x, selectedElement.endPoint.x);
            y = Math.min(selectedElement.startPoint.y, selectedElement.endPoint.y);
            width = Math.abs(selectedElement.endPoint.x - selectedElement.startPoint.x);
            height = Math.abs(selectedElement.endPoint.y - selectedElement.startPoint.y);
          }
          
          // Add padding
          const padding = 5;
          ctx.strokeRect(x - padding, y - padding, width + padding * 2, height + padding * 2);
        }
        
        ctx.restore();
      }
    }
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.color;
    ctx.lineWidth = element.brushSize;
    ctx.globalAlpha = element.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (element.type) {
      case 'brush':
        if (element.points && element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'eraser':
        // Show eraser preview (gray semi-transparent)
        if (element.points && element.points.length > 1) {
          ctx.save();
          ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
          ctx.fillStyle = 'rgba(150, 150, 150, 0.15)';
          ctx.lineWidth = element.brushSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
          
          // Draw circles along the path to show eraser size
          for (const point of element.points) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, element.brushSize / 2, 0, 2 * Math.PI);
            ctx.fill();
          }
          
          ctx.restore();
        }
        break;

      case 'stroke-eraser':
        // Stroke eraser shows a visual preview while drawing
        if (element.points && element.points.length > 1) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
          ctx.fillStyle = 'rgba(255, 100, 100, 0.1)';
          ctx.lineWidth = element.brushSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
          
          // Draw circles along the path to show eraser size
          for (const point of element.points) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, element.brushSize / 2, 0, 2 * Math.PI);
            ctx.fill();
          }
          
          ctx.restore();
        }
        break;

      case 'rectangle':
        if (element.startPoint && element.endPoint) {
          const width = element.endPoint.x - element.startPoint.x;
          const height = element.endPoint.y - element.startPoint.y;
          ctx.strokeRect(element.startPoint.x, element.startPoint.y, width, height);
        }
        break;

      case 'circle':
        if (element.startPoint && element.endPoint) {
          const radius = Math.sqrt(
            Math.pow(element.endPoint.x - element.startPoint.x, 2) +
            Math.pow(element.endPoint.y - element.startPoint.y, 2)
          );
          ctx.beginPath();
          ctx.arc(element.startPoint.x, element.startPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;

      case 'line':
        if (element.startPoint && element.endPoint) {
          ctx.beginPath();
          ctx.moveTo(element.startPoint.x, element.startPoint.y);
          ctx.lineTo(element.endPoint.x, element.endPoint.y);
          ctx.stroke();
        }
        break;

      case 'arrow':
        if (element.startPoint && element.endPoint) {
          const headLength = 15;
          const angle = Math.atan2(
            element.endPoint.y - element.startPoint.y,
            element.endPoint.x - element.startPoint.x
          );

          ctx.beginPath();
          ctx.moveTo(element.startPoint.x, element.startPoint.y);
          ctx.lineTo(element.endPoint.x, element.endPoint.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(element.endPoint.x, element.endPoint.y);
          ctx.lineTo(
            element.endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
            element.endPoint.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(element.endPoint.x, element.endPoint.y);
          ctx.lineTo(
            element.endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
            element.endPoint.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        break;

      case 'text':
        if (element.text && element.startPoint) {
          const format = element.textFormat || {
            font: 'Inter',
            fontSize: 24,
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
          };
          
          // Set font style
          const fontWeight = format.bold ? 'bold' : 'normal';
          const fontStyle = format.italic ? 'italic' : 'normal';
          const fontSize = format.fontSize || 24;
          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${format.font}`;
          
          // Draw text
          ctx.fillText(element.text, element.startPoint.x, element.startPoint.y);
          
          // Save current line width and set for decorations
          const prevLineWidth = ctx.lineWidth;
          ctx.lineWidth = Math.max(1, fontSize / 16);
          
          // Draw underline
          if (format.underline) {
            const textWidth = ctx.measureText(element.text).width;
            ctx.beginPath();
            ctx.moveTo(element.startPoint.x, element.startPoint.y + fontSize * 0.1);
            ctx.lineTo(element.startPoint.x + textWidth, element.startPoint.y + fontSize * 0.1);
            ctx.stroke();
          }
          
          // Draw strikethrough
          if (format.strikethrough) {
            const textWidth = ctx.measureText(element.text).width;
            ctx.beginPath();
            ctx.moveTo(element.startPoint.x, element.startPoint.y - fontSize * 0.3);
            ctx.lineTo(element.startPoint.x + textWidth, element.startPoint.y - fontSize * 0.3);
            ctx.stroke();
          }
          
          // Restore line width
          ctx.lineWidth = prevLineWidth;
        }
        break;

      case 'image':
        if (element.imageData && element.startPoint && element.width && element.height) {
          const img = new Image();
          img.src = element.imageData;
          if (img.complete) {
            ctx.drawImage(
              img,
              element.startPoint.x,
              element.startPoint.y,
              element.width,
              element.height
            );
          } else {
            img.onload = () => {
              ctx.drawImage(
                img,
                element.startPoint.x,
                element.startPoint.y,
                element.width,
                element.height
              );
            };
          }
        }
        break;
    }

    ctx.globalAlpha = 1;
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const findElementAtPoint = (point: Point): DrawingElement | null => {
    // Search in reverse order (top to bottom)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      
      // Check image elements
      if (element.type === 'image' && element.startPoint && element.width && element.height) {
        if (
          point.x >= element.startPoint.x &&
          point.x <= element.startPoint.x + element.width &&
          point.y >= element.startPoint.y &&
          point.y <= element.startPoint.y + element.height
        ) {
          return element;
        }
      }
      
      // Check text elements - text baseline is at startPoint.y, so we need to check above it
      if (element.type === 'text' && element.startPoint) {
        const textWidth = element.width || 100;
        const fontSize = element.textFormat?.fontSize || 24;
        // Text is drawn with baseline at startPoint.y, so the actual text is above this point
        if (
          point.x >= element.startPoint.x - 5 &&
          point.x <= element.startPoint.x + textWidth + 5 &&
          point.y >= element.startPoint.y - fontSize &&
          point.y <= element.startPoint.y + fontSize * 0.3
        ) {
          return element;
        }
      }
      
      // Check shapes with start/end points
      if (element.type !== 'text' && element.type !== 'image' && element.startPoint && element.endPoint) {
        const margin = 10;
        const minX = Math.min(element.startPoint.x, element.endPoint.x) - margin;
        const maxX = Math.max(element.startPoint.x, element.endPoint.x) + margin;
        const minY = Math.min(element.startPoint.y, element.endPoint.y) - margin;
        const maxY = Math.max(element.startPoint.y, element.endPoint.y) + margin;
        
        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
          return element;
        }
      }
      
      // Check brush strokes
      if (element.points && element.points.length > 0) {
        for (const p of element.points) {
          const distance = Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2);
          if (distance < (element.brushSize || 5) + 5) {
            return element;
          }
        }
      }
    }
    return null;
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  const saveToHistory = (newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+Click for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    // Handle selection mode from AI panel or selection tool
    if (isSelectionMode || currentTool === 'selection-area') {
      const pos = getMousePos(e);
      setIsSelecting(true);
      setIsSelectionMode(true);
      setSelectionRect({ start: pos, end: pos });
      return;
    }

    const point = getMousePos(e);

    // Handle text tool - show format panel
    if (currentTool === 'text') {
      setTextPosition(point);
      setShowTextPanel(true);
      setTextInput('');
      return;
    }

    // Handle stroke eraser - start erasing
    if (currentTool === 'stroke-eraser') {
      setIsDrawing(true);
      setCurrentElement({
        type: 'stroke-eraser',
        points: [point],
        color: settings.color,
        brushSize: settings.brushSize * 2, // Make eraser slightly larger for better UX
        opacity: 1,
        id: generateId(),
      });
      return;
    }

    // Handle select tool - select element
    if (currentTool === 'select') {
      const clickedElement = findElementAtPoint(point);
      if (clickedElement) {
        setSelectedElementId(clickedElement.id || null);
        setDragStart(point);
        setIsDragging(true); // Start drag mode for all elements
        setHasDragStarted(false); // Reset drag started flag
        
        // If it's a text element, also show edit panel
        if (clickedElement.type === 'text' && clickedElement.text) {
          setTextInput(clickedElement.text);
          setTextFormat(clickedElement.textFormat || {
            font: 'Inter',
            fontSize: 24,
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
          });
          setTextPosition(clickedElement.startPoint || point);
          setShowTextPanel(true);
        }
      } else {
        setSelectedElementId(null);
        setShowTextPanel(false);
      }
      return;
    }

    setIsDrawing(true);

    if (currentTool === 'brush' || currentTool === 'eraser') {
      setCurrentElement({
        type: currentTool,
        points: [point],
        color: settings.color,
        brushSize: settings.brushSize,
        opacity: settings.opacity,
        id: generateId(),
      });
    } else {
      setCurrentElement({
        type: currentTool,
        startPoint: point,
        endPoint: point,
        color: settings.color,
        brushSize: settings.brushSize,
        opacity: settings.opacity,
        id: generateId(),
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // Handle selection mode
    if (isSelecting && selectionRect) {
      const pos = getMousePos(e);
      setSelectionRect({ ...selectionRect, end: pos });
      return;
    }

    // Handle dragging selected element
    if (isDragging && selectedElementId && dragStart) {
      const currentPos = getMousePos(e);
      const dx = currentPos.x - dragStart.x;
      const dy = currentPos.y - dragStart.y;
      
      // Only start dragging if moved more than 3 pixels (prevents accidental drags)
      if (!hasDragStarted) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 3) {
          return;
        }
        // Dragging has now started
        setHasDragStarted(true);
        
        // Close text panel when starting to drag
        if (showTextPanel) {
          setShowTextPanel(false);
        }
      }

      const newElements = elements.map(el => {
        if (el.id === selectedElementId) {
          const updatedElement = { ...el };
          
          // Move start and end points
          if (updatedElement.startPoint) {
            updatedElement.startPoint = {
              x: updatedElement.startPoint.x + dx,
              y: updatedElement.startPoint.y + dy,
            };
          }
          if (updatedElement.endPoint) {
            updatedElement.endPoint = {
              x: updatedElement.endPoint.x + dx,
              y: updatedElement.endPoint.y + dy,
            };
          }
          
          // Move all points in brush strokes
          if (updatedElement.points) {
            updatedElement.points = updatedElement.points.map(p => ({
              x: p.x + dx,
              y: p.y + dy,
            }));
          }
          
          return updatedElement;
        }
        return el;
      });

      setElements(newElements);
      setDragStart(currentPos);
      return;
    }

    if (!isDrawing || !currentElement) return;

    const point = getMousePos(e);

    if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'stroke-eraser') {
      setCurrentElement({
        ...currentElement,
        points: [...(currentElement.points || []), point],
      });
    } else {
      setCurrentElement({
        ...currentElement,
        endPoint: point,
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // Handle selection mode
    if (isSelecting) {
      setIsSelecting(false);
      setIsSelectionMode(false);
      
      // Notify that selection is complete
      if (selectionRect) {
        const event = new CustomEvent('canvas-selection-complete');
        window.dispatchEvent(event);
      }
      return;
    }

    // Handle dragging completion
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      setHasDragStarted(false);
      if (selectedElementId && hasDragStarted) {
        saveToHistory(elements);
      }
      return;
    }

    if (isDrawing && currentElement) {
      // Handle regular eraser - pixel-based eraser (paint style)
      if (currentElement.type === 'eraser' && currentElement.points) {
        const eraserPoints = currentElement.points;
        const eraserSize = currentElement.brushSize;
        
        const newElements: DrawingElement[] = [];
        
        for (const element of elements) {
          // Skip eraser elements (don't save them)
          if (element.type === 'eraser' || element.type === 'stroke-eraser') {
            continue;
          }
          
          // For brush strokes, remove individual points that intersect
          if (element.type === 'brush' && element.points && element.points.length > 1) {
            const segments: Point[][] = [];
            let currentSegment: Point[] = [];
            
            for (const point of element.points) {
              let shouldErase = false;
              
              // Check if this point is within eraser path
              for (const eraserPoint of eraserPoints) {
                const distance = Math.sqrt(
                  Math.pow(point.x - eraserPoint.x, 2) + 
                  Math.pow(point.y - eraserPoint.y, 2)
                );
                
                if (distance < eraserSize / 2) {
                  shouldErase = true;
                  break;
                }
              }
              
              if (shouldErase) {
                // Save current segment if it has enough points
                if (currentSegment.length > 1) {
                  segments.push([...currentSegment]);
                }
                currentSegment = [];
              } else {
                currentSegment.push(point);
              }
            }
            
            // Save last segment
            if (currentSegment.length > 1) {
              segments.push(currentSegment);
            }
            
            // Create new elements for each segment
            for (const segment of segments) {
              newElements.push({
                ...element,
                points: segment,
                id: segment === segments[0] ? element.id : generateId(),
              });
            }
          } else {
            // For non-brush elements (shapes, text, images), delete entirely if touched
            let shouldDelete = false;
            
            if (element.points) {
              // Check point-based elements
              for (const point of element.points) {
                for (const eraserPoint of eraserPoints) {
                  const distance = Math.sqrt(
                    Math.pow(point.x - eraserPoint.x, 2) + 
                    Math.pow(point.y - eraserPoint.y, 2)
                  );
                  if (distance < eraserSize / 2) {
                    shouldDelete = true;
                    break;
                  }
                }
                if (shouldDelete) break;
              }
            } else if (element.startPoint) {
              // Check shape elements
              for (const eraserPoint of eraserPoints) {
                const distToStart = Math.sqrt(
                  Math.pow(element.startPoint.x - eraserPoint.x, 2) + 
                  Math.pow(element.startPoint.y - eraserPoint.y, 2)
                );
                if (distToStart < eraserSize / 2) {
                  shouldDelete = true;
                  break;
                }
                
                if (!shouldDelete && element.endPoint) {
                  const distToEnd = Math.sqrt(
                    Math.pow(element.endPoint.x - eraserPoint.x, 2) + 
                    Math.pow(element.endPoint.y - eraserPoint.y, 2)
                  );
                  if (distToEnd < eraserSize / 2) {
                    shouldDelete = true;
                    break;
                  }
                }
              }
            }
            
            if (!shouldDelete) {
              newElements.push(element);
            }
          }
        }
        
        setElements(newElements);
        saveToHistory(newElements);
        setCurrentElement(null);
      }
      // Handle stroke eraser - deletes entire strokes/elements when touched
      else if (currentElement.type === 'stroke-eraser' && currentElement.points) {
        const eraserPoints = currentElement.points;
        const eraserSize = currentElement.brushSize;
        
        // Check which elements intersect with the eraser path and delete them entirely
        const newElements = elements.filter(element => {
          // Don't save eraser elements
          if (element.type === 'eraser' || element.type === 'stroke-eraser') {
            return false;
          }
          
          let intersects = false;
          
          // Check if element intersects with eraser path
          if (element.points) {
            // For brush strokes and other point-based elements
            for (const point of element.points) {
              for (const eraserPoint of eraserPoints) {
                const distance = Math.sqrt(
                  Math.pow(point.x - eraserPoint.x, 2) + 
                  Math.pow(point.y - eraserPoint.y, 2)
                );
                if (distance < eraserSize / 2) {
                  intersects = true;
                  break;
                }
              }
              if (intersects) break;
            }
          } else if (element.startPoint) {
            // For shapes (rectangles, circles, lines, arrows, text)
            // Check if start or end point is within eraser
            for (const eraserPoint of eraserPoints) {
              const distToStart = Math.sqrt(
                Math.pow(element.startPoint.x - eraserPoint.x, 2) + 
                Math.pow(element.startPoint.y - eraserPoint.y, 2)
              );
              if (distToStart < eraserSize / 2) {
                intersects = true;
                break;
              }
              
              if (element.endPoint) {
                const distToEnd = Math.sqrt(
                  Math.pow(element.endPoint.x - eraserPoint.x, 2) + 
                  Math.pow(element.endPoint.y - eraserPoint.y, 2)
                );
                if (distToEnd < eraserSize / 2) {
                  intersects = true;
                  break;
                }
              }
            }
          }
          
          // Keep the element if it doesn't intersect (return true to keep)
          return !intersects;
        });
        
        setElements(newElements);
        saveToHistory(newElements);
        setCurrentElement(null);
      } else {
        const newElements = [...elements, currentElement];
        setElements(newElements);
        saveToHistory(newElements);
        setCurrentElement(null);
      }
    }
    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 5));
  };

  const handleTextConfirm = () => {
    if (!textInput.trim() || !textPosition) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Measure text to get dimensions
    const fontSize = textFormat.fontSize || 24;
    const fontWeight = textFormat.bold ? 'bold' : 'normal';
    const fontStyle = textFormat.italic ? 'italic' : 'normal';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${textFormat.font}`;
    const textMetrics = ctx.measureText(textInput);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    
    const newElement: DrawingElement = {
      type: 'text',
      text: textInput,
      textFormat: { ...textFormat },
      startPoint: textPosition,
      color: settings.color,
      brushSize: settings.brushSize,
      opacity: settings.opacity,
      width: textWidth,
      height: textHeight,
      id: selectedElementId || generateId(),
    };
    
    let newElements: DrawingElement[];
    if (selectedElementId) {
      // Update existing text element
      newElements = elements.map(el => 
        el.id === selectedElementId ? newElement : el
      );
    } else {
      // Add new text element
      newElements = [...elements, newElement];
    }
    
    setElements(newElements);
    saveToHistory(newElements);
    setShowTextPanel(false);
    setTextInput('');
    setSelectedElementId(null);
    setTextFormat({
      font: 'Inter',
      fontSize: 24,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    });
  };

  const handleTextCancel = () => {
    setShowTextPanel(false);
    setTextInput('');
    setSelectedElementId(null);
    setTextFormat({
      font: 'Inter',
      fontSize: 24,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el) return;
    // Only allow delete for AI-generated images as requested
    if (el.type === 'image' && el.isGeneratedAi) {
      const newElements = elements.filter(e => e.id !== selectedElementId);
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElementId(null);
    }
  };

  const getSelectedAIBounds = () => {
    if (!selectedElementId) return null;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el || el.type !== 'image' || !el.isGeneratedAi || !el.startPoint || !el.width || !el.height) return null;
    const x = el.startPoint.x * scale + offset.x;
    const y = el.startPoint.y * scale + offset.y;
    const w = el.width * scale;
    const h = el.height * scale;
    return { x, y, w, h };
  };

  return (
    <div className="w-full h-full relative bg-white">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Selection mode indicator */}
      {isSelectionMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg z-10 flex items-center gap-2 animate-pulse pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" strokeDasharray="4 4"/>
          </svg>
          <span className="text-sm">Click and drag to select area</span>
        </div>
      )}

      {/* Delete overlay for selected AI-generated image */}
      {(() => {
        const b = getSelectedAIBounds();
        if (!b) return null;
        return (
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="absolute z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md"
            style={{ left: `${b.x + b.w - 16}px`, top: `${b.y - 16}px` }}
            title="Delete generated image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        );
      })()}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: currentTool === 'select' || currentTool === 'selection-area' ? 'default' : 
                  currentTool === 'text' ? 'text' : 
                  currentTool === 'eraser' || currentTool === 'stroke-eraser' ? 'pointer' : 
                  'crosshair',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease',
        }}
      />
      
      {/* Text Format Panel */}
      <AnimatePresence>
        {showTextPanel && textPosition && (
          <TextFormatPanel
            text={textInput}
            onTextChange={setTextInput}
            font={textFormat.font}
            onFontChange={(font) => setTextFormat({ ...textFormat, font })}
            fontSize={textFormat.fontSize}
            onFontSizeChange={(fontSize) => setTextFormat({ ...textFormat, fontSize })}
            isBold={textFormat.bold}
            onBoldToggle={() => setTextFormat({ ...textFormat, bold: !textFormat.bold })}
            isItalic={textFormat.italic}
            onItalicToggle={() => setTextFormat({ ...textFormat, italic: !textFormat.italic })}
            isUnderline={textFormat.underline}
            onUnderlineToggle={() => setTextFormat({ ...textFormat, underline: !textFormat.underline })}
            isStrikethrough={textFormat.strikethrough}
            onStrikethroughToggle={() => setTextFormat({ ...textFormat, strikethrough: !textFormat.strikethrough })}
            onConfirm={handleTextConfirm}
            onCancel={handleTextCancel}
            position={{
              x: textPosition.x * scale + offset.x,
              y: textPosition.y * scale + offset.y,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
