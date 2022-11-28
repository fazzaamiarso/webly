import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { WebinarItem } from "~/components/webinar-item";
import { prisma } from "~/lib/prisma.server";

export const loader = async () => {
  const webinars = await prisma.webinar.findMany({
    take: 10,
    include: {
      Tickets: { select: { price: true } },
      seller: { select: { name: true } },
    },
  });
  return json(webinars);
};

export default function Index() {
  const webinars = useLoaderData<typeof loader>();

  return (
    <main className="w-11/12 mx-auto space-y-12">
      <section className="w-full h-80 bg-gradient-to-bl from-green-300 via-yellow-300 to-pink-300"></section>
      <section className="w-full">
        <h2 className="font-bold mb-8 text-lg">Featured Webinars</h2>
        <ul className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {webinars.map((w) => (
            <WebinarItem
              key={w.id}
              id={w.id}
              cover={w.coverImg}
              name={w.name}
              startDate={w.startDate}
              tickets={w.Tickets}
              seller={w.seller.name}
            />
          ))}
        </ul>
      </section>
    </main>
  );
}
