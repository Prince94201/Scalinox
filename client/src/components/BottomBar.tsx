import { Slider } from './ui/slider';
import { motion } from 'motion/react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface BottomBarProps {
  brushSize: number;
  opacity: number;
  onBrushSizeChange: (size: number) => void;
  onOpacityChange: (opacity: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function BottomBar({
  brushSize,
  opacity,
  onBrushSizeChange,
  onOpacityChange,
  zoom,
  onZoomChange,
}: BottomBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="h-20 bg-white border-t border-gray-200 flex items-center justify-center gap-12 px-6 shadow-sm"
    >
      {/* Brush Size */}
      <div className="flex items-center gap-4 min-w-[280px]">
        <div className="flex items-center gap-3 min-w-[100px]">
          <span className="text-gray-600 text-sm">Brush Size</span>
          <div
            className="rounded-full bg-gray-900 transition-all duration-200"
            style={{
              width: `${Math.max(brushSize * 2, 8)}px`,
              height: `${Math.max(brushSize * 2, 8)}px`,
            }}
          />
        </div>
        <Slider
          value={[brushSize]}
          onValueChange={(values) => onBrushSizeChange(values[0])}
          min={1}
          max={20}
          step={1}
          className="flex-1"
        />
        <span className="text-gray-600 text-sm min-w-[30px] text-right">{brushSize}px</span>
      </div>

      <div className="w-px h-8 bg-gray-200" />

      {/* Opacity */}
      <div className="flex items-center gap-4 min-w-[280px]">
        <span className="text-gray-600 text-sm min-w-[60px]">Opacity</span>
        <Slider
          value={[opacity * 100]}
          onValueChange={(values) => onOpacityChange(values[0] / 100)}
          min={0}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-gray-600 text-sm min-w-[40px] text-right">
          {Math.round(opacity * 100)}%
        </span>
      </div>

      <div className="w-px h-8 bg-gray-200" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onZoomChange(Math.max(zoom - 0.1, 0.25))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4 text-gray-700" />
        </button>
        <span className="text-gray-600 text-sm min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange(Math.min(zoom + 0.1, 3))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    </motion.div>
  );
}
