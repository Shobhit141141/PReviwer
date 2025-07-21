import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Types
type CustomSelectProps<T> = {
    value: T;
    onValueChange: (value: T) => void;
    disabled?: boolean;
    placeholder?: string;
    children: (props: { onSelect: (value: T, label: string) => void; selectedValue: T }) => ReactNode;
    className?: string;
};

type CustomSelectItemProps<T> = {
    value: T;
    onSelect: (value: T, label: string) => void;
    selectedValue: T;
    children: ReactNode;
    icon?: ReactNode;
    className?: string;
};

type StyledNativeSelectProps<T> = {
    value: T;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    disabled?: boolean;
    placeholder?: string;
    children: ReactNode;
    className?: string;
};

// Custom Select Component
const CustomSelect = <T,>({
    value,
    onValueChange,
    disabled,
    placeholder,
    children,
    className = "",
}: CustomSelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: T, optionLabel: string) => {
        setSelectedLabel(optionLabel);
        onValueChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full px-3 py-2 text-left bg-background border border-border rounded-md
                    focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/5'}
                    flex items-center justify-between
                `}
            >
                <span className={`${!value ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>
            
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {children({ onSelect: handleSelect, selectedValue: value })}
                </div>
            )}
        </div>
    );
};

// Custom Select Item Component  
const CustomSelectItem = <T,>({
    value,
    onSelect,
    selectedValue,
    children,
    icon,
    className = "",
}: CustomSelectItemProps<T>) => {
    const isSelected = selectedValue === value;
    
    return (
        <div
            onClick={() => onSelect(value, typeof children === 'string' ? children : String(value))}
            className={`
                px-3 py-2 cursor-pointer flex items-center justify-between
                hover:bg-accent hover:text-accent-foreground
                ${isSelected ? 'bg-accent text-accent-foreground' : ''}
                ${className}
            `}
        >
            <div className="flex items-center gap-2">
                {icon && <span className="w-4 h-4">{icon}</span>}
                <span>{children}</span>
            </div>
            {isSelected && <Check className="h-4 w-4" />}
        </div>
    );
};

// Styled Native Select
const StyledNativeSelect = <T,>({
    value,
    onChange,
    disabled,
    placeholder,
    children,
    className = "",
}: StyledNativeSelectProps<T>) => (
    <div className={`relative ${className}`}>
        <select
            value={value as string}
            onChange={onChange}
            disabled={disabled}
            className={`
                w-full px-3 py-2 pr-10 bg-background border border-border rounded-md
                text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                appearance-none
            `}
        >
            <option value="" disabled className="text-muted-foreground">
                {placeholder}
            </option>
            {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
);

export { CustomSelect, CustomSelectItem, StyledNativeSelect };
