// app/components/ProjectProgressBar.tsx
import React from "react";

export interface ProjectProgressBarProps {
 current: number; // timmar förbrukat
 max: number;   // budget timmar
}
const getBarColor = (percent: number) => {
 if (percent < 70) return "bg-primary-500 hover:bg-primary-600";
 if (percent < 100) return "bg-primary-500 hover:bg-primary-600";
 return "bg-primary-500 hover:bg-primary-600";
};

const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({ current, max }) => {
 const percent = Math.round((current / max) * 100);
 return (
  <div className="w-full mb-2">
   <div className="flex justify-between text-xs font-medium mb-1">
    <span>{current} h</span>
    <span>{percent}%</span>
    <span>{max} h</span>
   </div>
   <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
    <div
     className={`h-4 rounded-full transition-all duration-700 ${getBarColor(percent)}`}
     style={{ width: `${Math.min(percent, 100)}%` }}
    ></div>
   </div>
   {percent >= 100 && (
    <div className="text-red-500 text-xs mt-1">🔴 Överstiger budget!</div>
   )}
  </div>
 );
};
export default ProjectProgressBar;

