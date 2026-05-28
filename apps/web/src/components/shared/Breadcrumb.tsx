import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-text-subtitle">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {last || !item.href ? (
                <span className="font-medium text-brand">{item.label}</span>
              ) : (
                <Link href={item.href} className="text-brand underline-offset-2 hover:underline">
                  {item.label}
                </Link>
              )}
              {!last && <span className="text-border-default">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
