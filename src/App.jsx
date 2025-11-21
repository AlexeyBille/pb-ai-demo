import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function PbAIGenerator() {
    const [theme, setTheme] = useState("dark");
    const [showChat, setShowChat] = useState(true);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text:
                "Привет! Расскажите немного о вашей компании — чем занимаетесь, какого размера команда, какие задачи хотите решить? На основе этого я сформирую персонализированную страницу.",
        },
    ]);

    const [userInput, setUserInput] = useState("");
    const [phase, setPhase] = useState("chat"); // chat -> generating -> revealing -> ready
    const [blocks, setBlocks] = useState([]);
    const [displayedTexts, setDisplayedTexts] = useState([]);
    const timersRef = useRef([]);

    // Templates for blocks with nicer visuals + fixed image URLs
    const blockTemplates = [
        {
            id: "hero",
            title: "Hero",
            image:
                "https://placehold.co/800x600",
            content: "",
            component: (content, typing) => (
                <div className="text-center space-y-6">
                    <img
                        src={
                            "https://placehold.co/800x600"
                        }
                        alt="hero"
                        className="w-full h-72 object-cover rounded-2xl shadow-lg"
                    />
                    <h1 className="text-4xl font-bold text-pink-400">{typing || "Заголовок"}</h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">{content || "Описание"}</p>
                </div>
            ),
        },
        {
            id: "benefits",
            title: "Преимущества",
            component: (content, typing) => (
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        "https://placehold.co/800x600",
                        "https://placehold.co/800x600",
                        "https://placehold.co/800x600",
                    ].map((img, idx) => (
                        <div
                            key={idx}
                            className="bg-gray-800 p-6 rounded-2xl border border-pink-700/40 shadow"
                        >
                            <img src={img} alt={`benefit-${idx}`} className="w-full h-32 object-cover rounded-xl mb-4" />
                            <h3 className="text-xl text-pink-400 font-semibold">Преимущество {idx + 1}</h3>
                            <p className="text-gray-300 text-sm mt-2">{typing || content || "Краткое описание преимущества."}</p>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            id: "cases",
            title: "Кейсы",
            component: (content, typing) => (
                <div className="space-y-6">
                    {[
                        "https://placehold.co/800x600",
                        "https://placehold.co/800x600",
                    ].map((img, idx) => (
                        <div key={idx} className="bg-gray-800 p-6 rounded-2xl border border-pink-700/40 shadow flex gap-4">
                            <img src={img} alt={`case-${idx}`} className="w-40 h-32 object-cover rounded-xl" />
                            <div>
                                <h3 className="text-xl text-pink-400 font-semibold">Кейс {idx + 1}</h3>
                                <p className="text-gray-300 mt-2">{typing || content || "Короткое описание кейса и достигнутых результатов."}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            id: "cta",
            title: "CTA",
            component: (content, typing) => (
                <div className="text-center space-y-4 bg-gradient-to-r from-pink-700 to-pink-500 p-10 rounded-2xl shadow-xl">
                    <h2 className="text-3xl font-bold text-white">{typing || "Готовы обсудить?"}</h2>
                    <p className="text-pink-100">{content || "Оставьте контакты, и мы свяжемся"}</p>
                    <button className="bg-black text-white px-6 py-3 rounded-xl shadow-md">Оставить заявку</button>
                </div>
            ),
        },
        {
            id: "text",
            title: "Текстовый блок",
            component: (content, typing) => (
                <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto text-center">{typing || content || "Развернутый текстовый блок."}</p>
            ),
        },
        {
            id: "articles",
            title: "Статьи",
            component: (content, typing) => (
                <div className="grid md:grid-cols-2 gap-6">
                    {[
                        "https://placehold.co/800x600",
                        "https://placehold.co/800x600",
                    ].map((img, idx) => (
                        <div key={idx} className="bg-gray-800 p-6 rounded-2xl border border-pink-700/40 shadow">
                            <img src={img} alt={`article-${idx}`} className="w-full h-40 object-cover rounded-xl mb-4" />
                            <h3 className="text-xl font-semibold text-pink-300 mb-2">Статья {idx + 1}</h3>
                            <p className="text-gray-300 text-sm">{typing || content || "Краткая выжимка из статьи."}</p>
                        </div>
                    ))}
                </div>
            ),
        },
    ];

    // Simulated AI generation — replace with real API call
    const fakeGenerate = async (prompt) => {
        await new Promise((res) => setTimeout(res, 700));
        // create shallow copies, each with content string
        return blockTemplates.map((b) => ({ ...b, content: `Сгенерированный контент для блока «${b.title}» по запросу: ${prompt}` }));
    };

    // Trigger generation from chat
    const sendMessage = async () => {
        if (!userInput.trim()) return;
        setMessages((m) => [...m, { role: "user", text: userInput }]);
        setUserInput("");
        setPhase("generating");
        setShowChat(false);

        const generated = await fakeGenerate(userInput);

        // initialize displayed texts array to empty strings of same length
        setBlocks(generated);
        setDisplayedTexts(Array(generated.length).fill(""));

        // move to revealing phase; effect below will handle typing animation
        setPhase("revealing");
    };

    // Typing / reveal effect: types each block's content character-by-character.
    useEffect(() => {
        // cleanup previous timers
        timersRef.current.forEach((t) => clearTimeout(t));
        timersRef.current = [];

        if (phase !== "revealing" || blocks.length === 0) return;

        let cancelled = false;

        const startTypingForBlock = (blockIndex, startDelay = 0) => {
            const content = blocks[blockIndex]?.content || "";
            if (!content) return;

            // start after optional delay (stagger blocks)
            const startTimer = setTimeout(async () => {
                if (cancelled) return;
                // type characters one by one
                for (let i = 0; i <= content.length; i++) {
                    if (cancelled) break;
                    // guard i
                    const next = content.slice(0, i);
                    setDisplayedTexts((prev) => {
                        const copy = [...prev];
                        copy[blockIndex] = next;
                        return copy;
                    });
                    // small delay between characters
                    // use await wrapped in Promise for readable control
                    // but ensure we can cancel by checking `cancelled` before awaiting
                    await new Promise((res) => {
                        const t = setTimeout(res, 12);
                        timersRef.current.push(t);
                    });
                }
            }, startDelay);

            timersRef.current.push(startTimer);
        };

        // stagger blocks so they start typing in sequence
        blocks.forEach((b, idx) => {
            const stagger = idx * 400; // ms
            startTypingForBlock(idx, stagger);
        });

        // when all are scheduled, also set a timer to mark phase as ready
        const totalChars = blocks.reduce((s, b) => s + (b.content ? b.content.length : 0), 0);
        const estTotalTime = totalChars * 12 + blocks.length * 400 + 200; // rough estimate
        const finishTimer = setTimeout(() => {
            if (!cancelled) setPhase("ready");
        }, estTotalTime);
        timersRef.current.push(finishTimer);

        return () => {
            cancelled = true;
            timersRef.current.forEach((t) => clearTimeout(t));
            timersRef.current = [];
        };
    }, [phase, blocks]);

    const themeClasses = theme === "dark" ? "bg-black text-pink-200" : "bg-white text-gray-900";

    return (
        <div className={`min-h-screen ${themeClasses} transition-colors duration-300 p-6`}>
            <div className="fixed top-4 right-4 z-50">
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="px-4 py-2 rounded-xl bg-pink-600 text-white shadow">
                    {theme === "dark" ? "Light" : "Dark"}
                </button>
            </div>

            {/* Chat modal */}
            {showChat && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-40 p-4">
                    <div className="bg-gray-900 text-pink-200 w-full max-w-xl p-6 rounded-2xl shadow-lg border border-pink-600/40">
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {messages.map((m, i) => (
                                <div key={i} className={`p-3 rounded-xl whitespace-pre-line ${m.role === "assistant" ? "bg-gray-800 text-pink-200" : "bg-pink-600 text-white ml-auto"}`}>
                                    {m.text}
                                </div>
                            ))}
                        </div>
                        <div className="flex mt-4 gap-2">
                            <input value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Ваш ответ..." className="flex-1 p-3 rounded-xl bg-gray-800 border border-gray-700 text-pink-200" />
                            <button onClick={sendMessage} className="px-5 py-3 bg-pink-600 rounded-xl text-white">→</button>
                        </div>
                        <button onClick={() => setShowChat(false)} className="mt-4 text-center w-full text-pink-400 hover:text-pink-300">Скрыть чат</button>
                    </div>
                </div>
            )}

            {!showChat && (
                <button onClick={() => setShowChat(true)} className="fixed bottom-6 right-6 bg-pink-600 px-4 py-3 rounded-xl text-white shadow-lg z-30">Открыть чат</button>
            )}

            <main className="pt-24 pb-12 max-w-4xl mx-auto space-y-12">
                {blocks.length === 0 && (
                    <div className="rounded-2xl border-dashed border-2 border-gray-700 p-12 text-center text-gray-400">Страница ещё не сгенерирована — откройте чат и расскажите о вашей компании.</div>
                )}

                {blocks.map((block, index) => {
                    const typing = displayedTexts[index] || "";
                    return (
                        <motion.div key={block.id || index} initial={{ opacity: 0, y: 6 }} animate={phase === "ready" ? { opacity: 1, y: 0 } : { opacity: 1 }} transition={{ delay: index * 0.08 }} className="p-8 rounded-2xl bg-gray-900 border border-pink-700/40 shadow-lg">
                            {block.component(block.content, typing)}
                        </motion.div>
                    );
                })}
            </main>
        </div>
    );
}
