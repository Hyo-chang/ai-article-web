import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ArticleChatProps {
  articleTitle: string;
  initialQuestion?: string;
  onQuestionUsed?: () => void;
}

const mockAIResponses = [
  "이 기사의 주요 내용을 바탕으로 답변드리겠습니다.",
  "기사에서 언급된 내용을 참고하면,",
  "해당 주제에 대해 기사에서는 다음과 같이 설명하고 있습니다:",
  "기사의 맥락에서 보면,",
  "이 기사에서 다루고 있는 핵심은"
];

export function ArticleChat({ articleTitle, initialQuestion, onQuestionUsed }: ArticleChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `안녕하세요! "${articleTitle}" 기사에 대해 궁금한 점이 있으시면 언제든 물어보세요. 기사 내용을 바탕으로 자세히 설명해드리겠습니다.`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 초기 질문이 있으면 입력창에 설정
  useEffect(() => {
    if (initialQuestion) {
      setInputValue(initialQuestion);
      if (onQuestionUsed) {
        onQuestionUsed();
      }
    }
  }, [initialQuestion, onQuestionUsed]);

  // 메시지 목록이 업데이트되면 스크롤을 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const randomResponse = mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)];
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `${randomResponse} ${userMessage.content}에 대한 답변은 기사의 내용을 종합해보면, 현재 기술 발전과 사회적 변화의 맥락에서 매우 중요한 의미를 가지고 있습니다. 더 구체적인 질문이 있으시면 언제든 말씀해주세요.`,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card className="flex h-[600px] flex-col rounded-3xl border border-[#dfe3ed] bg-white/95 shadow-[0_28px_52px_rgba(158,168,186,0.22)] backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-xl text-[#1f2937]">
          <Bot className="h-5 w-5 text-[#4c5664]" />
          <span>AI에게 질문하기</span>
        </CardTitle>
        <CardDescription className="text-[#5b6472]">
          기사 내용에 대해 궁금한 점을 AI에게 물어보세요
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={message.sender === 'ai' ? 'border border-[#d7dce7] bg-gradient-to-br from-[#f1f4fa] to-[#e1e6f0] text-[#1f2937]' : 'border border-[#dfe3ed] bg-[#f5f7fb] text-[#4c5664]'}>
                    {message.sender === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-2xl shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-[#eef1f7] via-[#e2e7f1] to-[#d8deeb] text-[#1f2937] shadow-[0_20px_36px_rgba(160,170,190,0.24)]'
                        : 'border border-[#dfe3ed] bg-[#f6f8fb] text-[#1f2937] shadow-[0_16px_28px_rgba(158,168,186,0.2)]'
                    }`}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                  </div>
                  <p className="mt-1 text-xs text-[#8a92a3]">
                    {message.timestamp.toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="border border-[#d7dce7] bg-gradient-to-br from-[#f1f4fa] to-[#e1e6f0] text-[#1f2937]">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="inline-block rounded-2xl border border-[#dfe3ed] bg-[#f6f8fb] p-3 shadow-[0_16px_28px_rgba(158,168,186,0.2)]">
                    <div className="flex items-center space-x-2 text-[#4c5664]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#4c5664]" />
                      <span>AI가 답변을 생각하고 있습니다...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t border-[#dfe3ed] bg-[#f6f8fb] p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="기사에 대해 궁금한 점을 물어보세요..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-[#dfe3ed] bg-white text-[#1f2937] placeholder:text-[#98a1b1] focus:border-[#cdd4e2] focus:ring-[#d8deeb]"
            />
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              className="rounded-xl border border-[#d7dce7] bg-gradient-to-r from-[#f5f7fb] via-[#e7ebf4] to-[#dde2ec] text-[#1f2937] shadow-[0_20px_36px_rgba(160,170,190,0.24)] transition hover:from-[#e9edf5] hover:via-[#e1e6f0] hover:to-[#d8deeb]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
