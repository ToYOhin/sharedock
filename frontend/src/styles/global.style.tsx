import { Global } from "@mantine/core";

const GlobalStyle = () => {
  return (
    <Global
      styles={(theme) => ({
        a: {
          color: "inherit",
          textDecoration: "none",
        },
        body: {
          backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[8] : "#f6f5f0",
          color:
            theme.colorScheme === "dark" ? theme.colors.gray[1] : "#202126",
          backgroundImage:
            theme.colorScheme === "dark"
              ? "none"
              : "radial-gradient(circle at 15% 0%, rgba(84, 74, 244, 0.06), transparent 28rem)",
        },
        "::selection": {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.fn.rgba(theme.colors[theme.primaryColor][4], 0.5)
              : theme.colors[theme.primaryColor][2],
        },
        "h1, h2, h3, h4, h5, h6": {
          letterSpacing: "-0.035em",
        },
        "table.md, table.md th:nth-of-type(odd), table.md td:nth-of-type(odd)":
          {
            background:
              theme.colorScheme == "dark"
                ? "rgba(50, 50, 50, 0.5)"
                : "rgba(220, 220, 220, 0.5)",
          },
        "table.md td": {
          paddingLeft: "0.5em",
          paddingRight: "0.5em",
        },
        ".mantine-Container-root": {
          width: "100%",
        },
      })}
    />
  );
};
export default GlobalStyle;
