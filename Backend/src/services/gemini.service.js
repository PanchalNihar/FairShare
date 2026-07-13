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
