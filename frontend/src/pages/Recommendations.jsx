import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserRecommendations from "@/components/recommendations/UserRecommendations";
import AuthorityRecommendations from "@/components/recommendations/AuthorityRecommendations";
import { useRecommendations } from "@/hooks/useRecommendations";
import { DEFAULT_CENTER } from "@/data/mockReports";

export default function Recommendations() {
  const navigate = useNavigate();
  const location = useLocation();

  const latitude = location.state?.latitude ?? DEFAULT_CENTER.latitude;
  const longitude = location.state?.longitude ?? DEFAULT_CENTER.longitude;

  const { data, isLoading, isError } = useRecommendations({ latitude, longitude });

  return (
    <div className="mx-auto h-[calc(100dvh-65px)] w-full max-w-lg overflow-y-auto px-4 py-5 md:h-[calc(100dvh-73px)] md:px-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-h2">Recommendations</h1>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading recommendations for this area…</p>}
      {isError && <p className="text-sm text-destructive">Couldn't load recommendations for this area.</p>}

      {data && (
        <Tabs defaultValue="you">
          <TabsList>
            <TabsTrigger value="you">For You</TabsTrigger>
            <TabsTrigger value="authorities">For Authorities</TabsTrigger>
          </TabsList>

          <TabsContent value="you">
            <UserRecommendations recommendations={data.user_recommendations} />
          </TabsContent>

          <TabsContent value="authorities">
            <AuthorityRecommendations recommendations={data.authority_recommendations} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}