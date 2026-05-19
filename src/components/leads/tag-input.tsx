'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export function TagInput({ tags, onChange, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions
    .filter((s) => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 5);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  useEffect(() => {
    setShowSuggestions(input.length > 0 && filteredSuggestions.length > 0);
  }, [input, filteredSuggestions.length]);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-background min-h-[40px]">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs gap-1">
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
          className="border-0 p-0 h-auto min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
        />
      </div>

      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-lg">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent"
            >
              <Plus className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
