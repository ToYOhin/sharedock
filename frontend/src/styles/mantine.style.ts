import { MantineThemeOverride } from "@mantine/core";

export default <MantineThemeOverride>{
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  headings: {
    fontFamily: "Georgia, \"Times New Roman\", serif",
    fontWeight: 800,
    sizes: {
      h1: { fontSize: "clamp(2.8rem, 7vw, 5.8rem)", lineHeight: 0.98 },
      h2: { fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.04 },
      h3: { fontSize: "1.6rem", lineHeight: 1.1 },
    },
  },
  colors: {
    victoria: [
      "#E2E1F1",
      "#C2C0E7",
      "#A19DE4",
      "#7D76E8",
      "#544AF4",
      "#4940DE",
      "#4239C8",
      "#463FA8",
      "#47428E",
      "#464379",
    ],
  },
  primaryColor: "victoria",
  components: {
    Button: {
      styles: (theme) => ({
        root: {
          fontWeight: 700,
          letterSpacing: "0.02em",
          transition: "transform 150ms ease, box-shadow 150ms ease",
          "&:hover:not(:disabled)": {
            transform: "translateY(-2px)",
            boxShadow:
              theme.colorScheme === "dark"
                ? "0 10px 24px rgba(0, 0, 0, 0.24)"
                : "0 10px 24px rgba(33, 35, 42, 0.12)",
          },
        },
      }),
    },
    Modal: {
      styles: (theme) => ({
        title: {
          fontSize: theme.fontSizes.lg,
          fontWeight: 700,
        },
      }),
    },
    Paper: {
      styles: (theme) => ({
        root: {
          borderColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[4]
              : "rgba(24, 25, 28, 0.14)",
        },
      }),
    },
  },
};
