import * as React from "react"
import { cn } from "@/lib/utils"

interface ComboboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  options?: string[];
}

const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  ({ className, options = [], ...props }, ref) => {
    const [showOptions, setShowOptions] = React.useState(false);
    const [filteredOptions, setFilteredOptions] = React.useState(options);

    // Update filtered options when options prop changes
    React.useEffect(() => {
      setFilteredOptions(options);
    }, [options]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (props.onChange) {
        props.onChange(e);
      }
      
      // Filter options based on input
      const filtered = options.filter(option =>
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowOptions(filtered.length > 0 && value.length > 0);
    };

    const handleSelectOption = (option: string) => {
      const event = {
        target: { value: option }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (props.onChange) {
        props.onChange(event);
      }
      setShowOptions(false);
    };

    // Separate trending (first 2 items) from existing items
    const trendingItems = filteredOptions.length > 0 ? filteredOptions.slice(0, 2) : [];
    const existingItems = filteredOptions.length > 2 ? filteredOptions.slice(2) : [];

    return (
      <div className="relative">
        <input
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
          onChange={handleInputChange}
          onFocus={() => setShowOptions(filteredOptions.length > 0)}
          onBlur={() => setTimeout(() => setShowOptions(false), 200)}
        />
        
        {showOptions && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Trending Section */}
            {trendingItems.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 flex items-center gap-1">
                  🔥 Trending
                </div>
                {trendingItems.map((option, index) => {
                  // Remove fire emoji from the option text if it exists
                  const cleanOption = option.replace(/^🔥\s*/, '');
                  return (
                    <div
                      key={`trending-${index}`}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                      onClick={() => handleSelectOption(option)}
                    >
                      <span className="text-lg">🔥</span>
                      <span>{cleanOption}</span>
                    </div>
                  );
                })}
              </>
            )}
            
            {/* Existing Section */}
            {existingItems.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                  Existing
                </div>
                {existingItems.map((option, index) => (
                  <div
                    key={`existing-${index}`}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSelectOption(option)}
                  >
                    {option}
                  </div>
                ))}
              </>
            )}
            
            {filteredOptions.length === 0 && props.value && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Press Enter to create &quot;{props.value}&quot;
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Combobox.displayName = "Combobox";

export { Combobox };

