"use client"

import { useEffect, useState } from "react";
import { Building2, Clock } from "lucide-react"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import "react-circular-progressbar/dist/styles.css"

type CalendarEvent = {
    text: string;
    type: "working" | "holiday";
    color: string;
    category?: string;
};

type RemainingClassDay = {
    date: number;
    weekday: string;
    type: string;
    events?: CalendarEvent[];
    fullDate: Date;
};

export default function PopupCard({ a, setExpandedIdx }) {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
            <div className="bg-gray-100 dark:bg-gray-800 midnight:bg-black rounded-2xl shadow-2xl p-5 w-[90%] max-w-md relative max-h-[90vh] overflow-hidden flex flex-col overflow-y-auto">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedIdx(null)}
                    className="top-2 right-2 absolute cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 midnight:hover:bg-gray-900"
                >
                    <X size={22} className="text-gray-600 dark:text-gray-300 midnight:text-gray-200" />
                </Button>

                <div
                    className="rounded-xl mb-4 transition-all duration-300"
                >
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-2 flex-grow">
                            <div className="p-0">
                                <div className="text-base font-semibold text-gray-800 dark:text-gray-100 midnight:text-gray-100">
                                    {a.courseTitle}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">
                                    {a.slotName}
                                </p>
                            </div>

                            <div className="p-0 text-sm text-gray-600 dark:text-gray-300 midnight:text-gray-300 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Building2 size={16} className="text-gray-500 dark:text-gray-400" />
                                    <span>{a.slotVenue}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                                    <span>{a.time}</span>
                                </div>
                                <p><strong>Faculty:</strong> {a.faculty}</p>
                                <p><strong>Course Code:</strong> {a.courseCode.slice(0, -3)}</p>
                                <p><strong>Credits:</strong> {a.credits}</p>
                                <p>
                                    <strong>Classes Attended:</strong>{" "}
                                    <span className="font-semibold">
                                        {a.attendedClasses}/{a.totalClasses}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="w-24 h-24 flex-shrink-0 flex flex-col items-center justify-center">
                            <CircularProgressbar
                                value={a.attendancePercentage}
                                text={`${a.attendancePercentage}%`}
                                styles={buildStyles({
                                    pathColor:
                                        a.attendancePercentage < 75
                                            ? "#EF4444"
                                            : a.attendancePercentage < 85
                                                ? "#FACC15"
                                                : "#2df04aff",
                                    textColor: "currentColor",
                                    trailColor: "#a3c6f0ff",
                                    strokeLinecap: "round",
                                    pathTransitionDuration: 0.5,
                                })}
                            />
                            <p className="text-center text-xs font-semibold mt-1 text-gray-700 dark:text-gray-300 midnight:text-gray-300">
                                Attendance
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 pr-2 mt-3">
                    <ul className="space-y-2">
                        {a.viewLink?.map((d, i) => {
                            const status = d.status.toLowerCase();

                            const statusClasses =
                                status === "absent"
                                    ? `
                        border-red-400 bg-red-50 text-red-700
                        dark:border-red-700 dark:bg-red-900/30 dark:text-red-300
                        midnight:border-red-800 midnight:bg-red-950/40 midnight:text-red-300
                      `
                                    : status === "present"
                                        ? `
                        border-green-400 bg-green-50 text-green-700
                        dark:border-green-700 dark:bg-green-900/30 dark:text-green-300
                        midnight:border-green-800 midnight:bg-green-950/40 midnight:text-green-300
                      `
                                        : status === "on duty"
                                            ? `
                        border-yellow-400 bg-yellow-50 text-yellow-700
                        dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300
                        midnight:border-yellow-800 midnight:bg-yellow-950/40 midnight:text-yellow-300
                      `
                                            : `
                        border-gray-300 bg-gray-50 text-gray-700
                        dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300
                        midnight:border-gray-700 midnight:bg-black midnight:text-gray-300
                      `;

                            return (
                                <li
                                    key={i}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg border ${statusClasses}`}
                                >
                                    <span className="font-medium">
                                        {d.date}
                                    </span>

                                    <span className="font-semibold uppercase tracking-wide">
                                        {d.status}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

            </div>
        </div>
    );
}

export function countRemainingClasses(courseCode, slotTime, dayCardsMap, calendarMonths, fromDate = new Date()): RemainingClassDay[] | null {
    if (!courseCode || !dayCardsMap || !calendarMonths) return null;

    const daysWithSubject = Object.keys(dayCardsMap).filter(day =>
        dayCardsMap[day].some(c => c.courseCode === courseCode)
    );
    if (daysWithSubject.length === 0) return null;

    const normalizeDay = (d) => d.slice(0, 3).toUpperCase();
    const subjectDays = daysWithSubject.map(normalizeDay);

    const monthNames = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ];

    let startHour = 8, startMinute = 0;
    if (slotTime && slotTime.includes("-")) {
        const [start] = slotTime.split("-");
        const [hRaw, mRaw] = start.split(":");
        let h = Number(hRaw);
        const m = Number(mRaw) || 0;
        if (h >= 8 && h <= 11) {
        } else if (h === 12) {
            h = 12;
        } else if (h >= 1 && h <= 7) {
            h += 12;
        }
        startHour = h;
        startMinute = m;
    }

    const allDays = calendarMonths.flatMap(monthObj => {
        const monthStr = monthObj.month?.toString().toLowerCase() || "";
        const year = monthObj.year || new Date().getFullYear();

        const foundMonth = monthNames.find(m => monthStr.includes(m));
        const mIndex = foundMonth ? monthNames.indexOf(foundMonth) : -1;

        return (monthObj.days || []).map(day => {
            const fullDate = mIndex === -1 ? null : new Date(year, mIndex, day.date);
            const weekday = fullDate
                ? fullDate.toLocaleString("en-US", { weekday: "short" })
                : "";

            return { ...day, fullDate, weekday };
        });
    });

    const remainingWorkingDays = allDays.filter((d) => {
        if (!d || !d.fullDate || isNaN(d.fullDate.getTime())) return false;

        const isWorkingDay =
            d.type?.toLowerCase() === "working" ||
            (d.events?.some(ev =>
                ev.text?.toLowerCase().includes("instructional") ||
                ev.text?.toLowerCase().includes("working")
            ));

        if (!isWorkingDay) return false;

        let effectiveDay = normalizeDay(d.weekday || "");
        if (effectiveDay === "SAT" && Array.isArray(d.events)) {
            const dayOrderMap = {
                "monday": "MON",
                "tuesday": "TUE",
                "wednesday": "WED",
                "thursday": "THU",
                "friday": "FRI",
            };

            const found = d.events.find(ev =>
                /monday|tuesday|wednesday|thursday|friday/i.test(ev.category || ev.text)
            );

            if (found) {
                const match = found.category?.match(/(Monday|Tuesday|Wednesday|Thursday|Friday)/i) ||
                    found.text?.match(/(Monday|Tuesday|Wednesday|Thursday|Friday)/i);
                if (match) effectiveDay = dayOrderMap[match[1].toLowerCase()];
            }
        }

        if (!subjectDays.includes(effectiveDay)) return false;

        const classTime = new Date(d.fullDate);
        classTime.setHours(startHour, startMinute, 0, 0);
        if (classTime < fromDate) return false;

        return true;
    });

    return remainingWorkingDays;
}

function UpcomingClassesList({ classes, attendedClasses = 0, totalClasses = 0 }) {
    const [notAttending, setNotAttending] = useState([]);

    if (!classes || classes.length === 0) {
        return (
            <p className="text-gray-500 dark:text-gray-400 midnight:text-gray-500 text-xs text-center">
                No upcoming classes 🎉
            </p>
        );
    }

    const toggleAttendance = (index) => {
        setNotAttending((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    const upcomingCount: number = classes.length;
    const missedCount: number = notAttending.length;
    const attendCount: number = upcomingCount - missedCount;

    const predictedAttended = attendedClasses + attendCount;
    const predictedTotal = totalClasses + upcomingCount;
    const predictedPercent: number = parseFloat(((predictedAttended / predictedTotal) * 100).toFixed(1));

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium 
                      bg-gray-100 dark:bg-slate-800 midnight:bg-gray-900 
                      px-3 mt-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 midnight:border-gray-800">
                <span className="text-green-600 dark:text-green-400">Attending: <strong>{attendCount}</strong></span>
                <span className="text-red-500 dark:text-red-400">Not Attending: <strong>{missedCount}</strong></span>
                <span
                    className={`font-semibold ${predictedPercent >= 75
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                        }`}
                >
                    Predicted: {predictedPercent}%
                </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-xs">
                {classes.map((day, i) => {
                    const d = new Date(day.fullDate);
                    const dateStr = d.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                    });
                    const weekday = d.toLocaleDateString("en-IN", { weekday: "short" });
                    const isSkipped = notAttending.includes(i);

                    return (
                        <div
                            key={i}
                            onClick={() => toggleAttendance(i)}
                            className={`flex flex-col items-center justify-center 
                          rounded-lg border p-2 shadow-sm 
                          cursor-pointer select-none transform-gpu
                          transition-all duration-200 ease-in-out
                          ${isSkipped
                                    ? "bg-red-100 dark:bg-red-900/40 midnight:bg-red-950 border-red-300 dark:border-red-700 midnight:border-red-800 scale-[0.98]"
                                    : "bg-white dark:bg-slate-900 midnight:bg-gray-950 border-gray-200 dark:border-gray-700 midnight:border-gray-800 hover:scale-[1.02] hover:shadow-md"
                                }`}
                        >
                            <span
                                className={`font-semibold ${isSkipped
                                    ? "text-red-700 dark:text-red-300 midnight:text-red-400"
                                    : "text-gray-800 dark:text-gray-200 midnight:text-gray-200"
                                    }`}
                            >
                                {dateStr}
                            </span>
                            <span
                                className={`text-[10px] ${isSkipped
                                    ? "text-red-500 dark:text-red-400 midnight:text-red-400"
                                    : "text-gray-500 dark:text-gray-400 midnight:text-gray-500"
                                    }`}
                            >
                                {weekday}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}