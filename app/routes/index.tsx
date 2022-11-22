import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";

export const loader = async () => {
  const webinars = await prisma.webinar.findMany();
  return json(webinars);
};

export default function Index() {
  const webinars = useLoaderData<typeof loader>();

  return <main>{JSON.stringify(webinars, null, 4)}</main>;
}
