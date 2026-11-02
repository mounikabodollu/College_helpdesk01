import path from "path";
import { fileURLToPath } from "url";

import { TextLoader } from "@langchain/community/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

import { getMongoClient } from "../config/database.config.js";
import { getEmbeddings } from "../config/embedding.config.js";

// __dirname replacement for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/*
|--------------------------------------------------------------------------
| Initialize Knowledge Base
|--------------------------------------------------------------------------
*/

export const initializeKnowledgeBase = async () => {
    try {
        console.log("Initializing knowledge base...");

        const client = await getMongoClient();

        const db = client.db("edureach_db");
        const collection = db.collection("knowledge_docs");

        /*
        |--------------------------------------------------------------------------
        | Check whether embeddings already exist
        |--------------------------------------------------------------------------
        */

        const existingDoc = await collection.findOne({
            embedding: {
                $exists: true,
                $type: "array",
            },
        });

        if (
            existingDoc &&
            Array.isArray(existingDoc.embedding) &&
            existingDoc.embedding.length > 0
        ) {
            const count = await collection.countDocuments();

            console.log(
                `Knowledge base ready (${count} chunks with embeddings)`
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Delete old/incomplete documents
        |--------------------------------------------------------------------------
        */

        console.log("No valid embeddings found.");
        console.log("Clearing old knowledge-base chunks...");

        await collection.deleteMany({});

        /*
        |--------------------------------------------------------------------------
        | Initialize embedding model
        |--------------------------------------------------------------------------
        */

        console.log("Initializing embedding model...");

        const embeddings = getEmbeddings();

        /*
        |--------------------------------------------------------------------------
        | Test embedding API
        |--------------------------------------------------------------------------
        */

        console.log("Testing embedding API...");

        let testResult;

        try {
            testResult = await embeddings.embedQuery("test");
        } catch (error) {
            console.error("Embedding API test failed.");
            console.error("Error:", error.message || error);

            throw new Error(
                "Embedding API is not working. Check your API key and embedding configuration."
            );
        }

        if (!testResult || !Array.isArray(testResult)) {
            throw new Error("Embedding API returned an invalid vector.");
        }

        console.log(
            `Embedding API working successfully. Dimensions: ${testResult.length}`
        );

        /*
        |--------------------------------------------------------------------------
        | Load knowledge-base file
        |--------------------------------------------------------------------------
        */

        const filePath = path.join(
            __dirname,
            "../../knowledge-base/edureach-knowledge.txt"
        );

        console.log("Loading knowledge base:");
        console.log(filePath);

        const loader = new TextLoader(filePath);

        const docs = await loader.load();

        if (!docs || docs.length === 0) {
            throw new Error(
                "No documents found in edureach-knowledge.txt"
            );
        }

        const totalCharacters = docs.reduce(
            (sum, doc) => sum + doc.pageContent.length,
            0
        );

        console.log(
            `Knowledge base loaded: ${totalCharacters} characters`
        );

        /*
        |--------------------------------------------------------------------------
        | Split documents into chunks
        |--------------------------------------------------------------------------
        */

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const allSplits = await splitter.splitDocuments(docs);

        if (!allSplits || allSplits.length === 0) {
            throw new Error(
                "Document splitting produced zero chunks."
            );
        }

        console.log(
            `Knowledge base split into ${allSplits.length} chunks`
        );

        /*
        |--------------------------------------------------------------------------
        | Create MongoDB Atlas Vector Store
        |--------------------------------------------------------------------------
        */

        const vectorStore = new MongoDBAtlasVectorSearch(
            embeddings,
            {
                collection,
                indexName: "edureach_vector_index",
                textKey: "text",
                embeddingKey: "embedding",
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Generate embeddings and store documents
        |--------------------------------------------------------------------------
        */

        console.log("Generating embeddings and storing documents...");

        await vectorStore.addDocuments(allSplits);

        /*
        |--------------------------------------------------------------------------
        | Verify embeddings
        |--------------------------------------------------------------------------
        */

        const verifyDoc = await collection.findOne({
            embedding: {
                $exists: true,
                $type: "array",
            },
        });

        if (
            !verifyDoc ||
            !Array.isArray(verifyDoc.embedding) ||
            verifyDoc.embedding.length === 0
        ) {
            await collection.deleteMany({});

            throw new Error(
                "Embeddings were not stored correctly."
            );
        }

        console.log(
            `${allSplits.length} chunks successfully stored.`
        );

        console.log(
            `Embedding dimensions: ${verifyDoc.embedding.length}`
        );

        console.log(
            "IMPORTANT: MongoDB Atlas Vector Search index must use the same number of dimensions."
        );

        console.log("Knowledge base initialization completed.");
    } catch (error) {
        console.error(
            "Knowledge base initialization failed:"
        );

        console.error(error.message || error);

        throw error;
    }
};