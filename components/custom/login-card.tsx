import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

function LoginCard() {
  return (
    <div>
      <Card
        className={cn(
          "flex flex-col items-center justify-center gap-4 p-8 text-center",
        )}>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </Card>
    </div>
  );
}

export { LoginCard };
