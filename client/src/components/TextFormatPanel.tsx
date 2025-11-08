import { motion } from 'motion/react';
import { X, Bold, Italic, Underline, Strikethrough, Type, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useRef, useEffect } from 'react';

interface TextFormatPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  font: string;
  onFontChange: (font: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  isBold: boolean;
  onBoldToggle: () => void;
  isItalic: boolean;
  onItalicToggle: () => void;
  isUnderline: boolean;
  onUnderlineToggle: () => void;
  isStrikethrough: boolean;
  onStrikethroughToggle: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  position?: { x: number; y: number };
}

const fonts = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'monospace', label: 'Monospace' },
];

const fontSizes = [
  { value: 12, label: '12px' },
  { value: 14, label: '14px' },
  { value: 16, label: '16px' },
  { value: 18, label: '18px' },
  { value: 20, label: '20px' },
  { value: 24, label: '24px' },
  { value: 28, label: '28px' },
  { value: 32, label: '32px' },
  { value: 36, label: '36px' },
  { value: 48, label: '48px' },
  { value: 64, label: '64px' },
  { value: 72, label: '72px' },
];

export function TextFormatPanel({
  text,
  onTextChange,
  font,
  onFontChange,
  fontSize,
  onFontSizeChange,
  isBold,
  onBoldToggle,
  isItalic,
  onItalicToggle,
  isUnderline,
  onUnderlineToggle,
  isStrikethrough,
  onStrikethroughToggle,
  onConfirm,
  onCancel,
  position,
}: TextFormatPanelProps) {
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState({
    x: position?.x || window.innerWidth / 2 - 160,
    y: position?.y || window.innerHeight / 2 - 200,
  });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (position) {
      setPanelPosition({ x: position.x, y: position.y });
    }
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setDragging(true);
      setDragOffset({
        x: e.clientX - panelPosition.x,
        y: e.clientY - panelPosition.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setPanelPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragOffset]);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="absolute z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80"
      style={{
        left: panelPosition.x,
        top: panelPosition.y,
        cursor: dragging ? 'grabbing' : 'auto',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header with Drag Handle */}
      <div className="flex items-center justify-between mb-3 drag-handle cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <Type className="w-4 h-4 text-gray-700" />
          <span className="text-sm text-gray-900">Text Formatting</span>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Font Selection */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Font</label>
          <Select value={font} onValueChange={onFontChange}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  <span style={{ fontFamily: f.value }}>{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Size</label>
          <Select value={fontSize.toString()} onValueChange={(val) => onFontSizeChange(parseInt(val))}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size.value} value={size.value.toString()}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formatting Buttons */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={onBoldToggle}
          className={`flex-1 p-2 rounded-lg border transition-all ${
            isBold
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={onItalicToggle}
          className={`flex-1 p-2 rounded-lg border transition-all ${
            isItalic
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={onUnderlineToggle}
          className={`flex-1 p-2 rounded-lg border transition-all ${
            isUnderline
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
          title="Underline"
        >
          <Underline className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={onStrikethroughToggle}
          className={`flex-1 p-2 rounded-lg border transition-all ${
            isStrikethrough
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4 mx-auto" />
        </button>
      </div>

      {/* Text Input */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 mb-1 block">Text Content</label>
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Enter your text..."
          className="min-h-[80px] rounded-lg resize-none text-sm"
          style={{
            fontFamily: font,
            fontSize: `${fontSize}px`,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: `${isUnderline ? 'underline' : ''} ${
              isStrikethrough ? 'line-through' : ''
            }`.trim(),
          }}
          autoFocus
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          size="sm"
          className="flex-1 rounded-lg bg-blue-500 hover:bg-blue-600"
          disabled={!text.trim()}
        >
          Confirm
        </Button>
      </div>
    </motion.div>
  );
}
