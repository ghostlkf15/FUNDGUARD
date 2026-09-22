import type { ComponentType, SVGProps } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  Bot,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  Clock,
  Clock3,
  Coins,
  Copy,
  Crown,
  Download,
  DollarSign,
  Eye,
  EyeOff,
  ExternalLink,
  Github,
  Globe2,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  Percent,
  Play,
  RefreshCw,
  Save,
  Search,
  Settings,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Trophy,
  TrendingDown,
  TrendingUp,
  Twitter,
  Unlink,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";

type LucideProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  absoluteStrokeWidth?: boolean;
};

function stub(Alt: ComponentType<LucideProps>): ComponentType<LucideProps> {
  return function PolyfillIcon(props: LucideProps) {
    return <Alt {...props} />;
  };
}

// ============================================================================
// Iconos renombrados / eliminados en lucide-react 0.441+ → stub a alternativos
// ============================================================================
const Award: ComponentType<LucideProps> = stub(Trophy);
const BadgeAlert: ComponentType<LucideProps> = stub(ShieldAlert);
const BadgeCheck: ComponentType<LucideProps> = stub(ShieldCheck);
const Ban: ComponentType<LucideProps> = stub(ShieldAlert);
const CirclePlay: ComponentType<LucideProps> = stub(Play);
const FileCheck2: ComponentType<LucideProps> = stub(ShieldCheck);
const Flame: ComponentType<LucideProps> = stub(Zap);
const Gauge: ComponentType<LucideProps> = stub(Activity);
const Globe: ComponentType<LucideProps> = stub(Globe2);
const Inbox: ComponentType<LucideProps> = stub(Mail);
const Info: ComponentType<LucideProps> = stub(ShieldAlert);
const Languages: ComponentType<LucideProps> = stub(Globe2);
const Layers: ComponentType<LucideProps> = stub(LayoutDashboard);
const Loader: ComponentType<LucideProps> = stub(Loader2);
const LockKeyhole: ComponentType<LucideProps> = stub(Lock);
const Plus: ComponentType<LucideProps> = stub(Check);
const Radio: ComponentType<LucideProps> = stub(Activity);
const Workflow: ComponentType<LucideProps> = stub(LayoutDashboard);
const Cpu: ComponentType<LucideProps> = stub(Bot);

// ============================================================================
// Aliases adicionales usados en el proyecto (compatibilidad con imports)
// ============================================================================
const BarChart3: ComponentType<LucideProps> = stub(Activity);
const LineChart: ComponentType<LucideProps> = stub(Activity);
const Code2: ComponentType<LucideProps> = stub(Terminal);
const UserCircle2: ComponentType<LucideProps> = stub(User);
const CheckCircle2: ComponentType<LucideProps> = stub(BadgeCheck);
const AlertTriangle: ComponentType<LucideProps> = stub(ShieldAlert);
const PlusCircle: ComponentType<LucideProps> = stub(Plus);
const Edit3: ComponentType<LucideProps> = stub(Settings2);
const XCircle: ComponentType<LucideProps> = stub(Ban);
const PlayCircle: ComponentType<LucideProps> = stub(CirclePlay);
const BarChart4: ComponentType<LucideProps> = stub(Activity);
const BarChart: ComponentType<LucideProps> = stub(Activity);
const AlertOctagon: ComponentType<LucideProps> = stub(ShieldAlert);
const Unlink2: ComponentType<LucideProps> = stub(Unlink);

export {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeAlert,
  BadgeCheck,
  Ban,
  Bell,
  BellRing,
  Bot,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  CirclePlay,
  Clock,
  Clock3,
  Coins,
  Copy,
  Crown,
  Cpu,
  Download,
  DollarSign,
  Eye,
  EyeOff,
  ExternalLink,
  FileCheck2,
  Flame,
  Gauge,
  Globe,
  Globe2,
  Github,
  Inbox,
  Info,
  KeyRound,
  Landmark,
  Languages,
  Layers,
  LayoutDashboard,
  Link2,
  Loader,
  Loader2,
  Lock,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Percent,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Search,
  Settings,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Trophy,
  TrendingDown,
  TrendingUp,
  Twitter,
  Unlink,
  User,
  Users,
  Wallet,
  Workflow,
  X,
  Zap,
  BarChart3,
  LineChart,
  Code2,
  UserCircle2,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Edit3,
  XCircle,
  PlayCircle,
  BarChart4,
  BarChart,
  AlertOctagon,
  Unlink2,
};
