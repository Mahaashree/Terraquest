import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, Heart, Trees, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const Rewards = () => {
  const [rewards, setRewards] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      loadData(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const loadData = async (userId: string) => {
    // Load rewards
    const { data: rewardsData } = await supabase
      .from("rewards")
      .select("*")
      .eq("active", true)
      .order("points_required", { ascending: true });
    setRewards(rewardsData || []);

    // Load user profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(profileData);

    // Load challenges
    const { data: challengesData } = await supabase
      .from("challenges")
      .select("*")
      .eq("active", true);
    setChallenges(challengesData || []);
  };

  const handleRedeem = (reward: any) => {
    if (!profile) return;

    if (profile.eco_score >= reward.points_required) {
      toast({
        title: "Reward Redeemed! 🎉",
        description: `${reward.name} will be processed with ${reward.partner_ngo}`,
      });
    } else {
      toast({
        title: "Not enough points",
        description: `You need ${reward.points_required - profile.eco_score} more points`,
        variant: "destructive",
      });
    }
  };

  const getRewardIcon = (name: string) => {
    if (name.toLowerCase().includes("tree")) return <Trees className="w-6 h-6" />;
    if (name.toLowerCase().includes("solar")) return <Sun className="w-6 h-6" />;
    if (name.toLowerCase().includes("beach") || name.toLowerCase().includes("ocean")) return <Heart className="w-6 h-6" />;
    return <Gift className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-light via-background to-eco-green/10 pb-20">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="pt-8 pb-4">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-8 h-8 text-primary" />
            Rewards & Challenges
          </h1>
          <p className="text-muted-foreground">Turn your points into real-world impact</p>
        </div>

        {/* User Points */}
        {profile && (
          <Card className="shadow-eco border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-gold">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary">{profile.eco_score} Points</h3>
                    <p className="text-sm text-muted-foreground">Available for redemption</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Challenges */}
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Active Challenges
            </CardTitle>
            <CardDescription>Complete these to earn bonus points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {challenges.map((challenge) => (
              <div 
                key={challenge.id}
                className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-eco-blue/5 border border-primary/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{challenge.icon}</div>
                    <div>
                      <h4 className="font-semibold text-lg">{challenge.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-gold text-lg px-3 py-1">
                    +{challenge.points}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Available Rewards */}
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Available Rewards
            </CardTitle>
            <CardDescription>Redeem your points for real-world impact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rewards.map((reward) => {
              const canRedeem = profile && profile.eco_score >= reward.points_required;
              const progressPercent = profile ? Math.min((profile.eco_score / reward.points_required) * 100, 100) : 0;

              return (
                <Card 
                  key={reward.id}
                  className={`shadow-card ${
                    canRedeem 
                      ? "border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5" 
                      : "border-border"
                  }`}
                >
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                          canRedeem ? "bg-gradient-earth" : "bg-muted"
                        }`}>
                          <div className={canRedeem ? "text-white" : "text-muted-foreground"}>
                            {getRewardIcon(reward.name)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{reward.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {reward.partner_ngo}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {reward.points_required} points
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Progress value={progressPercent} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {profile?.eco_score || 0} / {reward.points_required} points
                        </span>
                        {!canRedeem && (
                          <span>
                            {reward.points_required - (profile?.eco_score || 0)} more needed
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canRedeem}
                      className="w-full"
                      variant={canRedeem ? "default" : "secondary"}
                    >
                      {canRedeem ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Redeem Now
                        </>
                      ) : (
                        "Not Enough Points"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default Rewards;
