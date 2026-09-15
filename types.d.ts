// Tipos stub para librerías que no tienen tipos instalados localmente
// (se rellenan cuando `npm install` se ejecuta con éxito y baja sus tipos).

declare module "recharts" {
  export const ResponsiveContainer: any;
  export const AreaChart: any;
  export const Area: any;
  export const LineChart: any;
  export const Line: any;
  export const BarChart: any;
  export const Bar: any;
  export const XAxis: any;
  export const YAxis: any;
  export const CartesianGrid: any;
  export const Tooltip: any;
  export const Legend: any;
  export const Cell: any;
  export const ReferenceLine: any;
}

declare module "zod" {
  const z: any;
  export { z };
}

declare module "tailwind-merge" {
  export function twMerge(...args: any[]): string;
}

declare module "@supabase/ssr" {
  type SchemaLike = any;
  interface CookieOptions {
    name?: string;
    value?: string;
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    priority?: "low" | "medium" | "high";
    partitioned?: boolean;
  }
  export function createBrowserClient<Schema = SchemaLike>(supabaseUrl: string, supabaseAnonKey: string, options?: any): any;
  export function createServerClient<Schema = SchemaLike>(supabaseUrl: string, supabaseAnonKey: string, options?: { cookies: { get: (name: string) => any; set: (name: string, value: string, options: CookieOptions) => void; remove: (name: string, options: CookieOptions) => void; } }): any;
}

declare module "@supabase/supabase-js" {
  export function createClient<Schema = any>(url: string, key: string, options?: any): any;
}

declare module "next-themes" {
  export const ThemeProvider: any;
  export function useTheme(): any;
}

declare module "sonner" {
  export const Toaster: any;
  export const toast: any;
}

declare module "clsx" {
  export type ClassValue = any;
  export function clsx(...args: any[]): string;
  export default clsx;
}

declare module "lucide-react" {
  // Tipos generalizados para evitar errores cuando aún no se instaló la lib.
  export const Crown: any;
  export const CheckCircle2: any;
  export const XCircle: any;
  export const AlertTriangle: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const ChevronDown: any;
  export const ChevronUp: any;
  export const ArrowLeft: any;
  export const ArrowRight: any;
  export const Link2: any;
  export const RefreshCw: any;
  export const Activity: any;
  export const Clock3: any;
  export const Clock: any;
  export const Calendar: any;
  export const Target: any;
  export const Shield: any;
  export const ShieldCheck: any;
  export const TrendingUp: any;
  export const TrendingDown: any;
  export const PlusCircle: any;
  export const Download: any;
  export const Copy: any;
  export const Check: any;
  export const Users: any;
  export const Building2: any;
  export const Landmark: any;
  export const BarChart3: any;
  export const Coins: any;
  export const Wallet: any;
  export const KeyRound: any;
  export const Settings2: any;
  export const Settings: any;
  export const BellRing: any;
  export const Play: any;
  export const PlayCircle: any;
  export const Sparkles: any;
  export const Zap: any;
  export const Lock: any;
  export const Globe2: any;
  export const LineChart: any;
  export const ToggleLeft: any;
  export const ToggleRight: any;
  export const Edit3: any;
  export const Trash2: any;
  export const Search: any;
  export const CircleDollarSign: any;
  export const Currency: any;
  export const Trophy: any;
  export const DollarSign: any;
  export const Percent: any;
  export const LayoutDashboard: any;
  export const LogOut: any;
  export const Bell: any;
  export const UserCircle2: any;
  export const Loader2: any;
  export const ShieldAlert: any;
  export const User: any;
  export const CreditCard: any;
  export const Palette: any;
  export const Eye: any;
  export const EyeOff: any;
  export const Mail: any;
  export const Lock: any;
  export const Github: any;
  export const Twitter: any;
  export const Menu: any;
  export const X: any;
  export const Save: any;
  export const Unlink: any;
  export const Terminal: any;
  export const Code2: any;
  export const Bot: any;
  export const ExternalLink: any;
}
