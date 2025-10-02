import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, X, Calendar, MapPin, User, Tag, AlertCircle, SortAsc, SortDesc } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

export interface SearchFilter {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: any;
}

export interface SearchCriteria {
  query: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  hasMore: boolean;
  facets?: Record<string, { value: string; count: number }[]>;
}

interface AdvancedSearchProps<T = any> {
  placeholder?: string;
  filters?: SearchFilter[];
  sortOptions?: { value: string; label: string }[];
  onSearch: (criteria: SearchCriteria) => Promise<SearchResult<T>> | SearchResult<T>;
  onClear?: () => void;
  initialCriteria?: Partial<SearchCriteria>;
  showFacets?: boolean;
  enableSavedSearches?: boolean;
  className?: string;
  debounceMs?: number;
  maxResults?: number;
}

export function AdvancedSearch<T = any>({
  placeholder = "Search...",
  filters = [],
  sortOptions = [],
  onSearch,
  onClear,
  initialCriteria,
  showFacets = false,
  enableSavedSearches = false,
  className = "",
  debounceMs = 300,
  maxResults = 100
}: AdvancedSearchProps<T>) {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    query: '',
    filters: {},
    sortBy: sortOptions[0]?.value,
    sortOrder: 'desc',
    dateRange: { from: null, to: null },
    ...initialCriteria
  });

  const [results, setResults] = useState<SearchResult<T>>({
    items: [],
    total: 0,
    hasMore: false
  });

  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<Array<{
    id: string;
    name: string;
    criteria: SearchCriteria;
    createdAt: Date;
  }>>([]);

  // Load saved searches from localStorage
  useEffect(() => {
    if (enableSavedSearches) {
      try {
        const saved = localStorage.getItem('eeu_saved_searches');
        if (saved) {
          setSavedSearches(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    }
  }, [enableSavedSearches]);

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (searchCriteria: SearchCriteria) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        setIsSearching(true);
        try {
          const result = await onSearch(searchCriteria);
          setResults(result);
        } catch (error) {
          console.error('Search error:', error);
          setResults({ items: [], total: 0, hasMore: false });
        } finally {
          setIsSearching(false);
        }
      }, debounceMs);
    };
  }, [onSearch, debounceMs]);

  // Trigger search when criteria changes
  useEffect(() => {
    if (criteria.query || Object.keys(criteria.filters).length > 0) {
      debouncedSearch(criteria);
    } else {
      setResults({ items: [], total: 0, hasMore: false });
    }
  }, [criteria, debouncedSearch]);

  const updateCriteria = useCallback((updates: Partial<SearchCriteria>) => {
    setCriteria(prev => ({ ...prev, ...updates }));
  }, []);

  const updateFilter = useCallback((filterId: string, value: any) => {
    setCriteria(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterId]: value
      }
    }));
  }, []);

  const clearFilter = useCallback((filterId: string) => {
    setCriteria(prev => {
      const { [filterId]: removed, ...rest } = prev.filters;
      return { ...prev, filters: rest };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setCriteria(prev => ({
      ...prev,
      query: '',
      filters: {},
      dateRange: { from: null, to: null }
    }));
    
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  const saveSearch = useCallback((name: string) => {
    const newSearch = {
      id: `search_${Date.now()}`,
      name,
      criteria,
      createdAt: new Date()
    };

    const updatedSearches = [...savedSearches, newSearch];
    setSavedSearches(updatedSearches);
    
    try {
      localStorage.setItem('eeu_saved_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }, [criteria, savedSearches]);

  const loadSavedSearch = useCallback((searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId);
    if (search) {
      setCriteria(search.criteria);
    }
  }, [savedSearches]);

  const deleteSavedSearch = useCallback((searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updatedSearches);
    
    try {
      localStorage.setItem('eeu_saved_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to delete saved search:', error);
    }
  }, [savedSearches]);

  const getActiveFiltersCount = useMemo(() => {
    return Object.keys(criteria.filters).filter(key => {
      const value = criteria.filters[key];
      return value !== undefined && value !== null && value !== '' && 
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;
  }, [criteria.filters]);

  const renderFilter = (filter: SearchFilter) => {
    const value = criteria.filters[filter.id];

    switch (filter.type) {
      case 'text':
        return (
          <Input
            key={filter.id}
            placeholder={filter.placeholder || filter.label}
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            className="h-9"
          />
        );

      case 'select':
        return (
          <Select
            key={filter.id}
            value={value || ''}
            onValueChange={(val) => updateFilter(filter.id, val)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = value || [];
        return (
          <div key={filter.id} className="space-y-2">
            {filter.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.id}_${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v: string) => v !== option.value);
                    updateFilter(filter.id, newValues);
                  }}
                />
                <Label 
                  htmlFor={`${filter.id}_${option.value}`}
                  className="text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'date':
        return (
          <Popover key={filter.id}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {value ? new Date(value).toLocaleDateString() : filter.placeholder || 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => updateFilter(filter.id, date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'boolean':
        return (
          <div key={filter.id} className="flex items-center space-x-2">
            <Checkbox
              id={filter.id}
              checked={value || false}
              onCheckedChange={(checked) => updateFilter(filter.id, checked)}
            />
            <Label htmlFor={filter.id} className="text-sm font-normal">
              {filter.label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={placeholder}
            value={criteria.query}
            onChange={(e) => updateCriteria({ query: e.target.value })}
            className="pl-10 pr-10"
          />
          {criteria.query && (
            <button
              onClick={() => updateCriteria({ query: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {getActiveFiltersCount > 0 && (
            <Badge className="ml-2 bg-orange-500 text-white text-xs">
              {getActiveFiltersCount}
            </Badge>
          )}
        </Button>

        {sortOptions.length > 0 && (
          <Select
            value={`${criteria.sortBy}_${criteria.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('_');
              updateCriteria({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <React.Fragment key={option.value}>
                  <SelectItem value={`${option.value}_desc`}>
                    <div className="flex items-center">
                      <SortDesc className="h-4 w-4 mr-2" />
                      {option.label} (Newest)
                    </div>
                  </SelectItem>
                  <SelectItem value={`${option.value}_asc`}>
                    <div className="flex items-center">
                      <SortAsc className="h-4 w-4 mr-2" />
                      {option.label} (Oldest)
                    </div>
                  </SelectItem>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        )}

        {(criteria.query || getActiveFiltersCount > 0) && (
          <Button variant="ghost" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {getActiveFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(criteria.filters).map(([filterId, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            
            const filter = filters.find(f => f.id === filterId);
            if (!filter) return null;

            const displayValue = Array.isArray(value) 
              ? value.join(', ') 
              : typeof value === 'boolean' 
                ? filter.label
                : value.toString();

            return (
              <Badge key={filterId} variant="secondary" className="gap-1">
                {filter.label}: {displayValue}
                <button
                  onClick={() => clearFilter(filterId)}
                  className="hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Advanced Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map(filter => (
                <div key={filter.id} className="space-y-2">
                  <Label className="text-sm font-medium">{filter.label}</Label>
                  {renderFilter(filter)}
                </div>
              ))}
            </div>

            {enableSavedSearches && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Saved Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {savedSearches.map(search => (
                      <div key={search.id} className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSavedSearch(search.id)}
                        >
                          {search.name}
                        </Button>
                        <button
                          onClick={() => deleteSavedSearch(search.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const name = prompt('Enter search name:');
                      if (name) saveSearch(name);
                    }}
                  >
                    Save Current Search
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Search Results Summary */}
      {(isSearching || results.total > 0) && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                Searching...
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                Found {results.total} result{results.total !== 1 ? 's' : ''}
                {results.hasMore && ' (showing first ' + Math.min(maxResults, results.items.length) + ')'}
              </>
            )}
          </div>
          
          {showFacets && results.facets && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* Toggle facets */}}
            >
              Show Facets
            </Button>
          )}
        </div>
      )}

      {/* Facets (if enabled) */}
      {showFacets && results.facets && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Refine Results</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(results.facets).map(([facetKey, facetValues]) => (
              <div key={facetKey}>
                <h5 className="text-sm font-medium mb-2 capitalize">
                  {facetKey.replace(/([A-Z])/g, ' $1').trim()}
                </h5>
                <div className="space-y-1">
                  {facetValues.slice(0, 5).map(facet => (
                    <div key={facet.value} className="flex items-center justify-between text-sm">
                      <button
                        onClick={() => updateFilter(facetKey, facet.value)}
                        className="text-left hover:text-orange-500 flex-1"
                      >
                        {facet.value}
                      </button>
                      <span className="text-gray-400">({facet.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}