import { DateTimePickerForm } from "@/components/time-picker/date-time-picker-form";
import { cn } from "@/lib/utils";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";

export default async function Home() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-4 py-20 px-10 min-h-screen",
          )}>
          <DateTimePickerForm />
        </div>
      </SignedIn>
    </>
  );
}
