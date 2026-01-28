/** 
 * @file utils.js
 * @brief Utils for the application
 * 
 * @exports cn - Merge classes
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
/**
 * Merge classes
 * @param {...string} inputs - Classes to merge
 * @returns {string} - Merged classes
 */
  return twMerge(clsx(inputs));
}
