import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, Crown, Star } from "lucide-react";
import bgImage from "@/assets/bg.jpeg";
import bannerImage from "@/assets/banner.jpeg";

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUserId(session.user.id);
      loadLeaderboard(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const loadLeaderboard = async (currentUserId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("eco_score", { ascending: false })
      .limit(50);

    if (data) {
      setLeaders(data);
      const rank = data.findIndex((p) => p.id === currentUserId);
      setCurrentUserRank(rank !== -1 ? rank + 1 : null);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-7 h-7 text-yellow-500 fill-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600 fill-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white";
    if (rank === 2) return "bg-gradient-to-br from-gray-300 to-gray-400 text-white";
    if (rank === 3) return "bg-gradient-to-br from-amber-500 to-amber-600 text-white";
    return "bg-gradient-to-br from-green-100 to-green-200 text-foreground";
  };

  const getRankGradient = (rank: number) => {
    if (rank === 1) return "from-yellow-50 to-yellow-100 border-yellow-200";
    if (rank === 2) return "from-gray-50 to-gray-100 border-gray-200";
    if (rank === 3) return "from-amber-50 to-amber-100 border-amber-200";
    return "from-white to-white border-border";
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const currentUser = leaders.find((l) => l.id === userId);

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Header Section */}
      <div 
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '200px',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 pt-10 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-white" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
              Leaderboard
            </h1>
          </div>
          <p className="text-white/90 text-base md:text-lg drop-shadow-md">Top eco-warriors making a difference</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-4 space-y-6">
        {/* Current User Rank Card */}
        {currentUserRank && currentUser && (
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/95 backdrop-blur-sm rounded-2xl relative overflow-hidden">
            {/* Faint background image */}
            <div 
              className="absolute inset-0 opacity-[0.15] pointer-events-none"
              style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-md">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Your Rank</h3>
                    <p className="text-sm text-muted-foreground">Keep climbing! 🌱</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-2xl font-bold px-6 py-3 rounded-full shadow-lg">
                  #{currentUserRank}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        {leaders.length >= 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground px-2">Top Champions</h2>
            <div className="grid grid-cols-3 gap-3">
              {leaders.slice(0, 3).map((leader, index) => (
                <Card 
                  key={leader.id} 
                  className={`border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br ${getRankGradient(index + 1)} relative overflow-hidden ${
                    index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3"
                  }`}
                >
                  {/* Faint background image */}
                  <div 
                    className="absolute inset-0 opacity-[0.1] pointer-events-none"
                    style={{
                      backgroundImage: `url(${bgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <CardContent className="pt-6 pb-4 text-center space-y-3 relative z-10">
                    <div className="flex justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className={`w-20 h-20 mx-auto ${getRankBadge(index + 1)} shadow-lg`}>
                      <AvatarFallback className="text-xl font-bold">
                        {getInitials(leader.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-lg truncate">{leader.display_name}</p>
                      <p className="text-sm text-muted-foreground mb-2">{leader.level}</p>
                      <Badge className={`${getRankBadge(index + 1)} text-sm px-4 py-1.5 shadow-md`}>
                        {leader.eco_score} pts
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-foreground">All Rankings</h2>
            <Star className="w-5 h-5 text-primary" />
          </div>
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm rounded-2xl relative overflow-hidden">
            {/* Faint background image */}
            <div 
              className="absolute inset-0 opacity-[0.15] pointer-events-none"
              style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <CardHeader className="relative z-10">
              <CardTitle>Complete leaderboard</CardTitle>
              <CardDescription>All eco-champions ranked by their impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 relative z-10">
              {leaders.map((leader, index) => (
                <div
                  key={leader.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    leader.id === userId
                      ? "bg-gradient-to-r from-green-50 to-green-100/50 border-2 border-green-300 shadow-md"
                      : "bg-white/60 hover:bg-white/80 border border-transparent hover:border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className={`w-12 h-12 ${getRankBadge(index + 1)} shadow-sm`}>
                      <AvatarFallback className="font-semibold">
                        {getInitials(leader.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-base">
                        {leader.display_name}
                        {leader.id === userId && (
                          <span className="text-xs text-green-600 ml-2 font-semibold">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{leader.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{leader.eco_score}</p>
                    <p className="text-xs text-muted-foreground">{leader.total_scans} scans</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Leaderboard;
