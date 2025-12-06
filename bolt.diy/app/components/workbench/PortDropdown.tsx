import { memo, useEffect, useRef } from 'react';
import type { PreviewInfo } from '~/lib/stores/previews';

interface PortDropdownProps {
  activePreviewIndex: number;
  setActivePreviewIndex: (index: number) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (value: boolean) => void;
  setHasSelectedPreview: (value: boolean) => void;
  previews: PreviewInfo[];
}

export const PortDropdown = memo(
  ({
    activePreviewIndex,
    setActivePreviewIndex,
    isDropdownOpen,
    setIsDropdownOpen,
    setHasSelectedPreview,
    previews,
  }: PortDropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // sort previews, preserving original index
    const sortedPreviews = previews
      .map((previewInfo, index) => ({ ...previewInfo, index }))
      .sort((a, b) => a.port - b.port);

    // close dropdown if user clicks outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      };

      if (isDropdownOpen) {
        window.addEventListener('mousedown', handleClickOutside);
      } else {
        window.removeEventListener('mousedown', handleClickOutside);
      }

      return () => {
        window.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isDropdownOpen]);

    return (
      <div className="relative z-port-dropdown" ref={dropdownRef}>
        {/* Display the active port if available, otherwise show the plug icon */}
        <button
          className="flex items-center bg-white hover:bg-white/90 rounded-full px-3 py-1.5 gap-2 border-2 border-white transition-all"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="i-ph:plug text-base text-black"></span>
          {previews.length > 0 && activePreviewIndex >= 0 && activePreviewIndex < previews.length ? (
            <span className="text-xs font-black uppercase tracking-wider text-black">{previews[activePreviewIndex].port}</span>
          ) : null}
        </button>
        {isDropdownOpen && (
          <div className="absolute left-0 mt-2 bg-black border-4 border-white rounded-none shadow-xl min-w-[160px] dropdown-animation">
            <div className="px-4 py-2 border-b-2 border-white text-xs font-black uppercase tracking-wider text-white">
              Ports
            </div>
            {sortedPreviews.map((preview) => (
              <div
                key={preview.port}
                className="flex items-center px-4 py-2.5 cursor-pointer hover:bg-white hover:text-black text-white transition-all"
                onClick={() => {
                  setActivePreviewIndex(preview.index);
                  setIsDropdownOpen(false);
                  setHasSelectedPreview(true);
                }}
              >
                <span className={activePreviewIndex === preview.index ? 'font-black' : 'font-medium'}>
                  {preview.port}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

PortDropdown.displayName = 'PortDropdown';
