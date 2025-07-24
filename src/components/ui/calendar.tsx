
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  disableNavigation?: boolean;
  enabledDays?: number[];
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  disableNavigation = false,
  enabledDays,
  ...props
}: CalendarProps) {
  
  const Head = (props: {
    weekdays: Date[];
    // this component is not exported from react-day-picker
  } & any) => {
    // day of week for es locale is 1 based (1=Mon)
    const weekDays = props.weekdays.map((d: Date) => parseInt(format(d, 'c', {locale: es})));

    // Map JS getDay() to week index.
    // enabledDays uses 0=Sun, 1=Mon, ..., 6=Sat
    // weekStartsOn=1, so Head gets Mon, Tue, ... Sun
    const dayIndexMap = [1, 2, 3, 4, 5, 6, 0]; // Mon -> Sun

    return (
      <thead className={cn(props.className, '[&_tr]:border-b')}>
        <tr className='flex'>
          {weekDays.map((weekDay, i) => {
            return (
              <th
                key={i}
                scope="col"
                className={cn('text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                  {'head_cell_enabled text-primary': enabledDays?.includes(dayIndexMap[i])}
                )}
              >
                {format(props.weekdays[i], 'cccccc', {locale: es})}
              </th>
            );
          })}
        </tr>
      </thead>
    );
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: cn("space-x-1 flex items-center", { "hidden": disableNavigation }),
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Head,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
