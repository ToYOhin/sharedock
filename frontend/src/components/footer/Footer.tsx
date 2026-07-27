import { Anchor, createStyles, Footer as MFooter, SimpleGrid, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import useConfig from "../../hooks/config.hook";
import useTranslate from "../../hooks/useTranslate.hook";

const useStyles = createStyles((theme) => ({
  root: {
    borderTop: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : "rgba(24, 25, 28, 0.14)"}`,
    backgroundColor: "transparent",
  },

  text: {
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
}));

const Footer = () => {
  const t = useTranslate();
  const config = useConfig();
  const { classes } = useStyles();
  const hasImprint = !!(
    config.get("legal.imprintUrl") || config.get("legal.imprintText")
  );
  const hasPrivacy = !!(
    config.get("legal.privacyPolicyUrl") ||
    config.get("legal.privacyPolicyText")
  );
  const imprintUrl =
    (!config.get("legal.imprintText") && config.get("legal.imprintUrl")) ||
    "/imprint";
  const privacyUrl =
    (!config.get("legal.privacyPolicyText") &&
      config.get("legal.privacyPolicyUrl")) ||
    "/privacy";

  const isMobile = useMediaQuery("(max-width: 700px)");

  return (
    <MFooter className={classes.root} height="auto" py="md" px="xl" zIndex={100}>
      {!config.get("legal.enabled") && (
        <Text className={classes.text} size="xs" color="dimmed" align="center">
          <Anchor size="xs" href="/NOTICE.md" target="_blank">
            Source notices
          </Anchor>
        </Text>
      )}
      {config.get("legal.enabled") && (
        <SimpleGrid cols={isMobile ? 2 : 3} m={0}>
          {!isMobile && <div></div>}
          <Text className={classes.text} size="xs" color="dimmed" align={isMobile ? "left" : "center"}>
            <Anchor size="xs" href="/NOTICE.md" target="_blank">
              Source notices
            </Anchor>
          </Text>
          <div>
            <Text className={classes.text} size="xs" color="dimmed" align="right">
              {hasImprint && (
                <Anchor size="xs" href={imprintUrl}>
                  {t("imprint.title")}
                </Anchor>
              )}
              {hasImprint && hasPrivacy && " • "}
              {hasPrivacy && (
                <Anchor size="xs" href={privacyUrl}>
                  {t("privacy.title")}
                </Anchor>
              )}
            </Text>
          </div>
        </SimpleGrid>
      )}
    </MFooter>
  );
};

export default Footer;
