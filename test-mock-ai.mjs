/**
 * Local OpenAI-compatible stub for testing the test-paper generator without
 * spending real tokens (or when the real key has no credits).
 *
 *   node test-mock-ai.mjs              # listens on 127.0.0.1:9898
 *   AI_BASE_URL=http://127.0.0.1:9898/v1 npm start
 *
 * It reads the question count / mark total out of the prompt, replies with a
 * matching paper wrapped in markdown fences (the real parser must strip them),
 * and deliberately leaves the last question without a marking guide so the
 * "warnings" path is exercised too.
 */

import http from "node:http";

const PORT = Number(process.env.MOCK_AI_PORT || 9898);

function buildPaper(systemPrompt, userPrompt) {
  const count = Number((systemPrompt.match(/exactly (\d+) questions/) || [])[1] || 6);
  const marks = Number((systemPrompt.match(/totalling about (\d+) marks/) || [])[1] || 30);

  // "Question mix: 2 multiple choice, 3 short answer, …" — honour the order
  // the API asks for, so papers come back sectioned like a real one.
  const LABEL_TO_TYPE = {
    "multiple choice": "mcq",
    "true / false": "truefalse",
    "fill in the blank": "fill",
    "short answer": "short",
    structured: "structured",
    "extended response": "essay",
  };
  const mixLine = (userPrompt.match(/Question mix: (.*)/) || [])[1] || "";
  const plan = [];
  for (const part of mixLine.split(",")) {
    const m = part.trim().match(/^(\d+) (.+)$/);
    if (!m) continue;
    const type = LABEL_TO_TYPE[m[2].trim()];
    if (type) plan.push({ type, count: Number(m[1]) });
  }
  if (!plan.length) plan.push({ type: "mcq", count }, { type: "short", count });

  const total = plan.reduce((sum, p) => sum + p.count, 0) || 1;
  const base = Math.max(1, Math.floor(marks / total));
  const questions = [];
  for (const { type, count } of plan) {
    for (let i = 0; i < count; i += 1) {
      questions.push({
        type,
        marks: base,
        text: `${questions.length + 1}. ${
          type === "mcq"
            ? "Which statement about water conservation is correct?"
            : "Explain one way of saving water described in the notes."
        }`,
        ...(type === "mcq"
          ? { options: ["Fixing leaking taps", "Leaving taps running", "Wasting clean water", "Ignoring drips"] }
          : {}),
        answer:
          type === "mcq" ? "Fixing leaking taps" : "Any one sensible way from the notes.",
      });
    }
  }

  // Pad the last question so the marks add up to what was asked for…
  const written = questions.reduce((sum, q) => sum + q.marks, 0);
  if (questions.length && marks - written > 0) questions[questions.length - 1].marks += marks - written;
  // …then deliberately drop the final marking guide so the API warns about it.
  if (questions.length) delete questions[questions.length - 1].answer;

  return {
    title: "Grade 4 Water Conservation Paper (mock)",
    instructions: "Answer all questions. Show your working where required.",
    questions,
  };
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || !req.url.includes("/chat/completions")) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
    return;
  }

  let raw = "";
  req.on("data", (chunk) => {
    raw += chunk;
  });
  req.on("end", () => {
    let body = {};
    try {
      body = JSON.parse(raw);
    } catch {
      /* keep defaults */
    }
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const user = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");
    const paper = buildPaper(system, user);
    const content = "```json\n" + JSON.stringify(paper, null, 2) + "\n```";

    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        id: "chatcmpl-mock",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: body.model ?? "mock",
        choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
        usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
      }),
    );
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock AI provider listening on http://127.0.0.1:${PORT}/v1`);
});
