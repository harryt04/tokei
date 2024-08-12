"use client";
import "./time-picker.css";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const TimePicker = () => {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);

  return (
    <div className="tokei-timer-container">
      <div>
        <Input
          type="number"
          value={Number(hours).toString()}
          onChange={(e) => {
            const newValue = Math.abs(Number(e.target.value || 0));
            setHours(newValue);
          }}
        />
        <span>Hours</span>
      </div>
      <div>
        <Input
          type="number"
          value={Number(minutes).toString()}
          onChange={(e) => {
            const newValue = Math.abs(Number(e.target.value || 0));
            setMinutes(newValue);
          }}
        />
        <span>Minutes</span>
      </div>
      <div>
        <Input
          type="number"
          value={Number(seconds).toString()}
          onChange={(e) => {
            const newValue = Math.abs(Number(e.target.value || 0));
            setSeconds(newValue);
          }}
        />
        <span>Seconds</span>
      </div>
    </div>
  );
};

export { TimePicker };
