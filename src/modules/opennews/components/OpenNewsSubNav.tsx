import { NavLink } from "react-router-dom";

const items = [
  { label: "Latest", to: "/opennews/latest" },
  { label: "Investigations", to: "/opennews/investigations" },
  { label: "Anonymous Reports", to: "/opennews/anonymous-reports" },
  { label: "Verified Journalists", to: "/opennews/verified-journalists" },
  { label: "Debate Arena", to: "/opennews/debate-arena" },
  { label: "Political Tracker", to: "/opennews/political-tracker" },
];

export function OpenNewsSubNav() {
  return (
    <div className="overflow-x-auto border-b border-border/60 bg-card/60 backdrop-blur">
      <div className="container mx-auto max-w-6xl px-4">
        <nav className="flex items-center gap-2 py-2 min-w-max">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
