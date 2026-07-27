import { Button, Center, Container, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import Logo from "../../components/Logo";
import Meta from "../../components/Meta";

const Intro = () => {
  return (
    <>
      <Meta title="Intro" />
      <Container size="xs">
        <Stack>
          <Center>
            <Logo height={80} width={80} />
          </Center>
          <Center>
            <Title order={2}>Welcome to ShareDock</Title>
          </Center>
          <Text>
            ShareDock is your private file relay for temporary links, reverse
            uploads, screenshots, and small-team handoffs.
          </Text>
          <Text>
            Start by checking the general configuration, then upload a small
            test file and verify the share link flow.
          </Text>
          <Text mt="lg">How do you want to continue?</Text>
          <Stack>
            <Button href="/admin/config/general" component={Link}>
              Customize configuration
            </Button>
            <Button href="/" component={Link} variant="light">
              Explore ShareDock
            </Button>
          </Stack>
        </Stack>
      </Container>
    </>
  );
};

export default Intro;
