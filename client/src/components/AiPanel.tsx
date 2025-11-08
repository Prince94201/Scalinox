import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Upload, Sparkles, Wand2, Image as ImageIcon, Palette, Square } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';

interface AiPanelProps {
  onClose: () => void;
}

const aiStyles = [
  { id: 'sketch', name: 'Sketch', description: 'Simple line drawing' },
  { id: 'watercolor', name: 'Watercolor', description: 'Soft, flowing colors' },
  { id: 'pencil', name: 'Pencil', description: 'Realistic pencil sketch' },
  { id: 'ink', name: 'Ink', description: 'Bold ink lines' },
  { id: 'charcoal', name: 'Charcoal', description: 'Dark, textured strokes' },
  { id: 'pastel', name: 'Pastel', description: 'Soft chalk colors' },
  { id: 'digital', name: 'Digital Art', description: 'Modern digital style' },
  { id: 'anime', name: 'Anime', description: 'Japanese animation style' },
];

export function AiPanel({ onClose }: AiPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('sketch');
  const [activeTab, setActiveTab] = useState('generate');
  const [useSelection, setUseSelection] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // Listen for selection complete event
  useEffect(() => {
    const handleSelectionComplete = () => {
      if (useSelection && isSelecting) {
        setIsSelecting(false);
        previewSelection();
      }
    };

    window.addEventListener('canvas-selection-complete', handleSelectionComplete);
    return () => {
      window.removeEventListener('canvas-selection-complete', handleSelectionComplete);
    };
  }, [useSelection, isSelecting]);

  const handleStartSelection = () => {
    setIsSelecting(true);
    toast.info('Click and drag on the canvas to select an area');
    // Enable selection mode on canvas
    const event = new CustomEvent('canvas-start-selection');
    window.dispatchEvent(event);
  };

  const previewSelection = () => {
    if (!useSelection) return;
    
    const event = new CustomEvent('canvas-get-selection', {
      detail: {
        callback: (selectionData: string | null) => {
          if (selectionData) {
            setSelectedImagePreview(selectionData);
            toast.success('📸 Selection captured as JPEG!', {
              description: 'Ready to send to AI generation API',
            });
          } else {
            toast.error('No valid selection found', {
              description: 'Please draw a selection on the canvas',
            });
          }
        }
      }
    });
    window.dispatchEvent(event);
  };

  const handleGenerate = () => {
    if (!prompt && activeTab !== 'convert') {
      toast.error('Please enter a prompt');
      return;
    }

    if (useSelection && activeTab !== 'convert') {
      // Request canvas selection data
      const event = new CustomEvent('canvas-get-selection', {
        detail: {
          callback: (selectionData: string | null) => {
            if (!selectionData) {
              toast.error('No area selected. Please select an area or uncheck "Use Selection"');
              return;
            }
            generateWithData(selectionData);
          }
        }
      });
      window.dispatchEvent(event);
    } else {
      // Use whole canvas
      const event = new CustomEvent('canvas-get-full', {
        detail: {
          callback: (canvasData: string) => {
            generateWithData(canvasData);
          }
        }
      });
      window.dispatchEvent(event);
    }
  };

  const generateWithData = async (imageData: string) => {
    setIsGenerating(true);
    
    try {
      // Convert base64 to Blob for API submission
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();
      
      // Create FormData for API
      const formData = new FormData();
      formData.append('image', blob, 'canvas.jpg');
      formData.append('prompt', prompt);
      formData.append('style', selectedStyle);
      
      // TODO: Replace with your actual API endpoint
      const API_ENDPOINT = 'YOUR_RUNPOD_BANANA_API_ENDPOINT_HERE';
      
      // Placeholder for actual API call
      // Uncomment and modify when you add your API endpoint:
      /*
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const result = await response.json();
      const generatedImage = result.image; // Adjust based on your API response
      */
      
      // For now, simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsGenerating(false);
      setIsSelecting(false);
      setSelectedImagePreview(null); // Clear preview after generation
      toast.success('Drawing generated successfully!');
      
      // Log the data that would be sent to API (for debugging)
      console.log('🎨 Data prepared for API:', {
        prompt,
        style: selectedStyle,
        imageSize: `${blob.size} bytes`,
        imageType: blob.type,
        imageFormat: 'image/jpeg',
        quality: 0.9,
      });
      
      // Trigger canvas update with generated image
      // Replace imageData with actual generated image from API
      const event = new CustomEvent('canvas-ai-generate', { 
        detail: { 
          prompt, 
          style: selectedStyle, 
          sourceImage: imageData // This will be replaced with API response
        } 
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      setIsSelecting(false);
      toast.error('Failed to generate drawing. Please try again.');
    }
  };

  const handleRefinePrompt = () => {
    if (!prompt) {
      toast.error('Please enter a prompt to refine');
      return;
    }

    setIsRefining(true);
    // Simulate AI refinement
    setTimeout(() => {
      const refinedPrompt = `${prompt}, highly detailed, professional ${selectedStyle} style, with perfect composition and lighting`;
      setPrompt(refinedPrompt);
      setIsRefining(false);
      toast.success('Prompt refined!');
    }, 1500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        toast.success('Image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConvertToSketch = () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('Image converted to editable sketch!');
      // Trigger canvas update with editable sketch
      const event = new CustomEvent('canvas-convert-to-sketch', { 
        detail: { image: uploadedImage, style: selectedStyle } 
      });
      window.dispatchEvent(event);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="absolute right-0 top-0 bottom-0 w-[380px] bg-white border-l border-gray-200 shadow-2xl flex flex-col z-20"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-0.5"
        >
          <X className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="generate" className="rounded-xl text-xs">
              <Wand2 className="w-3 h-3 mr-1.5" />
              Quick
            </TabsTrigger>
            <TabsTrigger value="dream" className="rounded-xl text-xs">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Dream
            </TabsTrigger>
          </TabsList>

          {/* Quick Generate Tab */}
          <TabsContent value="generate" className="space-y-4 mt-0">
            {/* Style Selection - Only for Quick Generate */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-gray-600" />
                <label className="text-sm text-gray-700">Art Style</label>
              </div>
              <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
                <div className="grid grid-cols-2 gap-2">
                  {aiStyles.map((style) => (
                    <div key={style.id}>
                      <RadioGroupItem
                        value={style.id}
                        id={style.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={style.id}
                        className="flex flex-col p-3 rounded-lg border-2 border-gray-200 cursor-pointer transition-all hover:border-blue-300 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50"
                      >
                        <span className="text-xs text-gray-900">{style.name}</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">{style.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Selection Option */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-selection"
                  checked={useSelection}
                  onCheckedChange={(checked) => setUseSelection(checked as boolean)}
                />
                <label
                  htmlFor="use-selection"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Use selected area from canvas
                </label>
              </div>
              
              {useSelection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Button
                    onClick={handleStartSelection}
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg"
                    disabled={isSelecting}
                  >
                    <Square className="w-3 h-3 mr-2" />
                    {isSelecting ? 'Selecting...' : 'Select Area on Canvas'}
                  </Button>
                  
                  {selectedImagePreview && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">📸 Selected area (JPEG):</p>
                      <img 
                        src={selectedImagePreview} 
                        alt="Selected area" 
                        className="w-full rounded border border-gray-200"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Ready to send to API
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600">
                    {isSelecting 
                      ? '👆 Click and drag on the canvas to select an area'
                      : 'Click above to select a specific area for AI generation'
                    }
                  </p>
                </motion.div>
              )}
              
              {!useSelection && (
                <p className="text-xs text-gray-600">
                  ✨ Whole canvas will be used for AI generation
                </p>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Drawing
                </>
              )}
            </Button>
          </TabsContent>

          {/* Dream Mode Tab */}
          <TabsContent value="dream" className="space-y-4 mt-0">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Describe your dream creation
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Be creative! Describe your vision in detail..."
                className="min-h-[120px] rounded-xl resize-none"
              />
            </div>

            <Button
              onClick={handleRefinePrompt}
              disabled={!prompt || isRefining}
              variant="outline"
              className="w-full rounded-xl"
            >
              {isRefining ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Wand2 className="w-4 h-4" />
                  </motion.div>
                  Refining...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Refine with AI
                </>
              )}
            </Button>

            {/* Selection Option */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dream-use-selection"
                  checked={useSelection}
                  onCheckedChange={(checked) => setUseSelection(checked as boolean)}
                />
                <label
                  htmlFor="dream-use-selection"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Use selected area from canvas
                </label>
              </div>
              
              {useSelection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Button
                    onClick={handleStartSelection}
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg"
                    disabled={isSelecting}
                  >
                    <Square className="w-3 h-3 mr-2" />
                    {isSelecting ? 'Selecting...' : 'Select Area on Canvas'}
                  </Button>
                  
                  {selectedImagePreview && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">📸 Selected area (JPEG):</p>
                      <img 
                        src={selectedImagePreview} 
                        alt="Selected area" 
                        className="w-full rounded border border-gray-200"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Ready to send to API
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600">
                    {isSelecting 
                      ? '👆 Click and drag on the canvas to select an area'
                      : 'Select a specific area to enhance with AI'
                    }
                  </p>
                </motion.div>
              )}
              
              {!useSelection && (
                <p className="text-xs text-gray-600">
                  ✨ Whole canvas will be used for dream generation
                </p>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-0.5"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Creating Dream...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Dream
                </>
              )}
            </Button>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-gray-700 mb-2">💡 Dream Mode Tips</p>
              <ul className="text-[11px] text-gray-600 space-y-1">
                <li>• Use "Refine with AI" to enhance your prompt</li>
                <li>• Be specific about colors, mood, and details</li>
                <li>• Select canvas areas to enhance existing work</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generation Progress */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100"
          >
            <div className="flex items-center justify-center mb-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-8 h-8 text-blue-500" />
              </motion.div>
            </div>
            <p className="text-center text-gray-600 text-sm">
              AI is generating your {activeTab === 'convert' ? 'editable sketch' : 'drawing'}...
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
