"use client";

import { useState } from "react";
import { ImagePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Props {
  communityId: string;
  communitySlug: string;
}

export function PostComposer({ communityId, communitySlug }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${communitySlug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, communityId }),
      });
      if (!res.ok) throw new Error();
      setContent("");
      toast.success("게시물이 작성되었습니다!");
      window.location.reload();
    } catch {
      toast.error("게시물 작성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback>나</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="커뮤니티에 공유할 내용을 작성해보세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none border-0 bg-muted/50 focus-visible:ring-0"
            />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ImagePlus className="h-4 w-4 mr-2" />
                사진
              </Button>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
                onClick={handleSubmit}
                disabled={!content.trim() || loading}
              >
                <Send className="h-4 w-4 mr-2" />
                게시
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
