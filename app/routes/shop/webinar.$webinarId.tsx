import { RadioGroup } from "@headlessui/react";
import { VideoCameraIcon } from "@heroicons/react/24/outline";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import dayjs from "dayjs";
import invariant from "tiny-invariant";
import { prisma } from "~/lib/prisma.server";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.webinarId, `Expected ${params.webinarId}!`);
  const webinar = await prisma.webinar.findUnique({
    where: { id: params.webinarId },
    include: { Tickets: true, seller: { select: { name: true } } },
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
    <main className="w-11/12 mx-auto space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 pt-8">
      <section className="space-y-10">
        <div>
          <h2 className="font-bold mb-2 text-3xl">{webinar?.name}</h2>
          <p className="mb-4">{webinar?.description}</p>
          <p className="flex items-center gap-2">
            <VideoCameraIcon className="h-5 aspect-square" /> Meeting via Zoom
          </p>
        </div>
        <div>
          <h3>
            Hosted by{" "}
            <span className="font-semibold">{webinar?.seller.name}</span>
          </h3>
        </div>
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-2">Schedules</h3>
          <div className="w-full flex items-center gap-10 mb-6">
            <div>
              <h4 className="font-medium">Registration Open</h4>
              <div>
                {dayjs(webinar?.registrationOpen).format("D MMMM YYYY")}
              </div>
            </div>
            <div>
              <h4 className="font-medium">Registration Close</h4>
              <div>
                {dayjs(webinar?.registrationClosed).format("D MMMM YYYY")}
              </div>
            </div>
          </div>
          <div>
            <div>
              <h4 className="font-medium">Start Date</h4>
              <div>{dayjs(webinar?.startDate).format("D MMMM YYYY")}</div>
            </div>
          </div>
        </div>
        <fetcher.Form method="post" className="space-y-6">
          <RadioGroup
            name="ticket-id"
            defaultValue={webinar?.Tickets[0].id}
            className="space-y-2"
          >
            <RadioGroup.Label className="text-lg font-semibold">
              Tickets
            </RadioGroup.Label>
            <div className="grid md:grid-cols-2 gap-x-4">
              {webinar?.Tickets.sort((a, b) => a.price - b.price).map((t) => {
                return (
                  <RadioGroup.Option
                    key={t.id}
                    value={t.id}
                    className={({ checked }) =>
                      clsx(
                        "p-4 rounded-md ring-1 w-full space-y-2 self-stretch cursor-pointer",
                        checked ? "ring-purple-600 ring-2" : "ring-black"
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
