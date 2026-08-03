"use client";

import { useRef, useEffect } from "react";

export default function ChatInput({ onSend, disabled, isLoading }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    console.log("SUBMIT CLICKED");
    if (e) e.preventDefault();

    const value = textareaRef.current.value.trim();

    if (!value || disabled) return;

    onSend(value);

    textareaRef.current.value = "";
    textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
 console.log("KEY:", e.key);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Message AI Assistant..."
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onInput={autoResize}
          className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] outline-none"
        />

        <button
          type="submit"
          disabled={disabled}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white"
        >
          {isLoading ? "..." : "➤"}
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-gray-400">
        Press Enter to send · Shift + Enter for new line
      </p>
    </form>
  );
}