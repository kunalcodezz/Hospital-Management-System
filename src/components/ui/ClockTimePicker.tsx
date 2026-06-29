import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { Clock } from "lucide-react";

interface ClockTimePickerProps {
  value: string; // "HH:MM" in 24h format
  onChange: (time: string) => void;
  label?: string;
  placeholder?: string;
}

type Phase = "hour" | "minute";

export function ClockTimePicker({ value, onChange, label, placeholder = "Select time" }: ClockTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("hour");
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isPM, setIsPM] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 260 });

  // Parse incoming value
  useEffect(() => {
    if (value) {
      const match = value.match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        setSelectedMinute(m);
        if (h >= 12) {
          setIsPM(true);
          setSelectedHour(h === 12 ? 12 : h - 12);
        } else {
          setIsPM(false);
          setSelectedHour(h === 0 ? 12 : h);
        }
      }
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Compute popover position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const popoverHeight = 420; // approximate height
      let top: number;
      if (spaceBelow >= popoverHeight + 8) {
        top = rect.bottom + 8;
      } else {
        top = Math.max(8, rect.top - popoverHeight - 8);
      }
      setPopoverPos({
        top,
        left: rect.left,
        width: Math.max(rect.width, 260),
      });
    }
  }, [isOpen]);

  const emitValue = useCallback((h: number, m: number, pm: boolean) => {
    let hour24 = h;
    if (pm && h !== 12) hour24 = h + 12;
    if (!pm && h === 12) hour24 = 0;
    const hh = hour24.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    onChange(`${hh}:${mm}`);
  }, [onChange]);

  const getAngleFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!clockRef.current) return 0;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const angle = Math.atan2(clientX - cx, -(clientY - cy));
    return ((angle * 180) / Math.PI + 360) % 360;
  }, []);

  const handleClockInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const angle = getAngleFromEvent(e);

    if (phase === "hour") {
      let hour = Math.round(angle / 30);
      if (hour === 0) hour = 12;
      setSelectedHour(hour);
      emitValue(hour, selectedMinute, isPM);
    } else {
      let minute = Math.round(angle / 6);
      if (minute === 60) minute = 0;
      // Snap to 5-minute increments
      minute = Math.round(minute / 5) * 5;
      if (minute === 60) minute = 0;
      setSelectedMinute(minute);
      emitValue(selectedHour, minute, isPM);
    }
  }, [phase, selectedHour, selectedMinute, isPM, getAngleFromEvent, emitValue]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleClockInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleClockInteraction(e);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (phase === "hour") {
        setPhase("minute");
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleClockInteraction(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleClockInteraction(e);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      if (phase === "hour") {
        setPhase("minute");
      }
    }
  };

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    emitValue(hour, selectedMinute, isPM);
    setTimeout(() => setPhase("minute"), 200);
  };

  const handleMinuteClick = (minute: number) => {
    setSelectedMinute(minute);
    emitValue(selectedHour, minute, isPM);
  };

  const toggleAMPM = (pm: boolean) => {
    setIsPM(pm);
    emitValue(selectedHour, selectedMinute, pm);
  };

  const confirmAndClose = () => {
    emitValue(selectedHour, selectedMinute, isPM);
    setIsOpen(false);
    setPhase("hour");
  };

  // Clock hand angle
  const handAngle = phase === "hour"
    ? (selectedHour % 12) * 30
    : selectedMinute * 6;

  // Hand length
  const handLength = phase === "hour" ? 60 : 72;

  // Formatted display
  const displayHour = selectedHour.toString().padStart(2, "0");
  const displayMinute = selectedMinute.toString().padStart(2, "0");

  // Clock geometry
  const clockRadius = 90;
  const numberRadius = phase === "hour" ? 70 : 72;

  return (
    <div className="relative" ref={containerRef}>
      {/* Input trigger */}
      <div
        ref={triggerRef}
        onClick={() => { setIsOpen(!isOpen); setPhase("hour"); }}
        className="w-full h-11 px-4 rounded-xl border border-border bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent flex items-center gap-2 cursor-pointer select-none hover:border-accent/50 transition-colors"
      >
        <Clock size={16} className="text-muted-foreground shrink-0" />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? `${displayHour}:${displayMinute} ${isPM ? "PM" : "AM"}` : placeholder}
        </span>
      </div>

      {/* Clock Popover — rendered via portal to escape overflow containers */}
      {isOpen && ReactDOM.createPortal(
        <div
          ref={popoverRef}
          className="fixed bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ top: popoverPos.top, left: popoverPos.left, width: popoverPos.width, zIndex: 99999 }}
        >
          {/* Digital display header */}
          <div className="bg-gradient-to-r from-accent to-accent/80 px-5 py-4 flex items-center justify-between">
            <div className="flex items-baseline gap-0.5">
              <button
                type="button"
                onClick={() => setPhase("hour")}
                className={`text-3xl font-mono font-bold transition-all ${
                  phase === "hour" ? "text-white" : "text-white/40"
                }`}
              >
                {displayHour}
              </button>
              <span className="text-3xl font-mono font-bold text-white/60">:</span>
              <button
                type="button"
                onClick={() => setPhase("minute")}
                className={`text-3xl font-mono font-bold transition-all ${
                  phase === "minute" ? "text-white" : "text-white/40"
                }`}
              >
                {displayMinute}
              </button>
            </div>

            {/* AM/PM toggle */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => toggleAMPM(false)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                  !isPM ? "bg-white/25 text-white" : "text-white/40 hover:text-white/60"
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => toggleAMPM(true)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                  isPM ? "bg-white/25 text-white" : "text-white/40 hover:text-white/60"
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Clock face */}
          <div className="flex justify-center py-5 px-4">
            <div
              ref={clockRef}
              className="relative rounded-full bg-muted/50 border border-border/50"
              style={{ width: clockRadius * 2, height: clockRadius * 2 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { if (isDragging) handleMouseUp(); }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Center dot */}
              <div
                className="absolute w-3 h-3 bg-accent rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                }}
              />

              {/* Clock hand */}
              <div
                className="absolute origin-bottom"
                style={{
                  left: "50%",
                  bottom: "50%",
                  width: "2px",
                  height: `${handLength}px`,
                  backgroundColor: "var(--color-accent, #6366f1)",
                  transform: `translateX(-50%) rotate(${handAngle}deg)`,
                  transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  zIndex: 5,
                  borderRadius: "1px",
                }}
              />

              {/* Selection dot at end of hand */}
              <div
                className="absolute w-8 h-8 rounded-full bg-accent flex items-center justify-center"
                style={{
                  left: `calc(50% + ${handLength * Math.sin((handAngle * Math.PI) / 180)}px)`,
                  top: `calc(50% - ${handLength * Math.cos((handAngle * Math.PI) / 180)}px)`,
                  transform: "translate(-50%, -50%)",
                  transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  zIndex: 6,
                }}
              />

              {/* Hour numbers or minute markers */}
              {phase === "hour"
                ? Array.from({ length: 12 }, (_, i) => {
                    const hour = i + 1;
                    const angle = (hour * 30 * Math.PI) / 180;
                    const x = clockRadius + numberRadius * Math.sin(angle);
                    const y = clockRadius - numberRadius * Math.cos(angle);
                    const isSelected = selectedHour === hour;

                    return (
                      <button
                        type="button"
                        key={hour}
                        onClick={(e) => { e.stopPropagation(); handleHourClick(hour); }}
                        className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all select-none ${
                          isSelected
                            ? "text-white"
                            : "text-foreground hover:bg-accent/10"
                        }`}
                        style={{
                          left: x,
                          top: y,
                          transform: "translate(-50%, -50%)",
                          zIndex: 7,
                        }}
                      >
                        {hour}
                      </button>
                    );
                  })
                : Array.from({ length: 12 }, (_, i) => {
                    const minute = i * 5;
                    const angle = (minute * 6 * Math.PI) / 180;
                    const x = clockRadius + numberRadius * Math.sin(angle);
                    const y = clockRadius - numberRadius * Math.cos(angle);
                    const isSelected = selectedMinute === minute;

                    return (
                      <button
                        type="button"
                        key={minute}
                        onClick={(e) => { e.stopPropagation(); handleMinuteClick(minute); }}
                        className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all select-none ${
                          isSelected
                            ? "text-white"
                            : "text-foreground hover:bg-accent/10"
                        }`}
                        style={{
                          left: x,
                          top: y,
                          transform: "translate(-50%, -50%)",
                          zIndex: 7,
                        }}
                      >
                        {minute.toString().padStart(2, "0")}
                      </button>
                    );
                  })}

              {/* SVG tick marks */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={clockRadius * 2}
                height={clockRadius * 2}
              >
                {Array.from({ length: 60 }, (_, i) => {
                  const angle = (i * 6 * Math.PI) / 180;
                  const isMajor = i % 5 === 0;
                  const outerR = clockRadius - 4;
                  const innerR = isMajor ? clockRadius - 12 : clockRadius - 8;
                  const x1 = clockRadius + outerR * Math.sin(angle);
                  const y1 = clockRadius - outerR * Math.cos(angle);
                  const x2 = clockRadius + innerR * Math.sin(angle);
                  const y2 = clockRadius - innerR * Math.cos(angle);
                  return (
                    <line
                      key={`tick-${i}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className="stroke-border"
                      strokeWidth={isMajor ? 1.5 : 0.5}
                      strokeOpacity={isMajor ? 0.6 : 0.25}
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 flex justify-between items-center">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">
              {phase === "hour" ? "Select hour" : "Select minutes"}
            </p>
            <div className="flex gap-2">
              {phase === "minute" && (
                <button
                  type="button"
                  onClick={() => setPhase("hour")}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={confirmAndClose}
                className="text-xs font-bold text-accent hover:text-accent/80 transition-colors px-3 py-1.5 bg-accent/10 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ClockTimePicker;
