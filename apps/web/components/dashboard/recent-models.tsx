import { trpc } from "@/lib/trpc";
import { Clock } from "lucide-react";
import {formatDistanceToNow} from "date-fns";
import { Loading } from "@/components/ui/loading";

export function RecentModels() {
  const { data: models, isLoading, error } = trpc.models.useQuery();
  if (isLoading) return <Loading variant="cards" />;
  if (error) return <div>Error: {error.message}</div>;
  return (
    <div className="space-y-4">
      {models && models?.map((model, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">{model.name}</p>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(model.createdAt), {addSuffix: true})}</span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div
              className={`text-xs px-2 py-1 rounded-full ${
                model.state === "READY"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {model.state}
            </div>
            <p className="text-xs text-muted-foreground">{model.accuracy}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
