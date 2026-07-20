import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { ItemStatusBadge } from "@/components/items/ItemStatusBadge";
import { itemConditionLabel, browseCopy } from "@/lib/copy/items";
import { formatRupiah } from "@/lib/utils";
import type { MockItem } from "@/lib/mock/items";

interface ItemCardProps {
  item: MockItem;
  photoUrl?: string;
  href: string;
}

/** Item summary card used on the Browse & Discovery grid. */
export function ItemCard({ item, photoUrl, href }: ItemCardProps) {
  return (
    <Link href={href} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="aspect-4/3 w-full overflow-hidden bg-muted">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- mock placeholder photo, not a real remote asset config
            <img
              src={photoUrl}
              alt={item.name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              Tidak ada foto
            </div>
          )}
        </div>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-medium text-foreground">{item.name}</h3>
            <ItemStatusBadge status={item.status} className="shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground">
            {item.category} &middot; {itemConditionLabel[item.condition]}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatRupiah(item.pricePerDay)}
            <span className="font-normal text-muted-foreground">{browseCopy.perDay}</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
