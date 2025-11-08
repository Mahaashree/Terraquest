import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, TrendingUp, Award, Calendar, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      loadProfileData(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const loadProfileData = async (userId: string) => {
    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(profileData);

    // Load recent scans with products
    const { data: scansData } = await supabase
      .from("scans")
      .select(`
        *,
        products (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    setRecentScans(scansData || []);
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      navigate("/");
    }
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

  const getAverageSustainability = () => {
    if (recentScans.length === 0) return 0;
    const total = recentScans.reduce((sum, scan) => sum + scan.products.overall_score, 0);
    return Math.round(total / recentScans.length);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-light via-background to-eco-green/10 pb-20">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="pt-8 pb-4">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <User className="w-8 h-8 text-primary" />
            Your Profile
          </h1>
          <p className="text-muted-foreground">Track your sustainability journey</p>
        </div>

        {/* Profile Header */}
        <Card className="shadow-eco border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 bg-gradient-earth">
                <AvatarFallback className="text-3xl font-bold text-white">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground">{profile.display_name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <Badge className="mt-2 bg-gradient-earth text-lg px-4 py-1">
                  {profile.level}
                </Badge>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="border-destructive text-destructive hover:bg-destructive hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total EcoScore</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{profile.eco_score}</div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime points</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products Scanned</CardTitle>
              <Award className="w-4 h-4 text-eco-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-eco-blue">{profile.total_scans}</div>
              <p className="text-xs text-muted-foreground mt-1">Sustainable choices</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Sustainability</CardTitle>
              <Leaf className="w-4 h-4 text-eco-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-eco-gold">{getAverageSustainability()}/100</div>
              <p className="text-xs text-muted-foreground mt-1">Product scores</p>
            </CardContent>
          </Card>
        </div>

        {/* Member Since */}
        <Card className="shadow-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>
                Member since {format(new Date(profile.created_at), "MMMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Scan History */}
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
            <CardDescription>Your recent product scans and sustainability choices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Leaf className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No scans yet. Start scanning products to build your history!</p>
                <Button 
                  onClick={() => navigate("/scan")} 
                  className="mt-4 bg-gradient-earth"
                >
                  Scan Your First Product
                </Button>
              </div>
            ) : (
              recentScans.map((scan) => (
                <div 
                  key={scan.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{scan.products.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={scan.products.overall_score >= 70 ? "default" : "secondary"}
                        className={scan.products.overall_score >= 70 ? "bg-primary" : ""}
                      >
                        Score: {scan.products.overall_score}/100
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(scan.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    +{scan.points_earned}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default Profile;
