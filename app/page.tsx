import { DateTimePickerForm } from "@/components/time-picker/date-time-picker-form";
import { cn } from "@/lib/utils";

export default function Home() {
  const myDate = new Date();
  myDate.setMinutes(0);
  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 py-20 px-10 min-h-screen",
        )}>
        <DateTimePickerForm />
      </div>
    </>
  );
}
