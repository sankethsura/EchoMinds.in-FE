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
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
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
                ? "linear-gradient(135deg, rgba(124,90,246,0.9), rgba(91,61,196,0.9))"
                : "transparent",
              color: isActive ? "#fff" : "var(--text-secondary)",
              boxShadow: isActive ? "0 2px 16px rgba(124,90,246,0.35), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
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
