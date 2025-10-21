import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders heading and form", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1, name: /Company Intelligence Builder/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Company website/i)).toBeInTheDocument();
});
