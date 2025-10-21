import OpenAI from "openai";
import env from "../config/env.js";

export const openai = new OpenAI({
  apiKey: env.openAiApiKey
});

export const defaultModel = env.openAiModel;
