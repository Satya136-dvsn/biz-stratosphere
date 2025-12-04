import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format, subMonths, subWeeks, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from "@/lib/utils";

interface DateFilterProps {
  startDate: Date;
  endDate: Date;
  period: 'monthly' | 'weekly' | 'daily';
  selectedCategories?: string[];
  availableCategories?: string[];
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onPeriodChange: (period: 'monthly' | 'weekly' | 'daily') => void;
  onCategoryChange?: (categories: string[]) => void;
}

export function DateFilter({
  startDate,
  endDate,
  period,
  selectedCategories = [],
  availableCategories = [],
  onStartDateChange,
  onEndDateChange,
  onPeriodChange,
  onCategoryChange
}: DateFilterProps) {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const setQuickRange = (range: string) => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (range) {
      case 'last7days':
        start = subDays(now, 7);
        onPeriodChange('daily');
        break;
      case 'last30days':
        start = subDays(now, 30);
        onPeriodChange('daily');
        break;
      case 'last3months':
        start = subMonths(now, 3);
        onPeriodChange('monthly');
        break;
      case 'last6months':
        start = subMonths(now, 6);
        onPeriodChange('monthly');
        break;
      case 'lastyear':
        start = subMonths(now, 12);
        onPeriodChange('monthly');
        break;
      default:
        start = subMonths(now, 6);
    }

    onStartDateChange(start);
    onEndDateChange(end);
  };

  const toggleCategory = (category: string) => {
    if (!onCategoryChange) return;
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const clearCategory = (category: string) => {
    if (!onCategoryChange) return;
    onCategoryChange(selectedCategories.filter(c => c !== category));
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Quick Range Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setQuickRange('last7days')}
              className="text-xs"
            >
              Last 7 Days
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setQuickRange('last30days')}
              className="text-xs"
            >
              Last 30 Days
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setQuickRange('last3months')}
              className="text-xs"
            >
              Last 3 Months
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setQuickRange('last6months')}
              className="text-xs"
            >
              Last 6 Months
            </Button>
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center gap-2">
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[130px] justify-start text-left font-normal text-xs",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      onStartDateChange(date);
                      setStartDateOpen(false);
                    }
                  }}
                  disabled={(date) => date > new Date() || date > endDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground text-sm">to</span>

            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[130px] justify-start text-left font-normal text-xs",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      onEndDateChange(date);
                      setEndDateOpen(false);
                    }
                  }}
                  disabled={(date) => date > new Date() || date < startDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Period Selection */}
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          {/* Categories Filter */}
          {availableCategories.length > 0 && (
            <div className="space-y-2">
              <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Filter className="mr-2 h-3 w-3" />
                    {selectedCategories.length > 0 ? `${selectedCategories.length} categories` : "All categories"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="space-y-2">
                    {availableCategories.map((category) => (
                      <label key={category} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Selected Categories */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedCategories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => clearCategory(category)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}