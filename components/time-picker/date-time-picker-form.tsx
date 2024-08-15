"use client";

import { Button } from "@/components/ui/button";
import { TimePickerHMS } from "./time-picker-hms";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

import { toast } from "@/components/ui/use-toast";
import { ThemeSwitcher } from "../custom/themeSwitcher";

const formSchema = z.object({
  dateTime: z.date(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export function DateTimePickerForm() {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(data: FormSchemaType) {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre>
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form
        className="flex items-end gap-4 justify-center"
        onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="dateTime"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <ThemeSwitcher />
              <FormLabel className="text-left">DateTime</FormLabel>
              <CountdownCircleTimer
                isPlaying
                duration={10}
                colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
                colorsTime={[10, 7, 3, 0]}>
                {({ remainingTime }) =>
                  remainingTime > 0 ? (
                    <>
                      {Math.floor(remainingTime / 60)}:
                      {Math.ceil(remainingTime % 60)}
                    </>
                  ) : (
                    <>Completed</>
                  )
                }
              </CountdownCircleTimer>
              <TimePickerHMS setDate={field.onChange} date={field.value} />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
