import { RadioGroup } from "@headlessui/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import invariant from "tiny-invariant";
import { prisma } from "~/lib/prisma.server";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.webinarId, `Expected ${params.webinarId}!`);
  const webinar = await prisma.webinar.findUnique({
    where: { id: params.webinarId },
    include: { Tickets: true },
  });

  return json(webinar);
};

export const action = async ({ request }: ActionArgs) => {
  const user = await authenticator.isAuthenticated(request);
  const formData = await request.formData();
  const ticketId = formData.get("ticket-id");

  invariant(typeof ticketId === "string", "ticketId must be a string");
  invariant(
    typeof user?.userId === "string",
    "Illegal Action, must have a user!"
  );

  await prisma.cart.upsert({
    where: { userId_ticketId: { ticketId, userId: user.userId } },
    create: { ticketId, quantity: 1, userId: user.userId },
    update: { quantity: { increment: 1 } },
  });

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

        <fetcher.Form method="post" className="space-y-6">
          <RadioGroup
            name="ticket-id"
            defaultValue={webinar?.Tickets[0].id}
            className="space-y-2"
          >
            <RadioGroup.Label className="font-semibold">
              Tickets
            </RadioGroup.Label>
            <div className="space-y-4">
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
                    <div className="font-semibold text-lg">
                      {t.price === 0 ? "Free" : `$${t.price}`}
                    </div>
                    <p className="text-sm">{t.description}</p>
                    <div className="text-sm">{t.stock} left in stock</div>
                  </RadioGroup.Option>
                );
              })}
            </div>
          </RadioGroup>
          <button
            className="w-full bg-black text-white py-2 rounded-md"
            disabled={fetcher.state === "submitting"}
          >
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
