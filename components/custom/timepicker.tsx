"use client";
import React from "react";
import { Slider } from "@/components/ui/slider";

export type TimePickerProps = {
  min: number;
  max: number;
  step: number;
  startingValue: number;
};

const TimePicker = (props: TimePickerProps) => {
  const { min, max, step, startingValue } = props;
  const [value, setValue] = React.useState(startingValue);
  if (!min || !max || !step || !startingValue) return null;
  return (
    <>
      {/* reasonable sized container defaults */}
      <div className="w-full max-w-xs">
        <Slider
          min={0}
          max={100}
          step={1}
          value={[value]}
          onValueChange={(newValueArray) => {
            setValue(newValueArray[0]);
            console.log("newValueArray[0]: ", newValueArray[0]);
          }}
        />
      </div>
    </>
  );
};

export { TimePicker };
