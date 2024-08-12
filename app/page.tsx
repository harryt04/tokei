import { TimePicker } from "@/components/custom/timepicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 py-20 px-10 min-h-screen",
        )}>
        <div className="text-6xl">Welcome to tokei</div>
        <div></div>
        <br />
        <Button variant="outline" color="accent">
          shadcn button test
        </Button>
        <TimePicker />
      </div>
    </>
  );
}
