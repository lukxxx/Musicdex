import { Container, Select } from "@chakra-ui/react";
import React, { useState } from "react";
import { Top20 } from "../components/Top20";

export function Home() {
  const [org, setOrg] = useState<string>("Hololive");

  function handle(e: any) {
    setOrg(e.target.value);
  }

  return (
    <Container maxW="container.xl">
      <Select placeholder="Select org" value={org} onChange={handle}>
        <option value="Hololive">Hololive</option>
        <option value="Nijisanji">Nijisanji</option>
        <option value="Independents">Independents</option>
      </Select>
      <Top20 org={org} type="w" />
    </Container>
  );
}
