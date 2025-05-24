import React from 'react';

// TODO: Extend this component to support:
// - Highlighting multiple search terms with different colors
// - Add animation to newly matched terms
// - Add option for fuzzy matching for better UX
// These would make the search even more powerful - Likhitha

// NOTES:
// I initially tried to use a library for text highlighting but found that:
// 1. Most were too heavyweight for this simple use case
// 2. They didn't handle partial matching the way we wanted
// 3. Building custom gave us better control over styling and animations
// My custom implementation is lightweight and performs well even on longer texts
// - Likhitha (May 22)

interface HighlightedTextProps {
  text: string;
  searchQuery: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, searchQuery }) => {
  if (!text || !searchQuery || !searchQuery.trim()) {
    return <>{text}</>;
  }

  // Escape special regex characters to avoid errors with certain search terms
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Split text into parts - matched and unmatched
  const parts = text.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));

  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <span key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

export default HighlightedText;