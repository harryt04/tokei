'use client'

import { Button } from '@/components/ui/button'
import { TimePickerHMS } from './time-picker-hms'
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { toast } from '@/components/ui/use-toast'
import { ThemeSwitcher } from '../custom/themeSwitcher'
import { Timer } from '../custom/timer'

const formSchema = z.object({
  dateTime: z.date(),
})

type FormSchemaType = z.infer<typeof formSchema>

export function DateTimePickerForm() {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(data: FormSchemaType) {
    toast({
      title: 'You submitted the following values:',
      description: (
        <pre>
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form
        className="flex items-end justify-center gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="dateTime"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <ThemeSwitcher />
              <FormLabel className="text-left">DateTime</FormLabel>
              <Timer duration={30} />
              <TimePickerHMS setDate={field.onChange} date={field.value} />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
