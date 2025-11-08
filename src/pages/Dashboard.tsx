import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Leaf, TrendingUp, Target, Award, Sparkles, Trophy, Search, ArrowRight, Users, MessageSquare, CheckCircle2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import bannerImage from "@/assets/banner.jpeg";
import bgImage from "@/assets/bg.jpeg";
import landscapeImage from "@/assets/山水疑无路_春日国风背景素材分享 - 小红书.jpeg";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      loadDashboardData(session.user.id);
    };
    checkAuth();
  }, [navigate, location.pathname]); // Refresh when location changes

  useEffect(() => {
    // Refresh data when page becomes visible (e.g., when navigating back from scan)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const refreshData = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log("Refreshing dashboard data...");
            loadDashboardData(session.user.id);
          }
        };
        refreshData();
      }
    };
    
    // Also refresh on focus
    const handleFocus = () => {
      const refreshData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("Window focused, refreshing dashboard data...");
          loadDashboardData(session.user.id);
        }
      };
      refreshData();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadDashboardData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (profileError) {
        console.error("Error loading profile:", profileError);
        toast({
          title: "Error loading profile",
          description: profileError.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Profile loaded:", profileData);
      setProfile(profileData);

      // Load recent scans
      const { data: scansData } = await supabase
        .from("scans")
        .select(`
          *,
          products (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentScans(scansData || []);

      // Load scan history for line chart (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: historyData } = await supabase
        .from("scans")
        .select(`
          *,
          products (*)
        `)
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });
      
      // Group by date for line chart
      const groupedByDate: { [key: string]: number } = {};
      (historyData || []).forEach((scan) => {
        const date = new Date(scan.created_at);
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        groupedByDate[dateKey] = (groupedByDate[dateKey] || 0) + (scan.points_earned || 0);
      });
      
      // Create array for chart
      const lineChartData = Object.entries(groupedByDate).map(([date, points]) => ({
        date,
        points,
      }));
      
      // Fill in missing days
      const filledData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = lineChartData.find(d => d.date === dateKey);
        filledData.push(existing || { date: dateKey, points: 0 });
      }
      
      setScanHistory(filledData);


      // Load challenges
      const { data: challengesData } = await supabase
        .from("challenges")
        .select("*")
        .eq("active", true)
        .limit(3);
      setChallenges(challengesData || []);

      // Load leaderboard to get user's rank
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, eco_score")
        .order("eco_score", { ascending: false });
      
      if (allProfiles) {
        setTotalUsers(allProfiles.length);
        const rank = allProfiles.findIndex((p) => p.id === userId) + 1;
        setUserRank(rank > 0 ? rank : null);
      }
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelProgress = (ecoScore: number) => {
    const levels = [
      { name: "Eco Rookie", min: 0, max: 500 },
      { name: "Green Explorer", min: 500, max: 1000 },
      { name: "Eco Guardian", min: 1000, max: 2000 },
      { name: "Green Champion", min: 2000, max: 5000 },
      { name: "Earth Hero", min: 5000, max: Infinity },
    ];

    const currentLevel = levels.find((l) => ecoScore >= l.min && ecoScore < l.max) || levels[0];
    const progress = currentLevel.max === Infinity 
      ? 100 
      : ((ecoScore - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

    return { currentLevel: currentLevel.name, progress, nextLevel: levels[levels.findIndex(l => l.name === currentLevel.name) + 1]?.name };
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { currentLevel, progress, nextLevel } = getLevelProgress(profile.eco_score);


  // Prepare pie chart data based on product scores
  const preparePieChartData = () => {
    if (!recentScans || recentScans.length === 0) {
      return [
        { name: "High Score", value: 0, color: "hsl(142, 76%, 36%)" },
        { name: "Medium Score", value: 0, color: "hsl(48, 96%, 53%)" },
        { name: "Low Score", value: 0, color: "hsl(0, 84%, 60%)" },
      ];
    }

    let highScore = 0;
    let mediumScore = 0;
    let lowScore = 0;

    recentScans.forEach((scan) => {
      const score = scan.products?.overall_score || 0;
      if (score >= 70) {
        highScore += scan.points_earned || 0;
      } else if (score >= 40) {
        mediumScore += scan.points_earned || 0;
      } else {
        lowScore += scan.points_earned || 0;
      }
    });

    return [
      { name: "High Score (70+)", value: highScore, color: "hsl(142, 76%, 36%)" },
      { name: "Medium Score (40-69)", value: mediumScore, color: "hsl(48, 96%, 53%)" },
      { name: "Low Score (<40)", value: lowScore, color: "hsl(0, 84%, 60%)" },
    ].filter(item => item.value > 0);
  };

  const pieChartData = preparePieChartData();

  const chartConfig = {
    high: {
      label: "High Score",
      color: "hsl(142, 76%, 36%)",
    },
    medium: {
      label: "Medium Score",
      color: "hsl(48, 96%, 53%)",
    },
    low: {
      label: "Low Score",
      color: "hsl(0, 84%, 60%)",
    },
    points: {
      label: "Points",
      color: "hsl(142, 76%, 46%)",
    },
  };

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Banner Header */}
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
        <div className="relative max-w-7xl mx-auto px-4 pt-10 pb-16">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
                {getTimeBasedGreeting()}, {profile.display_name || "Eco Warrior"}! 👋
              </h1>
              <p className="text-white/90 text-base md:text-lg drop-shadow-md">Continue your sustainability journey</p>
            </div>
            <div className="flex items-center gap-3">
              {userRank && (
                <div 
                  onClick={() => navigate("/leaderboard")}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-white/30 cursor-pointer hover:bg-white/30 transition-all"
                >
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span className="text-white font-bold text-sm">#{userRank}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-3 shadow-lg border border-white/30">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <span className="text-green-600 font-bold text-base">{profile.eco_score}</span>
                </div>
                <span className="text-white font-semibold text-base">pts</span>
              </div>
            </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 -mt-4 space-y-6">
        {/* Search Bar - Floating */}
        <div className="relative z-10">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 border-green-100 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm shadow-lg"
            />
          </div>
        </div>


        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Left Column - Takes 2 columns */}
          <div className="md:col-span-2 space-y-4">
            {/* My Progress Section */}
            <div>
              <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xl font-bold text-foreground">My Progress</h3>
                <button className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  SEE ALL <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative bg-gradient-to-br from-green-100 via-green-50 to-green-200 p-6 rounded-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-300/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-5xl mb-3">🌱</div>
                      <h4 className="text-2xl font-bold text-foreground mb-2">Agricultural Land</h4>
                      <p className="text-sm text-muted-foreground mb-5">2 of 6 Chapters</p>
                      <div className="flex items-center gap-5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span className="font-medium">6 tasks</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg">
                          <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                          <span className="font-medium">8 comments</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-green-600" />
                          <span className="font-medium">+3 participants</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-7xl opacity-20 ml-4">🌿</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Active Challenges - Inside left column */}
            {challenges.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-foreground px-2 mb-4">Active Challenges</h3>
                <div className="space-y-3">
                  {challenges.map((challenge, index) => (
                    <Card 
                      key={challenge.id} 
                      className="border-0 shadow-md hover:shadow-lg transition-all bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden relative"
                    >
                      {/* Faint background image */}
                      <div 
                        className="absolute inset-0 opacity-[0.25] pointer-events-none"
                        style={{
                          backgroundImage: `url(${bgImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                      <CardContent className="p-5 relative z-10">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-5xl flex-shrink-0">{challenge.icon || "🎯"}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg text-foreground mb-1">{challenge.title}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>
                            </div>
                          </div>
                          <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white text-base px-5 py-2.5 rounded-full shadow-md flex-shrink-0">
                            +{challenge.points} pts
                          </Badge>
                        </div>
            </CardContent>
          </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Charts - Takes 1 column */}
          <div className="space-y-4">
            {/* Pie Chart */}
            <div>
              <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xl font-bold text-foreground">Score Distribution</h3>
                <Target className="w-5 h-5 text-primary" />
              </div>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/95 backdrop-blur-sm rounded-2xl relative overflow-hidden">
                {/* Faint background image */}
                <div 
                  className="absolute inset-0 opacity-[0.25] pointer-events-none"
                  style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <CardHeader className="pb-2 pt-4 px-4 relative z-10">
                  <CardTitle className="text-base">Points by Score</CardTitle>
                  <CardDescription className="text-xs">Recent scans breakdown</CardDescription>
            </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 relative z-10">
                  {pieChartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[180px]">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          outerRadius={65}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value: any, name: any) => [
                            `${value} pts`,
                            pieChartData.find(d => d.value === value)?.name || name
                          ]}
                        />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                      <p>No scan data yet</p>
                    </div>
                  )}
            </CardContent>
          </Card>
            </div>

            {/* Line Chart - Daily Points */}
            <div>
              <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xl font-bold text-foreground">Daily Points</h3>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/95 backdrop-blur-sm rounded-2xl relative overflow-hidden">
                {/* Faint background image */}
                <div 
                  className="absolute inset-0 opacity-[0.25] pointer-events-none"
                  style={{
                    backgroundImage: `url(${landscapeImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <CardHeader className="pb-2 pt-4 px-4 relative z-10">
                  <CardTitle className="text-base">Last 7 Days</CardTitle>
                  <CardDescription className="text-xs">Points earned per day</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 relative z-10">
                  {scanHistory && scanHistory.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[160px]">
                      <LineChart data={scanHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 9 }}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          tick={{ fontSize: 9 }}
                          className="text-muted-foreground"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="points"
                          stroke="hsl(142, 76%, 46%)"
                          strokeWidth={2}
                          dot={{ fill: "hsl(142, 76%, 46%)", r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
                      <p>No data yet</p>
                    </div>
                  )}
            </CardContent>
          </Card>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 pt-2">
            <Button 
              onClick={() => navigate("/scan")} 
              className="h-28 text-base bg-gradient-to-br from-green-500 via-green-400 to-green-500 hover:from-green-600 hover:via-green-500 hover:to-green-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-3xl border border-green-300/20 relative overflow-hidden group"
              size="lg"
            >
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 opacity-50"></div>
              <div className="flex flex-col items-center gap-2.5 relative z-10">
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="font-semibold">Scan Product</span>
              </div>
            </Button>
            <Button 
              onClick={() => navigate("/leaderboard")} 
              className="h-28 text-base bg-gradient-to-br from-blue-500 via-blue-400 to-blue-500 hover:from-blue-600 hover:via-blue-500 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-3xl border border-blue-300/20 relative overflow-hidden group"
              size="lg"
            >
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 opacity-50"></div>
              <div className="flex flex-col items-center gap-2.5 relative z-10">
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="font-semibold">Leaderboard</span>
              </div>
            </Button>
        </div>

        {/* Recent Activity */}
        {recentScans.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xl font-bold text-foreground px-2">Recent Scans</h3>
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <Card 
                  key={scan.id} 
                  className="border-0 shadow-md hover:shadow-lg transition-all bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-4xl flex-shrink-0">
                          {scan.products?.overall_score >= 70 ? "🌿" : "🌱"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg text-foreground mb-1">{scan.products?.name || "Product"}</h4>
                    <p className="text-sm text-muted-foreground">
                            Score: {scan.products?.overall_score || 0}/100
                    </p>
                        </div>
                  </div>
                  <Badge 
                        className={`text-base px-5 py-2.5 rounded-full shadow-md flex-shrink-0 ${
                          scan.products?.overall_score >= 70 
                            ? "bg-gradient-to-r from-green-400 to-green-500 text-white" 
                            : "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                        }`}
                      >
                        +{scan.points_earned || 0} pts
                  </Badge>
                </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;
