import { useEffect, useRef, useState } from "react";
import { APP_PREFIX } from "../lib/constants";

const DRAFT_KEY = `${APP_PREFIX}:new_summary_draft`;

export function useFileInput(onError: (msg: string) => void) {
  const [inputText, setInputText] = useState(() => sessionStorage.getItem(DRAFT_KEY) ?? "");

  useEffect(() => {
    if (inputText) {
      sessionStorage.setItem(DRAFT_KEY, inputText);
    } else {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }, [inputText]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  function readFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      onError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setInputText(reader.result as string);
    reader.onerror = () => onError("Failed to read file");
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

  return {
    inputText,
    setInputText,
    dragging,
    fileInputRef,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
