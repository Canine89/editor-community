"use client"

import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  availableDates?: Date[]
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  availableDates = [],
  placeholder = "날짜를 선택하세요",
  disabled = false
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // 선택 가능한 날짜인지 확인하는 함수
  const isDateAvailable = React.useCallback((checkDate: Date) => {
    if (availableDates.length === 0) return true
    
    return availableDates.some(availableDate => {
      return (
        checkDate.getFullYear() === availableDate.getFullYear() &&
        checkDate.getMonth() === availableDate.getMonth() &&
        checkDate.getDate() === availableDate.getDate()
      )
    })
  }, [availableDates])

  // 비활성화된 날짜 매처
  const disabledMatcher = React.useCallback((checkDate: Date) => {
    return !isDateAvailable(checkDate)
  }, [isDateAvailable])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && isDateAvailable(selectedDate)) {
      onDateChange?.(selectedDate)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "yyyy년 M월 d일", { locale: ko })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={disabledMatcher}
          initialFocus
          locale={ko}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  )
}