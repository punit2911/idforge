import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Canvas as FabricCanvas, FabricText, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Type,
  Save,
  Download,
  X,
  Undo,
  Redo,
  Trash2,
  ImageIcon,
  Palette,
  Bold,
  Italic,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface IDCardEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (editedImageUrl: string) => void;
  name?: string;
}

export function IDCardEditor({ imageUrl, isOpen, onClose, onSave, name = "id-card" }: IDCardEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [textToAdd, setTextToAdd] = useState("");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    "#ffffff", "#000000", "#ef4444", "#f97316", "#eab308", 
    "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
  ];

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !containerRef.current) return;

    setIsLoading(true);

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 32; // padding
    
    // Load image to get dimensions
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let canvasWidth = Math.min(containerWidth, 800);
      let canvasHeight = canvasWidth / aspectRatio;
      
      // Limit height
      if (canvasHeight > 600) {
        canvasHeight = 600;
        canvasWidth = canvasHeight * aspectRatio;
      }

      const canvas = new FabricCanvas(canvasRef.current!, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#1a1a2e",
      });

      // Set background image
      FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((fabricImg) => {
        fabricImg.scaleToWidth(canvasWidth);
        fabricImg.scaleToHeight(canvasHeight);
        fabricImg.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
        });
        canvas.add(fabricImg);
        canvas.sendObjectToBack(fabricImg);
        canvas.renderAll();
        
        // Save initial state
        saveState(canvas);
        setIsLoading(false);
      });

      setFabricCanvas(canvas);
    };

    img.onerror = () => {
      setIsLoading(false);
      toast({
        title: "Error loading image",
        description: "Could not load the image for editing.",
        variant: "destructive",
      });
    };

    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
        setFabricCanvas(null);
      }
    };
  }, [isOpen, imageUrl]);

  const saveState = useCallback((canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, json];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleAddText = () => {
    if (!fabricCanvas || !textToAdd.trim()) return;

    const text = new FabricText(textToAdd, {
      left: 100,
      top: 100,
      fill: selectedColor,
      fontSize: 24,
      fontFamily: "Arial",
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    saveState(fabricCanvas);
    setTextToAdd("");
    
    toast({
      title: "Text added",
      description: "Drag to position, resize handles to adjust size.",
    });
  };

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const img = await FabricImage.fromURL(dataUrl);
      
      img.scaleToWidth(100);
      img.set({
        left: 100,
        top: 100,
      });

      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();
      saveState(fabricCanvas);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUndo = () => {
    if (!fabricCanvas || historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    fabricCanvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleRedo = () => {
    if (!fabricCanvas || historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    fabricCanvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleDeleteSelected = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
      saveState(fabricCanvas);
    }
  };

  const handleUpdateSelectedColor = (color: string) => {
    setSelectedColor(color);
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && activeObject.type === 'text') {
      (activeObject as FabricText).set('fill', color);
      fabricCanvas.renderAll();
      saveState(fabricCanvas);
    }
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;

    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-edited.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your edited ID card is being downloaded.",
    });
  };

  const handleSave = () => {
    if (!fabricCanvas) return;

    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    onSave?.(dataUrl);
    toast({
      title: "Changes saved",
      description: "Your edited design has been saved.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Edit ID Card
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="lg:w-64 space-y-4 p-4 bg-muted/50 rounded-lg overflow-y-auto">
            {/* Add Text */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Add Text</Label>
              <div className="flex gap-2">
                <Input
                  value={textToAdd}
                  onChange={(e) => setTextToAdd(e.target.value)}
                  placeholder="Enter text..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                />
                <Button size="icon" onClick={handleAddText} disabled={!textToAdd.trim()}>
                  <Type className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isBold ? "default" : "outline"}
                  onClick={() => setIsBold(!isBold)}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={isItalic ? "default" : "outline"}
                  onClick={() => setIsItalic(!isItalic)}
                >
                  <Italic className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Text Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleUpdateSelectedColor(color)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all",
                      selectedColor === color
                        ? "border-primary scale-110"
                        : "border-transparent hover:border-muted-foreground"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Add Image */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Add Image</Label>
              <Button variant="outline" className="w-full" onClick={handleAddImage}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Edit Actions */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Edit Actions</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="flex-1"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex-1"
                >
                  <Redo className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-4 overflow-auto min-h-[400px]"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>Loading editor...</span>
              </div>
            ) : (
              <canvas ref={canvasRef} className="shadow-lg rounded-lg" />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button variant="neon" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {onSave && (
            <Button variant="hero" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
