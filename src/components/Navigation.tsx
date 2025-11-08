import { NavLink } from "react-router-dom";
import { Home, Scan, Trophy, Gift, User, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const navItems = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/scan", icon: Scan, label: "Scan" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { to: "/rewards", icon: Gift, label: "Rewards" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 pb-2">
        <div 
          className="flex justify-around items-center h-20 rounded-t-3xl px-4"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.3)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300",
                  isActive
                    ? "text-primary scale-110"
                    : "text-muted-foreground hover:text-foreground hover:scale-105"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isActive 
                      ? "bg-gradient-to-br from-green-400/30 to-green-500/30 backdrop-blur-sm shadow-md border border-white/20" 
                      : "hover:bg-white/10 backdrop-blur-sm"
                  )}>
                    <item.icon className={cn(
                      "w-5 h-5 transition-transform duration-300",
                      isActive && "scale-110"
                    )} />
                  </div>
                  <span className={cn(
                    "text-xs font-semibold transition-all duration-300",
                    isActive && "text-primary"
                  )}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
