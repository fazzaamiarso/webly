import { RadioGroup } from "@headlessui/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import invariant from "tiny-invariant";
import { prisma } from "~/lib/prisma.server";

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.webinarId, `Expected ${params.webinarId}!`);
  const webinar = await prisma.webinar.findUnique({
    where: { id: params.webinarId },
    include: { Tickets: true },
  });

  return json(webinar);
};

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const ticketId = formData.get("ticket-id");

  return json(null);
};

export default function WebinarDetails() {
  const webinar = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <main className="w-11/12 mx-auto space-y-12 md:grid md:grid-cols-2 md:gap-8 pt-8">
      <section className="space-y-4">
        <h2 className="font-bold mb-2 text-3xl">{webinar?.name}</h2>
        <p>{webinar?.description}</p>
        <p>Meeting via Zoom</p>

        <fetcher.Form method="post" className="space-y-4">
          <RadioGroup name="ticket-id" defaultValue={webinar?.Tickets[0].id}>
            <RadioGroup.Label className="font-semibold">
              Tickets
            </RadioGroup.Label>
            {webinar?.Tickets.map((t) => {
              return (
                <RadioGroup.Option
                  key={t.id}
                  value={t.id}
                  className={({ checked }) =>
                    clsx(
                      "p-4 rounded-md ring-1 w-full space-y-2",
                      checked ? "ring-purple-600" : "ring-black"
                    )
                  }
                >
                  <div className="font-semibold text-lg">${t.price}</div>
                  <p className="text-sm">{t.description}</p>
                  <div className="text-sm">{t.stock} left in stock</div>
                </RadioGroup.Option>
              );
            })}
          </RadioGroup>
          <button className="w-full bg-black text-white py-2 rounded-md">
            Add to cart
          </button>
        </fetcher.Form>
      </section>
      <section className="">
        <div className="">
          <img src={webinar?.coverImg} alt="" className="rounded-md" />
        </div>
      </section>
    </main>
  );
}
