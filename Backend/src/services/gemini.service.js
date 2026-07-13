import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

let modelInstance = null;

const getModel = () => {
  if (!modelInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }

    // Initialize LangChain's ChatGoogleGenerativeAI
    modelInstance = new ChatGoogleGenerativeAI({
      // We use gemini-3.1-flash-lite since it has a zero-cost free tier and works great for multimodal OCR tasks
      model: "gemini-3.1-flash-lite",
      apiKey: apiKey,
      maxOutputTokens: 2048,
    });
  }
  return modelInstance;
};

/**
 * Sends a base64-encoded receipt image to Gemini via LangChain to extract expense details.
 * @param {string} base64Data - Base64 encoded string of the image (without metadata prefix).
 * @param {string} mimeType - The mime type of the image (e.g. image/jpeg, image/png).
 * @returns {Promise<{merchant: string, amount: number, date: string, category: string}>}
 */
export const scanReceipt = async (base64Data, mimeType) => {
  const model = getModel();

  // Define JSON schema for structured output
  const expenseSchema = {
    type: "object",
    properties: {
      merchant: {
        type: "string",
        description: "The name of the store or merchant where the expense occurred"
      },
      amount: {
        type: "number",
        description: "The final grand total amount paid as a number"
      },
      date: {
        type: "string",
        description: "The date of the receipt in YYYY-MM-DD format"
      },
      category: {
        type: "string",
        enum: ["Food", "Travel", "Shopping", "Entertainment", "Other"],
        description: "The classification of the expense"
      },
    },
    required: ["merchant", "amount", "date", "category"],
  };

  // Bind structured output schema to the model
  const structuredModel = model.withStructuredOutput(expenseSchema);

  const promptText = `Analyze this receipt image. Your goal is to extract key details to pre-fill an expense report: merchant name, total amount, transaction date, and the most matching category.`;

  // Create a multimodal human message using LangChain Message format
  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: promptText,
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`
        }
      },
    ],
  });

  try {
    // Invoke the structured model
    const response = await structuredModel.invoke([message]);
    return response;
  } catch (error) {
    console.error("LangChain Gemini execution failed:", error);
    throw new Error("Could not parse receipt data using LangChain AI.");
  }
};

/**
 * Parses natural language input text to extract structured expense details.
 * @param {string} text - The natural language description input.
 * @param {Array<string>} members - The list of group member names.
 * @returns {Promise<{amount: number, description: string, category: string, payerName: string|null}>}
 */
export const quickAddExpense = async (text, members = []) => {
  const model = getModel();

  const quickAddSchema = {
    type: "object",
    properties: {
      amount: {
        type: "number",
        description: "The total amount of the expense as a number. Extract any digits/numbers representing cost/price."
      },
      description: {
        type: "string",
        description: "A short, clean description of the expense (e.g. 'Groceries', 'Taxi', 'Pizza')."
      },
      category: {
        type: "string",
        enum: ["Food", "Travel", "Shopping", "Entertainment", "Other"],
        description: "The category of the expense based on the context."
      },
      payerName: {
        type: "string",
        description: "The name of the member who paid for the expense. Must be matched as closely as possible to one of the provided group members. Return null or empty if not specified or refers to the user themselves."
      }
    },
    required: ["amount", "description", "category"]
  };

  const structuredModel = model.withStructuredOutput(quickAddSchema);

  const systemPrompt = `You are a financial parsing assistant. Your task is to extract structured expense information from a natural language sentence.
You must choose the payer from the list of group members. If the input sentence uses pronouns like "I", "me", "my", map the payerName to null (which represents the current user).

Available Group Members: ${members.join(", ") || "None"}

Sentence to parse: "${text}"`;

  try {
    const response = await structuredModel.invoke(systemPrompt);
    return response;
  } catch (error) {
    console.error("LangChain Gemini quick add execution failed:", error);
    throw new Error("Could not parse sentence using LangChain AI.");
  }
};
