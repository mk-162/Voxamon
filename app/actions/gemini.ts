'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProcessingConfig } from "@/types";

const MODEL_NAME = 'gemini-2.0-flash';

export async function processTranscript(
    transcript: string,
    config: ProcessingConfig
): Promise<string> {
    if (!transcript.trim()) return '';

    const apiKey = process.env.GOOGLE_API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
        throw new Error("API Key (GOOGLE_API_KEY) not found in environment variables");
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
    You are an expert ghostwriter and editor. 
    Your task is to take a raw voice transcript and process it into a clean, formatted document.

    CRITICAL INSTRUCTIONS:
    1. OUTPUT ONLY THE FINAL CONTENT. 
    2. DO NOT include any preamble like "Here is the summary" or "Sure".
    3. DO NOT output the "Input Transcript" itself.
    4. Apply the requested Format and Tone strictly.
    5. FORMATTING: Use proper markdown with LINE BREAKS. Each bullet point MUST be on its own line with a blank line before the list. Use "- " for bullets, NOT "• ".

    Input Transcript: "${transcript}"

    Configuration:
    - Output Format: ${config.docType}
    - Detail Level: ${config.length}
    - Tone/Style: ${config.style}

    Format Guidelines:
    - SUMMARY: Use markdown bullet points (dash format: "- item"). Each bullet on its own line. No intro paragraph.
    - EMAIL_DRAFT: Subject line, then Body.
    - LINKEDIN_POST: Hook, Body, Hashtags.
    - MEETING_NOTES: Actions, Decisions as bullet lists.

    Tone Guidelines:
    - CONVERSATIONAL: Natural, warm.
    - PROFESSIONAL: Business-appropriate, objective.
    - DIRECT: Concise, no fluff.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || "Failed to generate content.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error(`Gemini API Error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
