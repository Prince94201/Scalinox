import { motion, AnimatePresence } from 'motion/react';
import { Tool } from '../App';
import {
  MousePointer2,
  Pencil,
  Eraser,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Type,
  Palette,
  ChevronLeft,
  ChevronRight,
  Scan,
  Slash,
} from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface LeftToolbarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  eraserMode: 'eraser' | 'stroke-eraser';
  onEraserModeChange: (mode: 'eraser' | 'stroke-eraser') => void;
}

const tools = [
  { id: 'select' as Tool, icon: MousePointer2, label: 'Select' },
  { id: 'selection-area' as Tool, icon: Scan, label: 'Selection Tool (AI)' },
  { id: 'brush' as Tool, icon: Pencil, label: 'Brush' },
  { id: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
  { id: 'rectangle' as Tool, icon: Square, label: 'Rectangle' },
  { id: 'circle' as Tool, icon: Circle, label: 'Circle' },
  { id: 'line' as Tool, icon: Minus, label: 'Line' },
  { id: 'arrow' as Tool, icon: ArrowRight, label: 'Arrow' },
  { id: 'text' as Tool, icon: Type, label: 'Text' },
];

const colorPresets = [
  // Blacks & Grays
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  // Reds
  '#EF4444', '#DC2626', '#991B1B', '#FCA5A5',
  // Oranges
  '#F97316', '#EA580C', '#FB923C', '#FDBA74',
  // Yellows
  '#FBBF24', '#F59E0B', '#FDE047', '#FEF08A',
  // Greens
  '#10B981', '#059669', '#34D399', '#6EE7B7',
  // Blues
  '#3B82F6', '#2563EB', '#60A5FA', '#93C5FD',
  // Purples
  '#8B5CF6', '#7C3AED', '#A78BFA', '#C4B5FD',
  // Pinks
  '#EC4899', '#DB2777', '#F472B6', '#F9A8D4',
  // Browns
  '#92400E', '#78350F', '#A16207', '#CA8A04',
  // White
  '#FFFFFF', '#F3F4F6', '#E5E7EB', '#D1D5DB',
];

export function LeftToolbar({
  isOpen,
  onToggle,
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  eraserMode,
  onEraserModeChange,
}: LeftToolbarProps) {
  return (
    <TooltipProvider>
      <div className="relative z-10 h-full">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute left-4 top-4 bg-white rounded-2xl shadow-xl p-3 flex flex-col gap-2 w-16"
            >
              {tools.map((tool) => (
                <Tooltip key={tool.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onToolChange(tool.id)}
                      className={`
                        p-3 rounded-xl transition-all duration-200
                        hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-md
                        ${
                          (currentTool === tool.id || (tool.id === 'eraser' && (currentTool === 'eraser' || currentTool === 'stroke-eraser')))
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'text-gray-700'
                        }
                      `}
                    >
                      <tool.icon className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{tool.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* Eraser Mode Toggle - Shows when eraser is selected */}
              {(currentTool === 'eraser' || currentTool === 'stroke-eraser') && (
                <div className="border-t border-gray-200 pt-2 mt-1">
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEraserModeChange(eraserMode === 'eraser' ? 'stroke-eraser' : 'eraser')}
                        className={`
                          p-3 rounded-xl transition-all duration-200 w-full
                          hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-md
                          ${
                            eraserMode === 'stroke-eraser'
                              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                              : 'bg-gray-500 text-white shadow-lg shadow-gray-500/30'
                          }
                        `}
                      >
                        <Slash className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{eraserMode === 'eraser' ? 'Pixel Eraser (Click to switch to Stroke Eraser)' : 'Stroke Eraser (Click to switch to Pixel Eraser)'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Color Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-md relative"
                    title="Color Picker"
                  >
                    <Palette className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                    <div
                      className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: currentColor }}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" className="w-72 p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Color Presets</p>
                      <div className="grid grid-cols-8 gap-1.5">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => onColorChange(color)}
                            className={`
                              w-7 h-7 rounded-md transition-all duration-200
                              hover:scale-110 hover:shadow-md border border-gray-200
                              ${currentColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                            `}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-2">Custom Color</p>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={currentColor}
                          onChange={(e) => onColorChange(e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
                        />
                        <input
                          type="text"
                          value={currentColor}
                          onChange={(e) => onColorChange(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button - Positioned at middle-right of toolbar */}
        <motion.button
          onClick={onToggle}
          initial={{ x: 0 }}
          animate={{ x: isOpen ? 0 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="absolute top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all hover:scale-110"
          style={{ left: isOpen ? '84px' : '16px' }}
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-700" />
          )}
        </motion.button>
      </div>
    </TooltipProvider>
  );
}
