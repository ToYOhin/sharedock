import { Box, Button, createStyles, Group, Text, Title } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { TbArrowUpRight, TbCheck, TbClock, TbLock, TbRoute } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import Logo from "../components/Logo";
import Meta from "../components/Meta";
import useConfig from "../hooks/config.hook";
import useUser from "../hooks/user.hook";

const useStyles = createStyles((theme) => ({
  page: {
    paddingBottom: 64,
  },

  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
    gap: "clamp(24px, 5vw, 64px)",
    padding: "clamp(32px, 7vw, 92px) 0 56px",
    borderTop: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : "rgba(24, 25, 28, 0.18)"}`,

    [theme.fn.smallerThan("md")]: {
      gridTemplateColumns: "1fr",
      paddingBottom: 40,
    },
  },

  copy: {
    minWidth: 0,
  },

  eyebrow: {
    alignItems: "center",
    gap: theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: 11,
    fontWeight: 800,
  },

  eyebrowIndex: {
    color: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 3 : 7],
  },

  title: {
    maxWidth: 760,
    marginTop: 26,
    color: theme.colorScheme === "dark" ? theme.white : "#202126",
    fontSize: "clamp(3.15rem, 8.5vw, 7.2rem)",
    lineHeight: 0.91,
    fontWeight: 800,

    [theme.fn.smallerThan("sm")]: {
      fontSize: "clamp(3rem, 15vw, 5.2rem)",
    },
  },

  highlight: {
    color: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 3 : 7],
  },

  description: {
    maxWidth: 560,
    marginTop: 28,
    fontSize: 18,
    lineHeight: 1.55,
  },

  actions: {
    marginTop: 34,
    gap: theme.spacing.sm,

    [theme.fn.smallerThan("xs")]: {
      alignItems: "stretch",
      flexDirection: "column",
    },
  },

  action: {
    minHeight: 46,
  },

  sideNote: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: 18,
    color: theme.colorScheme === "dark" ? theme.colors.dark[1] : theme.colors.gray[6],
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },

  poster: {
    position: "relative",
    display: "flex",
    minHeight: 470,
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    padding: theme.spacing.xl,
    color: "#f6f5f0",
    backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[5] : "#26262b",
    border: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[3] : "#26262b"}`,

    "&::before": {
      position: "absolute",
      top: 22,
      right: 22,
      bottom: 22,
      left: 22,
      border: "1px solid rgba(246, 245, 240, 0.28)",
      content: "\"\"",
      pointerEvents: "none",
    },

    [theme.fn.smallerThan("md")]: {
      minHeight: 330,
    },
  },

  posterKicker: {
    position: "relative",
    zIndex: 1,
    justifyContent: "space-between",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    fontSize: 10,
    fontWeight: 800,
  },

  posterMark: {
    position: "relative",
    zIndex: 1,
    alignSelf: "center",
    margin: "20px 0",
    padding: 18,
    borderRadius: "50%",
    backgroundColor: "#f6f5f0",
  },

  posterTitle: {
    position: "relative",
    zIndex: 1,
    maxWidth: 280,
    fontFamily: "Georgia, \"Times New Roman\", serif",
    fontSize: "clamp(2rem, 4vw, 3.6rem)",
    fontWeight: 800,
    lineHeight: 0.94,
    letterSpacing: "-0.05em",
    textTransform: "uppercase",
  },

  posterFooter: {
    position: "relative",
    zIndex: 1,
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    color: "rgba(246, 245, 240, 0.68)",
    fontSize: 11,
    lineHeight: 1.35,
  },

  featureStrip: {
    display: "grid",
    gridTemplateColumns: "minmax(160px, 0.7fr) 1.3fr",
    gap: theme.spacing.xl,
    padding: "28px 0 8px",
    borderTop: `1px solid ${theme.colorScheme === "dark" ? theme.colors.dark[4] : "rgba(24, 25, 28, 0.18)"}`,

    [theme.fn.smallerThan("sm")]: {
      gridTemplateColumns: "1fr",
      gap: theme.spacing.md,
    },
  },

  featureIntro: {
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: 11,
    fontWeight: 800,
  },

  featureList: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: theme.spacing.lg,

    [theme.fn.smallerThan("sm")]: {
      gridTemplateColumns: "1fr",
      gap: theme.spacing.md,
    },
  },

  feature: {
    paddingTop: theme.spacing.sm,
    borderTop: `2px solid ${theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]}`,
  },

  featureIndex: {
    color: theme.colorScheme === "dark" ? theme.colors.dark[1] : theme.colors.gray[5],
    fontSize: 11,
    fontWeight: 800,
  },

  featureName: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 800,
  },

  featureDescription: {
    marginTop: 5,
    color: theme.colorScheme === "dark" ? theme.colors.dark[1] : theme.colors.gray[6],
    fontSize: 13,
    lineHeight: 1.45,
  },
}));

