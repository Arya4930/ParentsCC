'use client';
import { useState, useEffect } from "react";
import { ReloadModal } from "./reloadModel";
import LoginForm from "./loginForm";
import DashboardContent from "./Dashboard";
import Footer from "./footer/Footer";
import { solveCaptchaClient } from "@/lib/solveCaptcha";
import config from '../../app/config.json'
import { attendanceRes, ODListItem, ODListRaw } from "@/types/data/attendance";
import { AllGradesRes } from "@/types/data/allgrades";

export const API_BASE = "https://uniccapi3.aryaslocalserver.online";

export default function LoginPage() {
  // --- State Management ---
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<attendanceRes | null>({});
  const [marksData, setMarksData] = useState<object>({});
  const [GradesData, setGradesData] = useState<object>({});
  const [AllGradesData, setAllGradesData] = useState<AllGradesRes>({});
  const [Calender, setCalender] = useState<object>({});
  const [activeDay, setActiveDay] = useState<string>("");
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("attendance");
  const [attendancePercentage, setattendancePercentage] = useState<object>({});
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [GradesDisplayIsOpen, setGradesDisplayIsOpen] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<string>("marks");
  const [HostelActiveSubTab, setHostelActiveSubTab] = useState<string>("mess");
  const [activeAttendanceSubTab, setActiveAttendanceSubTab] = useState<string>("attendance");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [calendarType, setCalenderType] = useState<string | null>(null)
  const [progressBar, setProgressBar] = useState<number>(0);
  const [currSemesterID, setCurrSemesterID] = useState<string>(config.semesterIDs[config.semesterIDs.length - 2]);
  const [isAPIworking, setIsAPIworking] = useState<boolean>(false);

  useEffect(() => {
    const day = new Date().toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    setActiveDay(day);

    const checkAPIStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status`);
        const data = await res.json();
        setIsAPIworking(data.text === "API is working" ? false : true);
      } catch (err) {
        setIsAPIworking(true);
      }
    }
    checkAPIStatus();
  }, []);

  function setAttendanceAndOD(attendance: attendanceRes): void {
    setAttendanceData(attendance);
    let totalClass = 0;
    let attendedClasses = 0;
    attendance.attendance?.forEach(course => {
      totalClass += course.totalClasses || 0;
      attendedClasses += course.attendedClasses || 0;
    });
    setattendancePercentage({ "percentage": Math.round(attendedClasses * 10000 / totalClass) / 100, "str": `${attendedClasses}/${totalClass}` });
  }

  // --- Effects ---
  useEffect(() => {
    const storedAttendance = localStorage.getItem("attendance");
    const storedMarks = localStorage.getItem("marks");
    const storedGrades = localStorage.getItem("grades");
    const storedAllGrades = localStorage.getItem("allGrades");
    const storedUsername = localStorage.getItem("username");
    const storedPassword = localStorage.getItem("password");
    const calendar = localStorage.getItem("calender");
    const calendarType = localStorage.getItem("calendarType");
    const storedCurrSemesterID = localStorage.getItem("currSemesterID");

    const parsedStoredAttendance: attendanceRes | null = storedAttendance ? JSON.parse(storedAttendance) : null;
    if (parsedStoredAttendance && parsedStoredAttendance.attendance) {
      setAttendanceAndOD(parsedStoredAttendance);
    }
    if (storedMarks) setMarksData(JSON.parse(storedMarks));
    if (storedUsername) setUsername(storedUsername);
    if (storedPassword) setPassword(storedPassword);
    if (storedGrades) setGradesData(JSON.parse(storedGrades));
    if (storedAllGrades) setAllGradesData(JSON.parse(storedAllGrades));
    if (calendar) setCalender(JSON.parse(calendar));
    if (calendarType) setCalenderType(calendarType);
    if (storedCurrSemesterID) setCurrSemesterID(storedCurrSemesterID);
    setIsLoggedIn((storedUsername && storedPassword) ? true : false);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const loginToVTOP = async (retry = false) => {
    try {
      setProgressBar(10);
      setMessage("Logging in and fetching data...");

      const captchaRes = await fetch(`${API_BASE}/api/captcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const { captchaBase64, cookies, csrf, error } = await captchaRes.json();
      if (error) throw new Error("Failed to get CAPTCHA: " + error);

      const captcha = await solveCaptchaClient(captchaBase64);

      const loginRes = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          captcha,
          cookies,
          csrf,
        }),
      });

      const data = await loginRes.json();

      if (data.message?.includes("Invalid Captcha") && !retry) {
        console.warn("Invalid Captcha. Retrying once...");
        return await loginToVTOP(true);
      }

      if (!data.success || !data.dashboardHtml)
        throw new Error(data.message || "Login failed.");

      setMessage((prev) => prev + "\n✅ Login successful");
      setProgressBar((prev) => prev + 30);

      return {
        cookies: data.cookies,
        dashboardHtml: data.dashboardHtml,
      };
    } catch (err: any) {
      throw err;
    }
  };

  const handleLogin = async (currSemesterID = config.semesterIDs[config.semesterIDs.length - 2]) => {
    try {
      const { cookies, dashboardHtml } = await loginToVTOP();
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);

      const [
        attRes,
        marksRes,
        gradesRes,
        calenderRes,
        allGradesRes
      ] = await Promise.all([
        fetch(`${API_BASE}/api/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookies: cookies, dashboardHtml: dashboardHtml, semesterId: currSemesterID }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ Attendance fetched");
          setProgressBar(prev => prev + 10);
          return j;
        }),

        fetch(`${API_BASE}/api/marks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookies: cookies, dashboardHtml: dashboardHtml, semesterId: currSemesterID }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ Marks fetched");
          setProgressBar(prev => prev + 5);
          return j;
        }),

        fetch(`${API_BASE}/api/grades`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookies: cookies, dashboardHtml: dashboardHtml, semesterId: currSemesterID }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ Grades fetched");
          setProgressBar(prev => prev + 5);
          return j;
        }),

        fetch(`${API_BASE}/api/calendar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cookies: cookies,
            dashboardHtml: dashboardHtml,
            type: calendarType || "ALL",
            semesterId: currSemesterID
          }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ Calendar fetched");
          setProgressBar(prev => prev + 5);
          return j;
        }),
        fetch(`${API_BASE}/api/all-grades`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookies: cookies, dashboardHtml: dashboardHtml }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ All grades fetched");
          setProgressBar(prev => prev + 10);
          return j;
        }),
      ]);

      setMessage(prev => prev + "\nFinalizing and saving data...");

      setAttendanceAndOD(attRes);
      setMarksData(marksRes);
      setGradesData(gradesRes);
      setAllGradesData(allGradesRes);
      setCalender(calenderRes);

      localStorage.setItem("attendance", JSON.stringify(attRes));
      localStorage.setItem("marks", JSON.stringify(marksRes));
      localStorage.setItem("grades", JSON.stringify(gradesRes));
      localStorage.setItem("allGrades", JSON.stringify(allGradesRes));
      localStorage.setItem("calender", JSON.stringify(calenderRes));

      setMessage(prev => prev + "\n✅ All data loaded successfully!");
      setProgressBar(100);
      setIsLoggedIn(true);
      setIsReloading(false);
      return true;
    } catch (err) {
      console.error(err);
      setMessage(prev => prev + "\n❌ Login failed, check console.");
      setProgressBar(0);
      throw err;
    }
  };

  // --- Event Handlers ---
  const handleReloadRequest = async (currSemesterID = config.semesterIDs[config.semesterIDs.length - 2]) => {
    setIsReloading(true);
    try {
      const { cookies, dashboardHtml } = await loginToVTOP();
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);

      const [
        attRes,
        marksRes,
        gradesRes,
        calenderRes,
        allGradesRes
      ] = await Promise.all([
        fetch(`${API_BASE}/api/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookies: cookies, dashboardHtml: dashboardHtml, semesterId: currSemesterID }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ Attendance fetched");
          setProgressBar(prev => prev + 10);
          return j;
        }),

        fetch(`${API_BASE}/api/marks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookies: cookies, dashboardHtml: dashboardHtml, semesterId: currSemesterID }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ Marks fetched");
          setProgressBar(prev => prev + 5);
          return j;
        }),

        fetch(`${API_BASE}/api/grades`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookies: cookies, dashboardHtml: dashboardHtml, semesterId: currSemesterID }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ Grades fetched");
          setProgressBar(prev => prev + 5);
          return j;
        }),

        fetch(`${API_BASE}/api/calendar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cookies: cookies,
            dashboardHtml: dashboardHtml,
            type: calendarType || "ALL",
            semesterId: currSemesterID
          }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ Calendar fetched");
          setProgressBar(prev => prev + 5);
          return j;
        }),
        fetch(`${API_BASE}/api/all-grades`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookies: cookies, dashboardHtml: dashboardHtml }),
        }).then(async r => {
          const j = await r.json();
          setMessage(prev => prev + "\n✅ All grades fetched");
          setProgressBar(prev => prev + 10);
          return j;
        }),
      ]);

      setMessage(prev => prev + "\nFinalizing and saving data...");

      setAttendanceAndOD(attRes);
      setMarksData(marksRes);
      setGradesData(gradesRes);
      setAllGradesData(allGradesRes);
      setCalender(calenderRes);

      localStorage.setItem("attendance", JSON.stringify(attRes));
      localStorage.setItem("marks", JSON.stringify(marksRes));
      localStorage.setItem("grades", JSON.stringify(gradesRes));
      localStorage.setItem("allGrades", JSON.stringify(allGradesRes));
      localStorage.setItem("calender", JSON.stringify(calenderRes));

      setMessage(prev => prev + "\n✅ All data loaded successfully!");
      setProgressBar(100);
      setIsLoggedIn(true);
      setIsReloading(false);
    } catch (err) {
      console.error(err);
      setMessage(prev => prev + "\n❌ Login failed, check console.");
      setProgressBar(0);
    }
  };

  const handleLogOutRequest = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");

    const keysToKeep = ["theme"];

    const saved: Record<string, string | null> = {};
    keysToKeep.forEach((key) => {
      saved[key] = localStorage.getItem(key);
    });

    localStorage.clear();

    keysToKeep.forEach((key) => {
      if (saved[key] !== null) {
        localStorage.setItem(key, saved[key]!);
      }
    });

    setAttendanceData({});
    setMarksData({});
    setGradesData({});
    setMessage("");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      return alert("Please fill all the fields!");
    }
    handleLogin();
  };

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 midnight:bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-gray-500"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 midnight:bg-black flex flex-col text-gray-900 dark:text-gray-100 midnight:text-gray-100 transition-colors">
      {isAPIworking && !isOffline && (
        <div className="top-0 left-0 w-full bg-yellow-500 text-black text-center py-2 font-medium z-[9999] shadow-md">
          ⚠️ Unable to connect to API services. Please check back later. ⚠️
        </div>
      )}
      {isReloading && (
        <ReloadModal
          message={message}
          onClose={() => setIsReloading(false)}
          progressBar={progressBar}
        />
      )}

      {!isLoggedIn && (
        <div className="flex-grow flex items-center justify-center p-4">
          <LoginForm
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            message={message}
            handleFormSubmit={handleFormSubmit}
            progressBar={progressBar}
          />
        </div>
      )}

      {isLoggedIn && (
        <>
          {isOffline && <div className="top-0 left-0 w-full bg-yellow-500 text-black text-center py-2 font-medium z-[9999] shadow-md">
            ⚠️ You’re currently offline. Some features may not work.
          </div>}
          <DashboardContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleLogOutRequest={handleLogOutRequest}
            handleReloadRequest={handleReloadRequest}
            GradesData={GradesData}
            allGradesData={AllGradesData}
            attendancePercentage={attendancePercentage}
            GradesDisplayIsOpen={GradesDisplayIsOpen}
            setGradesDisplayIsOpen={setGradesDisplayIsOpen}
            attendanceData={attendanceData}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            marksData={marksData}
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            activeAttendanceSubTab={activeAttendanceSubTab}
            setActiveAttendanceSubTab={setActiveAttendanceSubTab}
            calendarData={Calender}
            calendarType={calendarType}
            setIsReloading={setIsReloading}
            currSemesterID={currSemesterID}
            setCurrSemesterID={setCurrSemesterID}
            handleLogin={handleLogin}
          />
        </>
      )}

      <Footer isLoggedIn={isLoggedIn} />
    </div>
  );
}
