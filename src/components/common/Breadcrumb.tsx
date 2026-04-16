import { Link } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-1 md:gap-2">
        <li key="crumb__home">
          <Link
            to={ROUTES.dashboard}
            className="inline-flex items-center rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`crumb__${index}__${item.path ?? item.label}`}>
            <div className="flex items-center">
              <ChevronRightIcon className="mx-1 h-4 w-4 text-muted-foreground/60" />
              {item.path ? (
                <Link
                  to={item.path}
                  className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">{item.label}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};
