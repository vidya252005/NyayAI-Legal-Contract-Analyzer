import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

export const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export const GEMINI_MODEL = env.GEMINI_MODEL;
export const GEMINI_THINKING_BUDGET = env.GEMINI_THINKING_BUDGET;
