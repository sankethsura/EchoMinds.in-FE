"use client";

export type Tab = "voice" | "phone" | "inbound";

interface TabSwitcherProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "voice", label: "Voice Chat", icon: "🎙" },
  { id: "phone", label: "Outbound Call", icon: "📞" },
  { id: "inbound", label: "Inbound Calls", icon: "📲" },
];

export function TabSwitcher({ active, onChange }: TabSwitcherProps) {
  return (
    <div
      className="flex rounded-xl p-1 gap-1"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: isActive ? "var(--accent)" : "transparent",
              color: isActive ? "#fff" : "var(--text-secondary)",
              boxShadow: isActive ? "0 2px 12px rgba(79,124,255,0.35)" : "none",
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
