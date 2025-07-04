import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbLink {
  label: string;
  to: string;
}

interface BreadcrumbsProps {
  links: BreadcrumbLink[];
  current: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ links, current }) => {
  return (
    <nav className="block md:hidden w-full py-2 px-2 bg-gray-50 border-b border-gray-200 text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 overflow-x-auto">
        <li>
          <Link to="/" className="text-primary font-semibold hover:underline">Home</Link>
        </li>
        {links.map((link, idx) => (
          <React.Fragment key={idx}>
            <span className="mx-1 text-gray-400">/</span>
            <li>
              <Link to={link.to} className="text-primary hover:underline">{link.label}</Link>
            </li>
          </React.Fragment>
        ))}
        <span className="mx-1 text-gray-400">/</span>
        <li className="text-gray-500 font-semibold truncate max-w-[120px]">{current}</li>
      </ol>
    </nav>
  );
};

export default Breadcrumbs; 