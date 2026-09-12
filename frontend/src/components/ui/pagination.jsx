import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ className, ...props }) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={`mx-auto flex w-full justify-center ${className || ''}`}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={`flex flex-row items-center gap-1 ${className || ''}`}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={className || ''} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  onClick,
  href = '#',
  disabled,
  children,
  ...props
}) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    href={href}
    onClick={(e) => {
      e.preventDefault();
      if (!disabled && onClick) onClick(e);
    }}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-bold transition-colors ${
      disabled
        ? 'opacity-40 cursor-not-allowed text-gray-400 bg-gray-50 border border-gray-200'
        : isActive
        ? 'bg-red-600 text-white shadow-xs hover:bg-red-700 cursor-pointer'
        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer'
    } h-8 min-w-[32px] px-2.5 ${className || ''}`}
    {...props}
  >
    {children}
  </a>
);
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({ className, disabled, onClick, ...props }) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    disabled={disabled}
    onClick={onClick}
    className={`gap-1 pl-2.5 text-xs font-bold ${className || ''}`}
    {...props}
  >
    <ChevronLeft className="h-3.5 w-3.5" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({ className, disabled, onClick, ...props }) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    disabled={disabled}
    onClick={onClick}
    className={`gap-1 pr-2.5 text-xs font-bold ${className || ''}`}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-3.5 w-3.5" />
  </PaginationLink>
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({ className, ...props }) => (
  <span
    aria-hidden
    className={`flex h-8 w-8 items-center justify-center text-gray-400 ${className || ''}`}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