export default function Home() {
  const { classes } = useStyles();
  const { refreshUser } = useUser();
  const router = useRouter();
  const config = useConfig();
  const [signupEnabled, setSignupEnabled] = useState(true);

  useEffect(() => {
    refreshUser().then((user) => {
      if (user) router.replace("/upload");
    });

    try {
      const allowRegistration = config.get("share.allowRegistration");
      setSignupEnabled(allowRegistration !== false);
    } catch (error) {
      setSignupEnabled(true);
    }
  }, [config]);

  const features = [
    {
      icon: <TbLock size={17} />,
      name: <FormattedMessage id="home.bullet.a.name" />,
      description: <FormattedMessage id="home.bullet.a.description" />,
    },
    {
      icon: <TbClock size={17} />,
      name: <FormattedMessage id="home.bullet.b.name" />,
      description: <FormattedMessage id="home.bullet.b.description" />,
    },
    {
      icon: <TbRoute size={17} />,
      name: <FormattedMessage id="home.bullet.c.name" />,
      description: <FormattedMessage id="home.bullet.c.description" />,
    },
  ];

  const getButtonHref = () => (signupEnabled ? "/auth/signUp" : "/auth/signIn");

  return (
    <Box className={classes.page}>
      <Meta title="Home" />
      <section className={classes.hero}>
        <Box className={classes.copy}>
          <Group className={classes.eyebrow}>
            <Text className={classes.eyebrowIndex}>01</Text>
            <Text>Private file relay / ShareDock</Text>
          </Group>
          <Title className={classes.title} order={1}>
            <FormattedMessage
              id="home.title"
              values={{
                h: (chunks) => <span className={classes.highlight}>{chunks}</span>,
              }}
            />
          </Title>
          <Text className={classes.description} color="dimmed">
            <FormattedMessage id="home.description" />
          </Text>
          <Group className={classes.actions}>
            <Button
              className={classes.action}
              component={Link}
              href={getButtonHref()}
              rightIcon={<TbArrowUpRight size={18} />}
            >
              <FormattedMessage id="home.button.start" />
            </Button>
            <Button
              className={classes.action}
              component={Link}
              href="https://github.com/ToYOhin/sharedock"
              target="_blank"
              variant="default"
            >
              <FormattedMessage id="home.button.source" />
            </Button>
          </Group>
          <Text className={classes.sideNote}>
            <TbCheck size={15} />
            Temporary by design / private by default
          </Text>
        </Box>

        <Box className={classes.poster}>
          <Group className={classes.posterKicker} noWrap>
            <Text>ShareDock</Text>
            <Text>Vol. 09</Text>
          </Group>
          <Box className={classes.posterMark}>
            <Logo width={132} height={132} />
          </Box>
          <Text className={classes.posterTitle}>Drop. Share. Move on.</Text>
          <Group className={classes.posterFooter} noWrap>
            <Text>Self-hosted transfers<br />for real work.</Text>
            <Text>EST. 2026</Text>
          </Group>
        </Box>
      </section>

      <section className={classes.featureStrip}>
        <Text className={classes.featureIntro}>Built for the handoff</Text>
        <Box className={classes.featureList}>
          {features.map((feature, index) => (
            <Box className={classes.feature} key={index}>
              <Group spacing={6} noWrap>
                <Text className={classes.featureIndex}>0{index + 1}</Text>
                {feature.icon}
              </Group>
              <Text className={classes.featureName}>{feature.name}</Text>
              <Text className={classes.featureDescription}>{feature.description}</Text>
            </Box>
          ))}
        </Box>
      </section>
    </Box>
  );
}
