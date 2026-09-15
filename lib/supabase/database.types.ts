export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: { Row: any; Insert: any; Update: any };
      firms: { Row: any; Insert: any; Update: any };
      firm_presets: { Row: any; Insert: any; Update: any };
      challenges: { Row: any; Insert: any; Update: any };
      equity_snapshots: { Row: any; Insert: any; Update: any };
      trades: { Row: any; Insert: any; Update: any };
      rule_events: { Row: any; Insert: any; Update: any };
      notifications: { Row: any; Insert: any; Update: any };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      market_type: "forex" | "futures" | "crypto";
      challenge_status:
        | "draft"
        | "linking"
        | "active"
        | "approved"
        | "failed"
        | "disconnected"
        | "phase_changed";
      drawdown_type: "static" | "trailing";
      rule_event_type:
        | "approved"
        | "failed_max_dd"
        | "failed_daily_dd"
        | "failed_special"
        | "alert_daily_dd"
        | "alert_max_dd"
        | "phase_change"
        | "disconnected"
        | "reconnected";
      notification_channel: "email" | "in_app" | "push" | "sms";
      account_link_method: "ea_mt4" | "ea_mt5" | "cbot" | "crypto_api" | "manual";
    };
  };
}
