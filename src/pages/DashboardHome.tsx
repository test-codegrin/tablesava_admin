import { Icon, ICONS } from "../config/icons";

export default function DashboardHome() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-orange-50 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
            <Icon icon={ICONS.rocketLaunch} width={40} className="text-orange-500" />
          </div>
        </div>
        
        <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-orange-400 animate-ping" />
        <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-orange-500" />
      </div>

      

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-zinc-800 tracking-tight">Coming Soon</h2>
        <p className="text-zinc-400 text-sm max-w-sm">
          <span className="font-medium text-orange-600">Dashboard</span> is under development.
          We're working hard to bring this feature to you!
        </p>
        
       
      </div>
    </div>
  );
}