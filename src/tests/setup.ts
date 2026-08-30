import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { useLanguageStore } from "@/shared/languageStore";

beforeEach(() => useLanguageStore.setState({ language: "en" }));
afterEach(() => cleanup());
