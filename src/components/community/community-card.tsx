import Link from "next/link";
import { Users, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface CommunityCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  memberCount: number;
  joinType: string;
  price: number | null;
  owner: {
    name: string | null;
    avatarUrl: string | null;
  };
}

export function CommunityCard({ community }: { community: CommunityCardData }) {
  const isPaid = community.joinType === "PAID" || community.joinType === "ONE_TIME";

  return (
    <Link href={`/community/${community.slug}`}>
      <Card className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer">
        <div className="h-24 bg-gradient-to-br from-blue-500 to-indigo-500 relative">
          {community.coverUrl && (
            <img src={community.coverUrl} alt="" className="w-full h-full object-cover" />
          )}
          {isPaid && (
            <Badge className="absolute top-2 right-2 bg-black/60 text-white border-0">
              <Lock className="h-3 w-3 mr-1" />
              유료
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 -mt-7 border-2 border-background shrink-0">
              <AvatarImage src={community.avatarUrl ?? ""} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                {community.name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{community.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                by {community.owner.name ?? "크리에이터"}
              </p>
            </div>
          </div>

          {community.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {community.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {community.memberCount.toLocaleString()}명
            </span>
            {isPaid && community.price && (
              <span className="text-xs font-semibold text-blue-600">
                ₩{community.price.toLocaleString()}/월
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
