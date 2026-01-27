import { MessageCircle, X } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";

interface TextSelectionPopupProps {
  selectedText: string;
  position: { x: number; y: number };
  onAskQuestion: () => void;
  onClose: () => void;
}

export function TextSelectionPopup({ 
  selectedText, 
  position, 
  onAskQuestion, 
  onClose 
}: TextSelectionPopupProps) {
  if (!selectedText) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="fixed z-50 flex items-center space-x-2 rounded-2xl border border-[#dfe3ed] bg-gradient-to-r from-[#f6f8fb] via-[#eef1f7] to-[#e3e7f0] px-4 py-2 text-[#1f2937] shadow-[0_24px_40px_rgba(160,170,190,0.24)]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-10px)'
      }}
    >
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-8 rounded-lg text-[#1f2937] hover:bg-white/60"
        onClick={onAskQuestion}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        AI에게 질문하기
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-8 w-8 rounded-lg p-0 text-[#1f2937] hover:bg-white/60"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
