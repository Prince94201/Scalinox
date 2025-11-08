import { Undo2, Redo2, Trash2, Download, Sparkles, Upload, Users } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TopBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: (format: 'png' | 'svg') => void;
  onImportImage: () => void;
  onToggleAiPanel: () => void;
  onToggleCollaboration: () => void;
  isAiPanelOpen: boolean;
  isCollaborationOpen: boolean;
}

export function TopBar({
  onUndo,
  onRedo,
  onClear,
  onExport,
  onImportImage,
  onToggleAiPanel,
  onToggleCollaboration,
  isAiPanelOpen,
  isCollaborationOpen,
}: TopBarProps) {
  return (
    <TooltipProvider>
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900">Scalinox</span>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-2">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                className="rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-0.5"
              >
                <Undo2 className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                className="rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-0.5"
              >
                <Redo2 className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-gray-200 mx-2" />

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onImportImage}
                className="rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-0.5"
              >
                <Upload className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Import Image</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-0.5"
              >
                <Trash2 className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear Canvas</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-0.5"
                title="Export"
              >
                <Download className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport('png')}>
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('svg')}>
                Export as SVG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onToggleCollaboration}
            variant={isCollaborationOpen ? 'default' : 'outline'}
            className="rounded-xl px-4 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Users className="w-4 h-4 mr-2" />
            Collaborate
          </Button>

          <Button
            onClick={onToggleAiPanel}
            className={`
              rounded-xl px-6 transition-all duration-300 hover:-translate-y-0.5 shadow-md
              ${
                isAiPanelOpen
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-500/30'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-blue-500/30'
              }
            `}
          >
            <Sparkles className={`w-4 h-4 mr-2 ${isAiPanelOpen ? 'animate-pulse' : ''}`} />
            AI Generate
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
