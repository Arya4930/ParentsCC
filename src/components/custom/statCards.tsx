"use client";

import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";

export default function StatsCards({
  attendancePercentage,
  marksData,
  setGradesDisplayIsOpen,
}) {
  const [attendancePercentageOrString, setAttendancePercentageOrString] = useState("percentage");
  useEffect(() => {
    const savedAttendancePercentage = localStorage.getItem("attendancePercentageOrString");
    if (savedAttendancePercentage !== null) {
      setAttendancePercentageOrString(savedAttendancePercentage);
    }
  }, [setAttendancePercentageOrString]);

  useEffect(() => {
    localStorage.setItem("attendancePercentageOrString", attendancePercentageOrString);
  }, [attendancePercentageOrString]);


  const cardBase =
    "cursor-pointer p-6 rounded-2xl shadow hover:shadow-lg transition flex-shrink-0 snap-start w-[calc(50%-8px)] md:w-[calc(25%-12px)] flex flex-col items-center justify-center text-center";

  return (
    <div data-scrollable className="overflow-x-auto snap-x snap-mandatory ml-4 mr-4">
      <div className="flex gap-4 py-4 px-2">
        {/* Card 1 */}
        <div
          className={`${cardBase} bg-white dark:bg-slate-800 midnight:bg-black midnight:border midnight:border-gray-800`}
          onClick={() => setAttendancePercentageOrString((prev) => (prev === "percentage" ? "str" : "percentage"))}
        >
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 midnight:text-gray-200">Attendance</h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 midnight:text-gray-100 mt-2">
            {attendancePercentage[attendancePercentageOrString] || 0}
          </p>
        </div>

        {/* Card 3 */}
        {marksData.cgpa && <div
          className={`${cardBase} bg-white dark:bg-slate-800 midnight:bg-black midnight:border midnight:border-gray-800`}
        >
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 midnight:text-gray-200">
            CGPA
          </h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 midnight:text-gray-100 mt-2 select-none">
            {marksData?.cgpa?.cgpa}
          </p>
        </div>
        }

        {/* Card 4 */}
        <div
          className={`${cardBase} bg-white dark:bg-slate-800 midnight:bg-black midnight:border midnight:border-gray-800`}
          onClick={() => setGradesDisplayIsOpen(true)}
        >
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 midnight:text-gray-200">Credits Earned</h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 midnight:text-gray-100 mt-2">
            {Number(marksData?.cgpa?.creditsEarned) + Number(marksData?.cgpa?.nonGradedRequirement || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
