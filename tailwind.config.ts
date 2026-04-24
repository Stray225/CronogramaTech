import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    // Light shift bg
    "bg-slate-100","bg-green-200","bg-green-100","bg-teal-100",
    "bg-orange-200","bg-amber-200","bg-blue-200","bg-purple-200",
    "bg-pink-200","bg-red-200","bg-violet-200","bg-sky-200","bg-gray-200",
    // Light shift text
    "text-slate-400","text-green-800","text-green-700","text-teal-700",
    "text-orange-800","text-amber-800","text-blue-800","text-purple-800",
    "text-pink-800","text-red-700","text-violet-800","text-sky-800","text-gray-700",
    // Dark shift bg
    "dark:bg-slate-800","dark:bg-green-900","dark:bg-green-950","dark:bg-teal-900",
    "dark:bg-orange-900","dark:bg-amber-900","dark:bg-blue-900","dark:bg-purple-900",
    "dark:bg-pink-900","dark:bg-red-900","dark:bg-violet-900","dark:bg-sky-900",
    // Dark shift text
    "dark:text-slate-500","dark:text-green-300","dark:text-green-400","dark:text-teal-300",
    "dark:text-orange-300","dark:text-amber-300","dark:text-blue-300","dark:text-purple-300",
    "dark:text-pink-300","dark:text-red-300","dark:text-violet-300","dark:text-sky-300",
  ],
};

export default config;
