import { useId, useState, useEffect } from "react";
import { SidebarInput } from "@/components/ui/sidebar";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { RiSearch2Line } from "@remixicon/react";
import { UserRoles } from "@/types/types";

interface SearchFormProps extends React.ComponentProps<"form"> {
  userRole?: string;
  onSearch?: (searchTerm: string) => void;
  navItems?: any[];
}

export function SearchForm({
  userRole,
  onSearch,
  navItems,
  ...props
}: SearchFormProps) {
  const id = useId();
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Determine if search bar should be visible based on user role
  useEffect(() => {
    if (
      userRole === UserRoles.ADMIN ||
      userRole === UserRoles.MANAGER ||
      userRole?.includes(UserRoles.ADMIN) ||
      userRole?.includes(UserRoles.MANAGER)
    ) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [userRole]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  if (!isVisible) {
    return null; // Don't render the search bar for regular users
  }

  return (
    <form {...props} onSubmit={handleSubmit}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <div className="relative">
            <SidebarInput
              id={id}
              className="ps-9 pe-9"
              aria-label="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search menu..."
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/60 peer-disabled:opacity-50">
              <RiSearch2Line size={20} aria-hidden="true" />
            </div>
            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground">
              <kbd className="inline-flex size-5 max-h-full items-center justify-center rounded bg-input px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                /
              </kbd>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
