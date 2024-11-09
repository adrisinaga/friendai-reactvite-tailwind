import "./App.css";
import { requestToGroqAI } from "./utils/groq";
import { useState } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/cjs/styles/prism";

function App() {
  const [data, setData] = useState("");

  const handleSubmit = async () => {
    const ai = await requestToGroqAI(content.value);
    setData(ai);
  };

  return (
    <main className="flex flex-col min-h-[80vh]  justify-center items-center max-w-5xl w-full mx-auto">
      <h1 className="text-4xl text-cyan-600">FRIEND AI</h1>
      <div className="max-w-5xl w-full mx-auto p-4">
        {data ? (
          <SyntaxHighlighter
            language="swift"
            style={darcula}
            wrapLongLines={true}
          >
            {data}
          </SyntaxHighlighter>
        ) : null}
      </div>

      <form className="flex flex-row gap-4 py-4 w-full sticky bottom-0">
        <input
          className="py-2 px-4 text-md rounded-md w-full"
          placeholder="Ask anything"
          id="content"
          type="text"
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-cyan-600 py-4 px-4 font-bold text-white rounded-md"
        >
          Send
        </button>
      </form>
    </main>
  );
}

export default App;
