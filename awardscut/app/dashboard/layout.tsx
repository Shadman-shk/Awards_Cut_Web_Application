import { ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
  metrics?: ReactNode;
  quickActions?: ReactNode;
  recentEvents?: ReactNode;
};

export default function Dashboard({
    children,
    metrics,
    quickActions,
    recentEvents,
}: DashboardLayoutProps) {
    return (
        <div className="dashboard-layout">
            <div className="metrics">{metrics}</div>
            <div className="quick-actions">{quickActions}</div>
            <div className="recent-events">{recentEvents}</div>
            <div className="content">{children}</div>
        </div>
    );
}