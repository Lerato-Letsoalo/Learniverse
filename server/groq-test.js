import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is missing. Check your .env file.");
    process.exit(1);
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function testGroq() {
    try {
        // First check whether Groq can list available models
        const models = await groq.models.list();

        console.log("Groq connection successful!");
        console.log("Available models:", models.data.length);

        // Now test an actual AI response
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: "Introduce yourself as the Learniverse learning assistant."
                }
            ],
            model: "openai/gpt-oss-20b"
        });

        console.log("\nAI RESPONSE:");
        console.log(response.choices[0].message.content);

    } catch (error) {
        console.error("Groq test failed.");
        console.error("Status:", error.status);
        console.error("Error:", error.message);
        console.error("Details:", error.error);
    }
}

testGroq();