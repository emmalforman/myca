"use client";

interface FilterPanelProps {
  industries: string[];
  locations: string[];
  allTags: string[];
  selectedIndustry: string;
  selectedLocation: string;
  selectedTags: string[];
  onIndustryChange: (val: string) => void;
  onLocationChange: (val: string) => void;
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

export default function FilterPanel({
  industries,
  locations,
  allTags,
  selectedIndustry,
  selectedLocation,
  selectedTags,
  onIndustryChange,
  onLocationChange,
  onTagToggle,
  onClearAll,
}: FilterPanelProps) {
  const hasActiveFilters =
    selectedIndustry || selectedLocation || selectedTags.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selectedIndustry}
        onChange={(e) => onIndustryChange(e.target.value)}
        className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">All Industries</option>
        {industries.map((ind) => (
          <option key={ind} value={ind}>
            {ind}
          </option>
        ))}
      </select>

      <select
        value={selectedLocation}
        onChange={(e) => onLocationChange(e.target.value)}
        className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">All Locations</option>
        {locations.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagToggle(tag)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              selectedTags.includes(tag)
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
