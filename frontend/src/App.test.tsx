import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders hero heading and form", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1, name: /Win more government contracts/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Company website/i)).toBeInTheDocument();
});
