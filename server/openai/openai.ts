import OpenAI from "openai";
import {
  COMPLETION_MAX_TOKENS,
  COMPLETION_TEMPERATURE,
  OPENAI_MODEL,
  SYSTEM_PROMPT,
} from "./openai.config.js";

type GeoSuccess = {
  ok: true;
  label: string;
  latitude: number;
  longitude: number;
  message: string;
};

type GeoFail = {
  ok: false;
  message: string;
};

export type GeoResult = GeoSuccess | GeoFail;

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.GITHUB_TOKEN;
  if (!apiKey) {
    throw new Error("Missing GITHUB_TOKEN environment variable");
  }

  openaiClient = new OpenAI({
    baseURL: "https://models.github.ai/inference",
    apiKey,
  });
  return openaiClient;
}

function extractJson(rawText: string): unknown {
  const trimmed = rawText.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}$/);
  const value = jsonMatch ? jsonMatch[0] : trimmed;
  return JSON.parse(value);
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function normalizeResult(parsed: unknown): GeoResult {
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, message: "Invalid response format from AI" };
  }

  const candidate = parsed as {
    ok?: unknown;
    label?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    message?: unknown;
  };

  if (candidate.ok === false) {
    return {
      ok: false,
      message:
        typeof candidate.message === "string"
          ? candidate.message
          : "Request must be about a geographic location.",
    };
  }

  if (
    candidate.ok === true &&
    typeof candidate.label === "string" &&
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number" &&
    typeof candidate.message === "string" &&
    isValidCoordinate(candidate.latitude, candidate.longitude)
  ) {
    return {
      ok: true,
      label: candidate.label,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      message: candidate.message,
    };
  }

  return { ok: false, message: "Invalid or out-of-range coordinates received" };
}

export async function generateResponse(prompt: string, systemInfo?: string): Promise<GeoResult> {
  const userMessage = systemInfo?.trim()
    ? `System information for all responses: ${systemInfo}\n\nUser request: ${prompt}`
    : prompt;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: COMPLETION_TEMPERATURE,
      max_completion_tokens: COMPLETION_MAX_TOKENS,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { ok: false, message: "Empty response from AI" };
    }

    const parsed = extractJson(content);
    return normalizeResult(parsed);
  } catch (error) {
    console.error("Error generating response:", error);
    return { ok: false, message: "Failed to generate response" };
  }
}
