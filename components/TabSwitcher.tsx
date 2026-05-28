"use client";

export type Tab = "voice" | "phone" | "inbound";

interface TabSwitcherProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "voice",    label: "Voice Chat" },
  { id: "phone",    label: "Outbound" },
  { id: "inbound",  label: "Inbound" },
];

export function TabSwitcher({ active, onChange }: TabSwitcherProps) {
  return (
    <div
      className="flex rounded-full p-1 gap-0.5"
      style={{
        background: "rgba(255,255,255,0.55)",
        border: "1px solid rgba(220,220,220,0.4)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              background: isActive
                ? "linear-gradient(to bottom, #3a3f5c 0%, #1e2033 100%)"
                : "transparent",
              color: isActive ? "#fff" : "var(--text-secondary)",
              boxShadow: isActive ? "0 2px 10px rgba(30,32,51,0.2), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
              letterSpacing: "0.01em",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
