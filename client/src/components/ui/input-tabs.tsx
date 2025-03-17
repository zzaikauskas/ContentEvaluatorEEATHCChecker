import { InputTab } from "@/lib/types";

interface InputTabsProps {
  activeTab: InputTab;
  setActiveTab: (tab: InputTab) => void;
}

export function InputTabs({ activeTab, setActiveTab }: InputTabsProps) {
  return (
    <div className="flex border-b border-slate-200 mb-4">
      <button
        type="button"
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === "text"
            ? "border-b-2 border-primary -mb-px text-primary"
            : "text-neutral-500 hover:text-neutral-700"
        }`}
        onClick={() => setActiveTab("text")}
      >
        Direct Text
      </button>
      <button
        type="button"
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === "file"
            ? "border-b-2 border-primary -mb-px text-primary"
            : "text-neutral-500 hover:text-neutral-700"
        }`}
        onClick={() => setActiveTab("file")}
      >
        File Upload
      </button>
      <button
        type="button"
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === "url"
            ? "border-b-2 border-primary -mb-px text-primary"
            : "text-neutral-500 hover:text-neutral-700"
        }`}
        onClick={() => setActiveTab("url")}
      >
        URL
      </button>
    </div>
  );
}
