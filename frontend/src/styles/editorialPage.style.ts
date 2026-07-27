import { createStyles } from "@mantine/core";

const useEditorialPageStyles = createStyles((theme) => ({
  page: {
    position: "relative",
    maxWidth: 1180,
    margin: "0 auto",
    paddingBottom: 64,
    paddingLeft: "clamp(16px, 4vw, 48px)",
    paddingRight: "clamp(16px, 4vw, 48px)",
  },

  header: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "end",
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderBottom: `3px solid ${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]}`,

    [theme.fn.smallerThan("sm")]: {
      gridTemplateColumns: "1fr",
      gap: theme.spacing.sm,
    },
  },

  eyebrow: {
    color: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 3 : 7],
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: 11,
    fontWeight: 800,
  },

  title: {
    marginTop: 10,
    fontSize: "clamp(3rem, 7vw, 6.4rem)",
    lineHeight: 0.95,
  },

  pageNumber: {
    color: theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3],
    fontFamily: "Georgia, \"Times New Roman\", serif",
    fontSize: "clamp(5rem, 12vw, 10rem)",
    fontWeight: 800,
    lineHeight: 0.72,
    letterSpacing: "-0.08em",

    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },

  headerAside: {
    display: "flex",
    alignItems: "flex-end",
    flexDirection: "column",
    gap: theme.spacing.sm,

    [theme.fn.smallerThan("sm")]: {
      alignItems: "flex-start",
      flexDirection: "row",
    },
  },

  description: {
    maxWidth: 640,
    marginTop: 12,
    fontSize: 15,
    lineHeight: 1.55,
  },

  panel: {
    backgroundColor: "transparent",
    borderRadius: 0,
    border: 0,
    borderTop: `2px solid ${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]}`,
    boxShadow: "none",
  },

  panelTitle: {
    fontSize: "clamp(1.35rem, 2vw, 1.8rem)",
    lineHeight: 1.05,
  },

  tableWrap: {
    overflowX: "auto",
    border: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : "rgba(24, 25, 28, 0.16)"}`,
    borderRadius: 0,
  },

  metric: {
    padding: `${theme.spacing.sm}px 0 0`,
    borderTop: `2px solid ${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]}`,
    borderRadius: 0,
  },
}));

export default useEditorialPageStyles;
