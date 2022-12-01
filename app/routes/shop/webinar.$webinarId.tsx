import { RadioGroup } from "@headlessui/react";
import { VideoCameraIcon } from "@heroicons/react/24/outline";
import type { Ticket } from "@prisma/client";
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
  invariant(typeof user?.userId === "string", "Illegal Action, must have a user!");

  await prisma.cart.upsert({
    where: { userId_ticketId: { ticketId, userId: user.userId } },
    create: { ticketId, quantity: 1, userId: user.userId },
    update: { quantity: { increment: 1 } },
  });

  return json(null);
};

export default function WebinarDetails() {
  const webinar = useLoaderData<typeof loader>();

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
            Hosted by <span className="font-semibold">{webinar?.seller.name}</span>
          </h3>
        </div>
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-2">Schedules</h3>
          {webinar && (
            <div className="w-full grid grid-cols-2 items-center gap-6 mb-6">
              <ScheduleItem title="Registration Open" dateString={webinar.registrationOpen} />
              <ScheduleItem title="Registration Closed" dateString={webinar.registrationClosed} />
              <ScheduleItem title="Start Date" dateString={webinar.startDate} />
            </div>
          )}
        </div>
        <TicketSelect tickets={webinar?.Tickets ?? []} />
      </section>
      <section className="">
        <div className="">
          <img src={webinar?.coverImg} alt="" className="rounded-md" />
        </div>
      </section>
    </main>
  );
}

const ScheduleItem = ({ title, dateString }: { title: string; dateString: string }) => {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <div>{dayjs(dateString).format("D MMMM YYYY")}</div>
    </div>
  );
};

const TicketSelect = ({ tickets }: { tickets: Ticket[] }) => {
  const fetcher = useFetcher();

  const isBusy = fetcher.state !== "idle";
  const ticketPriceAscending = tickets.sort((a, b) => a.price - b.price);

  return (
    <fetcher.Form method="post" className="space-y-6">
      <RadioGroup name="ticket-id" defaultValue={tickets[0].id} className="space-y-2">
        <RadioGroup.Label className="text-lg font-semibold">Tickets</RadioGroup.Label>
        <div className="grid md:grid-cols-2 gap-x-4">
          {ticketPriceAscending.map((t) => {
            return (
              <RadioGroup.Option
                key={t.id}
                value={t.id}
                className={({ checked }) =>
                  clsx(
                    "p-4 rounded-md ring-1 w-full space-y-2 self-stretch cursor-pointer ",
                    checked ? "ring-gray-700 ring-2" : "ring-gray-400"
                  )
                }
              >
                <div className="font-semibold">{t.price === 0 ? "Free" : `$${t.price}`}</div>
                <p className="text-sm pb-2">{t.description}</p>
                <div className="text-sm font-semibold">{t.stock} tickets left</div>
              </RadioGroup.Option>
            );
          })}
        </div>
      </RadioGroup>
      <button className="w-full bg-black text-white py-2 rounded-md" disabled={isBusy}>
        Add to cart
      </button>
    </fetcher.Form>
  );
};
