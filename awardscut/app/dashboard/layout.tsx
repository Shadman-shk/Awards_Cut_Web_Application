export default function Dashboard({
    children,
    metrics,
    quickActions,
    recentEvents,
}: {
    children: React.ReactNode;
    metrics: React.ReactNode;
    quickActions: React.ReactNode;
    recentEvents: React.ReactNode;
}) {
    return (
        <div className="dashboard-layout">
            <div className="metrics">{metrics}</div>
            <div className="quick-actions">{quickActions}</div>
            <div className="recent-events">{recentEvents}</div>
            <div className="content">{children}</div>
        </div>
    );
}