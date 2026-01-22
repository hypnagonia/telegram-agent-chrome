# Telegram Web Assistant

![Demo](img/demo2.jpg)

> **Warning:** This project is not production ready. Use AI wisely and with great care.
>
> **Privacy:** Beware - do not share your private data with third-party APIs without filtering sensitive information and having a clear reason to do so.

> **Data Sharing:** This extension only shares data with the LLM provider you configure. Data is sent only for chats you explicitly choose to index, and only the portions of the dialogue that were visible in the Telegram UI. You can also connect your own self-hosted LLM instance via custom API URL - in this case, no data is shared externally.

A Chrome extension that enhances Telegram Web with AI-powered reply suggestions and private notes.

## Features

- **Smart Reply Hints** - Get contextual reply suggestions based on conversation history
- **Private Notes** - Keep personal notes for each dialogue
- **Conversation Indexing** - Index chat history for intelligent context retrieval
- **Dark/Light Theme** - Seamless theme support

## How It Works

The extension uses [RAG (Retrieval-Augmented Generation)](https://github.com/hypnagonia/rag) with BM25 search to find relevant context from your conversation history. When generating reply hints, it:

1. Extracts messages from the current Telegram Web dialogue
2. Indexes them using BM25 via WebAssembly
3. Retrieves relevant context based on the current conversation
4. Generates contextual reply suggestions using an LLM (DeepSeek, OpenAI, or Claude)

## Installation

1. Clone the repository
2. Run `npm install` and `npm run build`
3. Open `chrome://extensions/` and enable Developer mode
4. Click "Load unpacked" and select the `dist` folder
5. Open [Telegram Web](https://web.telegram.org/k/) and click the extension icon

## Configuration

Open the extension side panel and go to Settings to configure:
- API Provider (DeepSeek, OpenAI, or Claude)
- API Key
- Theme preference
