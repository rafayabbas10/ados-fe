import * as React from "react"
import { cn } from "@/lib/utils"

interface ComboboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  options?: string[];
}

const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  ({ className, options = [], ...props }, ref) => {
    const [showOptions, setShowOptions] = React.useState(false);
    const [filteredOptions, setFilteredOptions] = React.useState(options);

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
            {filteredOptions.map((option, index) => (
              <div
                key={index}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelectOption(option)}
              >
                {option}
              </div>
            ))}
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

