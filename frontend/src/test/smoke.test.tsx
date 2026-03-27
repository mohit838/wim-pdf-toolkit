import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { getToolPageCopy } from "../app/site";
import HomePage from "../views/HomePage";
import MergePdfPage from "../views/MergePdfPage";
import RotatePdfPage from "../views/RotatePdfPage";
import SupportPage from "../app/support/page";

vi.mock("../components/AdSlot", () => ({
  default: () => null,
}));

vi.mock("../layouts/MainLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("frontend smoke", () => {
  it("renders the homepage shell and core copy", async () => {
    renderWithProviders(await HomePage());

    expect(
      screen.getByRole("heading", { name: /the complete pdf toolkit you need/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open merge pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /merge pdf/i })).toBeInTheDocument();
  });

  it("renders the merge tool route shell", () => {
    renderWithProviders(<MergePdfPage pageCopy={getToolPageCopy("merge")} />);

    expect(screen.getByRole("heading", { name: /merge pdf/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /merge pdfs/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });

  it("renders a simple tool route from config-driven copy", () => {
    renderWithProviders(<RotatePdfPage pageCopy={getToolPageCopy("rotate")} />);

    expect(screen.getByRole("heading", { name: /rotate pdf/i })).toBeInTheDocument();
    expect(screen.getByText(/rotation angle/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rotate pdf/i })).toBeInTheDocument();
  });

  it("renders the support fallback route", async () => {
    renderWithProviders(await SupportPage());

    expect(screen.getByRole("heading", { name: /need help with the site/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /contact@mohitul-islam\.com/i }).length).toBeGreaterThan(0);
  });
});
